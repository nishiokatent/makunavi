'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { loadMaster } from '@/lib/tenmitsukun/supabase-storage'
import { PREF_COORDS } from '@/lib/tenmitsukun/locations'
import { geocodeAddress, fetchForecast, type DailyForecast, type PeriodForecast } from '@/lib/weather/openMeteo'
import { wmoToInfo, iconUrl } from '@/lib/weather/wmoIcons'

// 施工注意の閾値
const RAIN_TH    = 50   // 降水確率 ≥ 50%
const WIND_TH    = 10   // 風速 ≥ 10 m/s
const SHOW_WIND  = 7    // 風速 ≥ 7 m/s で風速表示

type Status = 'loading' | 'no-master' | 'no-coord' | 'error' | 'ok'

export default function WeatherCard() {
  const [status, setStatus] = useState<Status>('loading')
  const [city,   setCity]   = useState('')
  const [daily,  setDaily]  = useState<DailyForecast[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (!cancelled) setStatus('error'); return }
        const m = await loadMaster(user.id)
        if (!m.company?.trim()) { if (!cancelled) setStatus('no-master'); return }
        const geo = await geocodeAddress(m.company, PREF_COORDS)
        if (!geo) { if (!cancelled) setStatus('no-coord'); return }
        const bundle = await fetchForecast(geo)
        if (cancelled) return
        setCity(bundle.cityLabel)
        setDaily(bundle.daily)
        setStatus('ok')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (status === 'loading')   return <Shell><Skeleton /></Shell>
  if (status === 'no-master') return <Shell><SetupNotice /></Shell>
  if (status === 'no-coord')  return <Shell><GenericNotice text="会社所在地を解析できませんでした。マスタの「会社所在地」を「○○県○○市」のように入力してください。" /></Shell>
  if (status === 'error')     return <Shell><GenericNotice text="天気情報の取得に失敗しました。時間をおいて再度お試しください。" /></Shell>

  const detailDays  = daily.slice(0, 3)  // 今日・明日・明後日
  const compactDays = daily.slice(3)     // 4日目以降

  return (
    <Shell title={`${city}の週間天気`}>
      {/* 上段：詳細表示3日 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {detailDays.map((d, i) => <DetailCard key={d.date} d={d} index={i} />)}
      </div>

      {/* 下段：コンパクト4日 */}
      {compactDays.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
          {compactDays.map((d, i) => <CompactCard key={d.date} d={d} index={i + 3} />)}
        </div>
      )}
    </Shell>
  )
}

// ─────────────────────────────────────────────
// 詳細カード（今日・明日・明後日）
// ─────────────────────────────────────────────
function DetailCard({ d, index }: { d: DailyForecast; index: number }) {
  const advisory = d.precipProb >= RAIN_TH || d.windMaxMs >= WIND_TH
  const showWind = wmoToInfo(d.weatherCode).rainy || d.windMaxMs >= SHOW_WIND

  const dt    = new Date(d.date + 'T00:00:00+09:00')
  const wDays = ['日', '月', '火', '水', '木', '金', '土']
  const wd    = wDays[dt.getDay()]
  const md    = `${dt.getMonth() + 1}/${dt.getDate()}`
  const dayLabel = index === 0 ? '今日' : index === 1 ? '明日' : '明後日'
  const dayColor =
    index === 0 ? 'text-[#1A2F6E]' :
    dt.getDay() === 0 ? 'text-[#E8342A]' :
    dt.getDay() === 6 ? 'text-sky-600' :
    'text-gray-700'

  return (
    <div
      className={`rounded-xl border px-3 py-3 transition-colors ${
        advisory
          ? 'bg-amber-50/60 border-amber-200'
          : 'bg-white border-gray-100'
      }`}
    >
      {/* ヘッダー: 日付 */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-base font-bold ${dayColor}`}>{dayLabel}</span>
          <span className="text-[10px] text-gray-400 font-mono">{wd} {md}</span>
        </div>
        {advisory && (
          <span className="inline-flex items-center gap-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
            <AlertIcon className="w-2.5 h-2.5" />
            施工注意
          </span>
        )}
      </div>

      {/* 午前/午後 */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <PeriodBlock label="午前" period={d.am} />
        <PeriodBlock label="午後" period={d.pm} />
      </div>

      {/* 気温と風速 */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-1">
        <div className="flex items-baseline gap-1.5 font-mono leading-none">
          <span className="text-base font-bold text-[#E8342A]">{d.tempMax}°</span>
          <span className="text-gray-300">/</span>
          <span className="text-xs text-sky-600">{d.tempMin}°</span>
        </div>
        {showWind && (
          <div className={`flex items-center gap-1 text-[11px] font-mono ${
            d.windMaxMs >= WIND_TH ? 'text-amber-700 font-bold' : 'text-gray-500'
          }`}>
            <WindIcon className="w-3 h-3" />
            {d.windMaxMs.toFixed(1)}<span className="text-[9px] ml-0.5">m/s</span>
          </div>
        )}
      </div>
    </div>
  )
}

// 午前 / 午後ブロック
function PeriodBlock({ label, period }: { label: string; period?: PeriodForecast }) {
  if (!period) {
    return (
      <div className="bg-gray-50 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400 w-7 flex-shrink-0">{label}</span>
        <span className="text-[10px] text-gray-300 ml-1">—</span>
      </div>
    )
  }
  const info = wmoToInfo(period.weatherCode)
  return (
    <div className="bg-gray-50 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 font-medium w-7 flex-shrink-0">{label}</span>
      <Image
        src={iconUrl(info.icon)}
        alt={info.label}
        width={28}
        height={28}
        unoptimized
        className="w-7 h-7 flex-shrink-0"
      />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[10px] text-gray-700 font-medium truncate">{info.label}</span>
        <span className={`text-[10px] font-mono inline-flex items-center gap-0.5 ${
          period.precipProb >= RAIN_TH ? 'text-sky-700 font-bold' :
          period.precipProb >= 30      ? 'text-sky-600' :
          'text-gray-400'
        }`}>
          <DropletIcon className="w-2 h-2" />
          {period.precipProb}%
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// コンパクトカード（4日目以降）
// ─────────────────────────────────────────────
function CompactCard({ d, index }: { d: DailyForecast; index: number }) {
  const info     = wmoToInfo(d.weatherCode)
  const advisory = d.precipProb >= RAIN_TH || d.windMaxMs >= WIND_TH

  const dt    = new Date(d.date + 'T00:00:00+09:00')
  const wDays = ['日', '月', '火', '水', '木', '金', '土']
  const wd    = wDays[dt.getDay()]
  const md    = `${dt.getMonth() + 1}/${dt.getDate()}`
  const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
  const dayColor =
    dt.getDay() === 0 ? 'text-[#E8342A]' :
    dt.getDay() === 6 ? 'text-sky-600' :
    'text-gray-600'

  return (
    <div
      className={`rounded-lg border px-1.5 pt-1.5 pb-1.5 flex flex-col items-center gap-0.5 transition-colors ${
        advisory
          ? 'bg-amber-50/60 border-amber-200'
          : 'bg-gray-50/50 border-gray-100'
      }`}
    >
      <div className={`text-[11px] font-bold ${dayColor}`}>{wd}</div>
      <div className={`text-[9px] font-mono ${isWeekend ? dayColor : 'text-gray-400'}`}>{md}</div>
      <Image
        src={iconUrl(info.icon)}
        alt={info.label}
        width={36}
        height={36}
        unoptimized
        className="w-8 h-8 sm:w-9 sm:h-9"
      />
      <div className="flex items-baseline gap-0.5 font-mono leading-none">
        <span className="text-[11px] font-bold text-[#E8342A]">{d.tempMax}°</span>
        <span className="text-[9px] text-sky-600">{d.tempMin}°</span>
      </div>
      <div className={`flex items-center gap-0.5 text-[9px] font-mono ${
        d.precipProb >= RAIN_TH ? 'text-sky-700 font-bold' :
        d.precipProb >= 30      ? 'text-sky-600' :
        'text-gray-400'
      }`}>
        <DropletIcon className="w-2 h-2" />
        {d.precipProb}%
      </div>
      {advisory && (
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="施工注意" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Shell（共通枠）
// ─────────────────────────────────────────────
function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 sm:mb-7">
      <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-700 mb-2.5 sm:mb-3 flex items-center gap-2 uppercase tracking-wide">
        <span className="w-1 h-4 bg-[#E8342A] rounded inline-block" />
        {title ?? '週間天気'}
      </h2>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 sm:p-4">
        {children}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// プレースホルダー / 通知
// ─────────────────────────────────────────────
function Skeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-gray-50 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-50 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function SetupNotice() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-2">
      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
        <AlertIcon className="w-5 h-5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-800 mb-0.5">会社所在地が未設定です</div>
        <div className="text-xs text-gray-500 leading-relaxed">
          てんみつ君のマスタで「会社所在地」を設定すると、その地域の週間天気予報がここに表示されます。
        </div>
      </div>
      <Link
        href="/tenmitsukun?tab=master"
        className="text-xs font-bold bg-[#1A2F6E] text-white px-4 py-2 rounded-lg whitespace-nowrap hover:bg-[#16295e] transition-colors"
      >
        設定する
      </Link>
    </div>
  )
}

function GenericNotice({ text }: { text: string }) {
  return (
    <div className="text-xs text-gray-500 py-2 text-center">
      {text}
    </div>
  )
}

// ─────────────────────────────────────────────
// インラインSVGアイコン
// ─────────────────────────────────────────────
function DropletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5c-3.5 5-7 8.5-7 12.5a7 7 0 0 0 14 0c0-4-3.5-7.5-7-12.5z" />
    </svg>
  )
}

function WindIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 16h15a3 3 0 1 1-3 3" />
      <path d="M3 12h9" />
    </svg>
  )
}

function AlertIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 1 21h22L12 2zm0 6 7.5 13h-15L12 8zm-1 5v3h2v-3h-2zm0 5v2h2v-2h-2z" />
    </svg>
  )
}
