'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { loadMaster } from '@/lib/tenmitsukun/supabase-storage'
import { PREF_COORDS } from '@/lib/tenmitsukun/locations'
import { geocodeAddress, fetchForecast, type DailyForecast } from '@/lib/weather/openMeteo'
import { wmoToInfo, iconUrl } from '@/lib/weather/wmoIcons'

// 施工注意の閾値（降水確率のみで判定）
const RAIN_TH = 50  // 降水確率 ≥ 50%

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

  return (
    <Shell title={`${city}の週間天気`}>
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex sm:grid sm:grid-cols-7 gap-2 min-w-max sm:min-w-0">
          {daily.map((d, i) => <DayCard key={d.date} d={d} index={i} />)}
        </div>
      </div>
    </Shell>
  )
}

// ─────────────────────────────────────────────
// 1日カード（コンパクト＋読みやすさ重視）
// ─────────────────────────────────────────────
function DayCard({ d, index }: { d: DailyForecast; index: number }) {
  const info     = wmoToInfo(d.weatherCode)
  const advisory = d.precipProb >= RAIN_TH

  const dt    = new Date(d.date + 'T00:00:00+09:00')
  const wDays = ['日', '月', '火', '水', '木', '金', '土']
  const wd    = wDays[dt.getDay()]
  const md    = `${dt.getMonth() + 1}/${dt.getDate()}`
  const dayLabel = index === 0 ? '今日' : index === 1 ? '明日' : wd
  const dayColor =
    index === 0 ? 'text-[#1A2F6E]' :
    dt.getDay() === 0 ? 'text-[#E8342A]' :
    dt.getDay() === 6 ? 'text-sky-600' :
    'text-gray-700'

  return (
    <div
      className={`flex-shrink-0 w-[78px] sm:w-auto rounded-xl border-[1.5px] px-1.5 py-2 flex flex-col items-center gap-1 transition-colors ${
        advisory
          ? 'bg-amber-50 border-amber-300'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* 曜日（大きめ・太字） */}
      <div className={`text-sm font-black ${dayColor} leading-none`}>{dayLabel}</div>
      {/* 日付 */}
      <div className="text-[10px] font-mono text-gray-400 leading-none">{md}</div>

      {/* アイコン */}
      <Image
        src={iconUrl(info.icon)}
        alt={info.label}
        width={48}
        height={48}
        unoptimized
        className="w-11 h-11 my-0.5"
      />

      {/* 気温（縦並びで太く） */}
      <div className="flex items-baseline gap-1 font-mono leading-none">
        <span className="text-[15px] font-black text-[#E8342A]">{d.tempMax}°</span>
        <span className="text-[11px] font-semibold text-sky-600">{d.tempMin}°</span>
      </div>

      {/* 降水確率 */}
      <div className={`flex items-center gap-0.5 text-[11px] font-bold font-mono leading-none ${
        d.precipProb >= RAIN_TH ? 'text-sky-700' :
        d.precipProb >= 30      ? 'text-sky-600' :
        'text-gray-400'
      }`}>
        <DropletIcon className="w-2.5 h-2.5" />
        {d.precipProb}%
      </div>

      {/* 施工注意（雨の日のみ） */}
      {advisory && (
        <div className="mt-0.5 inline-flex items-center bg-amber-500 text-white text-[10px] font-black rounded-full px-2 py-0.5 leading-none whitespace-nowrap">
          施工注意
        </div>
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
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-2 sm:p-3">
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
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg bg-gray-50 animate-pulse" />
      ))}
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
// インラインSVGアイコン（emoji 不使用）
// ─────────────────────────────────────────────
function DropletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5c-3.5 5-7 8.5-7 12.5a7 7 0 0 0 14 0c0-4-3.5-7.5-7-12.5z" />
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
