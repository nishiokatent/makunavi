// Open-Meteo client + 1 hour localStorage cache
// https://open-meteo.com/

const CACHE_TTL_MS = 60 * 60 * 1000  // 1 hour
const FORECAST_KEY = 'wx_forecast_v4'  // v4: 午前/午後データ追加
const GEO_KEY      = 'wx_geo_v3'       // v3: state_district対応

export interface PeriodForecast {
  weatherCode: number
  precipProb:  number  // %
}

export interface DailyForecast {
  date:        string  // YYYY-MM-DD
  weatherCode: number
  tempMax:     number
  tempMin:     number
  precipProb:  number  // %
  windMaxMs:   number  // m/s
  am?:         PeriodForecast  // 6:00-12:00
  pm?:         PeriodForecast  // 12:00-18:00
}

export interface ForecastBundle {
  cityLabel: string
  daily:     DailyForecast[]
  fetchedAt: number  // ms
}

export interface GeoResult {
  lat:   number
  lon:   number
  label: string  // 表示用 (○○市○○区 など)
}

// ─────────────────────────────────────────────
// 住所文字列から表示用ラベルを抽出
// 例: "京都府京都市下京区" → "京都市下京区"
//     "大阪府大阪市"       → "大阪市"
//     "東京都新宿区"       → "新宿区"
// ─────────────────────────────────────────────
function extractCityLabel(address: string): string {
  let s = address.trim()
  // 北海道・東京都を先に除去（都/道がそのまま都市名に含まれるため個別処理）
  s = s.replace(/^北海道/, '').replace(/^東京都/, '')
  // ○○府 / ○○県 を除去（府・県は都市名に出現しないので安全）
  s = s.replace(/^.{2,4}[府県]/, '')
  // 除去後が空になった場合はもとの住所を使う
  if (!s) return address
  // ○○市○○区 → 優先
  const m1 = s.match(/^(.+?市.+?[区])/)
  if (m1) return m1[1]
  // ○○市 / ○○区 / ○○町 / ○○村
  const m2 = s.match(/^(.+?[市区町村])/)
  if (m2) return m2[1]
  return s
}

// Nominatim の addressdetails からラベルを組み立て
// 日本の住所体系では Nominatim は次のように分類することが多い:
//   - state          → 都道府県 (京都府, 大阪府, 東京都)
//   - state_district → 政令指定都市・市 (京都市, 大阪市) ← 重要
//   - city           → 区/町/村 (下京区, 新宿区) または市
//   - suburb         → 区/町名 (下京区, 中央区)
//   - city_district  → 区
//   - town/village   → 町・村
function labelFromNominatim(addr: Record<string, string>, fallback: string): string {
  // 市レベル (政令指定都市優先)
  const cityLevel =
    addr.state_district ||  // 京都市, 大阪市, 札幌市
    addr.city ||
    addr.town ||
    addr.village ||
    ''
  // 区レベル
  const wardLevel =
    addr.city_district ||
    addr.suburb ||
    addr.quarter ||
    ''

  // city と ward が同じ場合（東京23区など、cityに「新宿区」が入るケース）
  if (cityLevel && wardLevel && cityLevel !== wardLevel) {
    return `${cityLevel}${wardLevel}`
  }
  if (cityLevel) return cityLevel
  if (wardLevel) return wardLevel
  return fallback
}

// ─────────────────────────────────────────────
// Geocoding: Nominatim → 都道府県座標フォールバック
// ─────────────────────────────────────────────
export async function geocodeAddress(
  address: string,
  prefCoords: Record<string, [number, number]>,
): Promise<GeoResult | null> {
  if (!address?.trim()) return null

  // キャッシュヒット
  try {
    const raw = localStorage.getItem(`${GEO_KEY}:${address}`)
    if (raw) return JSON.parse(raw) as GeoResult
  } catch { /* noop */ }

  // Nominatim (addressdetails=1 で構造化住所を取得)
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=jp&accept-language=ja&addressdetails=1`,
    )
    const j = await r.json()
    if (Array.isArray(j) && j.length) {
      const result: GeoResult = {
        lat:   parseFloat(j[0].lat),
        lon:   parseFloat(j[0].lon),
        label: labelFromNominatim(j[0].address ?? {}, extractCityLabel(address)),
      }
      try { localStorage.setItem(`${GEO_KEY}:${address}`, JSON.stringify(result)) } catch { /* noop */ }
      return result
    }
  } catch { /* noop */ }

  // フォールバック: 都道府県座標
  const pref = Object.keys(prefCoords).find(p => address.includes(p))
  if (pref) {
    return { lat: prefCoords[pref][0], lon: prefCoords[pref][1], label: extractCityLabel(address) || pref }
  }
  return null
}

// 天気の「悪さ」を数値化(雨/雪/雷ほど大きい) → 時間帯のweather_codeを統合する際に使用
function severity(code: number): number {
  if (code >= 95)              return 100  // 雷雨
  if (code >= 71 && code <= 86) return 80  // 雪
  if (code >= 51 && code <= 82) return 70  // 雨
  if (code === 45 || code === 48) return 50 // 霧
  if (code === 3)              return 30   // 曇り
  if (code === 2)              return 20   // 晴れ時々曇り
  if (code === 1)              return 10   // ほぼ晴れ
  if (code === 0)              return 5    // 晴れ
  return 0
}

// ─────────────────────────────────────────────
// Forecast (Open-Meteo)
// ─────────────────────────────────────────────
export async function fetchForecast(geo: GeoResult): Promise<ForecastBundle> {
  const cacheKey = `${FORECAST_KEY}:${geo.lat.toFixed(2)}_${geo.lon.toFixed(2)}`

  // キャッシュヒット
  try {
    const raw = localStorage.getItem(cacheKey)
    if (raw) {
      const cached = JSON.parse(raw) as ForecastBundle
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached
    }
  } catch { /* noop */ }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${geo.lat}&longitude=${geo.lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
    `&hourly=weather_code,precipitation_probability` +
    `&timezone=Asia%2FTokyo&forecast_days=7&wind_speed_unit=ms`

  const r = await fetch(url)
  if (!r.ok) throw new Error(`Open-Meteo error ${r.status}`)
  const j = await r.json()

  // 各日の 午前(6:00-12:00) / 午後(12:00-18:00) サマリー
  const periodByDate: Record<string, { am: PeriodForecast; pm: PeriodForecast }> = {}
  if (j.hourly?.time) {
    j.hourly.time.forEach((iso: string, idx: number) => {
      // iso 例: "2026-04-30T09:00"
      const date = iso.slice(0, 10)
      const hour = parseInt(iso.slice(11, 13), 10)
      if (!periodByDate[date]) {
        periodByDate[date] = {
          am: { weatherCode: 0, precipProb: 0 },
          pm: { weatherCode: 0, precipProb: 0 },
        }
      }
      const wc = j.hourly.weather_code[idx] ?? 0
      const pp = j.hourly.precipitation_probability[idx] ?? 0
      const slot =
        hour >= 6  && hour < 12 ? periodByDate[date].am :
        hour >= 12 && hour < 18 ? periodByDate[date].pm : null
      if (!slot) return
      // 最も悪い天気コード(severity優先)を採用
      if (severity(wc) > severity(slot.weatherCode)) slot.weatherCode = wc
      // 降水確率は最大値を採用
      if (pp > slot.precipProb) slot.precipProb = pp
    })
  }

  const daily: DailyForecast[] = j.daily.time.map((d: string, i: number) => ({
    date:        d,
    weatherCode: j.daily.weather_code[i],
    tempMax:     Math.round(j.daily.temperature_2m_max[i]),
    tempMin:     Math.round(j.daily.temperature_2m_min[i]),
    precipProb:  j.daily.precipitation_probability_max[i] ?? 0,
    windMaxMs:   j.daily.wind_speed_10m_max[i] ?? 0,
    am:          periodByDate[d]?.am,
    pm:          periodByDate[d]?.pm,
  }))

  const bundle: ForecastBundle = { cityLabel: geo.label, daily, fetchedAt: Date.now() }
  try { localStorage.setItem(cacheKey, JSON.stringify(bundle)) } catch { /* noop */ }
  return bundle
}
