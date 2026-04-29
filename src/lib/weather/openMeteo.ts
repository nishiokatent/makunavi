// Open-Meteo client + 1 hour localStorage cache
// https://open-meteo.com/

const CACHE_TTL_MS = 60 * 60 * 1000  // 1 hour
const FORECAST_KEY = 'wx_forecast'
const GEO_KEY      = 'wx_geo'

export interface DailyForecast {
  date:        string  // YYYY-MM-DD
  weatherCode: number
  tempMax:     number
  tempMin:     number
  precipProb:  number  // %
  windMaxMs:   number  // m/s
}

export interface ForecastBundle {
  cityLabel: string
  daily:     DailyForecast[]
  fetchedAt: number  // ms
}

export interface GeoResult {
  lat:   number
  lon:   number
  label: string  // 表示用 (○○市 など)
}

// ─────────────────────────────────────────────
// Geocoding: Nominatim → 都道府県座標フォールバック
// ─────────────────────────────────────────────
export async function geocodeAddress(
  address: string,
  prefCoords: Record<string, [number, number]>,
): Promise<GeoResult | null> {
  if (!address?.trim()) return null

  // Cache hit
  try {
    const raw = localStorage.getItem(`${GEO_KEY}:${address}`)
    if (raw) return JSON.parse(raw) as GeoResult
  } catch { /* noop */ }

  // Nominatim
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=jp&accept-language=ja`,
    )
    const j = await r.json()
    if (Array.isArray(j) && j.length) {
      const result: GeoResult = {
        lat:   parseFloat(j[0].lat),
        lon:   parseFloat(j[0].lon),
        label: extractCityLabel(address),
      }
      try { localStorage.setItem(`${GEO_KEY}:${address}`, JSON.stringify(result)) } catch { /* noop */ }
      return result
    }
  } catch { /* noop */ }

  // Fallback: 都道府県座標
  const pref = Object.keys(prefCoords).find(p => address.includes(p))
  if (pref) {
    return { lat: prefCoords[pref][0], lon: prefCoords[pref][1], label: extractCityLabel(address) || pref }
  }
  return null
}

function extractCityLabel(address: string): string {
  const m = address.match(/([^都道府県\s]+?[市区町村])/)
  return m ? m[1] : address
}

// ─────────────────────────────────────────────
// Forecast (Open-Meteo)
// ─────────────────────────────────────────────
export async function fetchForecast(geo: GeoResult): Promise<ForecastBundle> {
  const cacheKey = `${FORECAST_KEY}:${geo.lat.toFixed(2)}_${geo.lon.toFixed(2)}`

  // Cache hit
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
    `&timezone=Asia%2FTokyo&forecast_days=7&wind_speed_unit=ms`

  const r = await fetch(url)
  if (!r.ok) throw new Error(`Open-Meteo error ${r.status}`)
  const j = await r.json()

  const daily: DailyForecast[] = j.daily.time.map((d: string, i: number) => ({
    date:        d,
    weatherCode: j.daily.weather_code[i],
    tempMax:     Math.round(j.daily.temperature_2m_max[i]),
    tempMin:     Math.round(j.daily.temperature_2m_min[i]),
    precipProb:  j.daily.precipitation_probability_max[i] ?? 0,
    windMaxMs:   j.daily.wind_speed_10m_max[i] ?? 0,
  }))

  const bundle: ForecastBundle = { cityLabel: geo.label, daily, fetchedAt: Date.now() }
  try { localStorage.setItem(cacheKey, JSON.stringify(bundle)) } catch { /* noop */ }
  return bundle
}
