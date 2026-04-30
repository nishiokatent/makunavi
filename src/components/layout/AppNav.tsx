'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    label: 'ホーム',
    sub: null,
    plan: null,
  },
  {
    href: '/tenmitsukun',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    label: 'てんみつ君',
    sub: '見積もり自動生成',
    plan: null,
  },
  {
    href: '/tentsukun',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    label: 'てんつ君',
    sub: 'シミュレーター',
    plan: 'standard',
  },
  {
    href: '/yojakugp',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    label: '要尺GP',
    sub: 'スピードチャレンジ',
    plan: 'standard',
  },
  {
    href: '/tentalk',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    label: 'テントーク',
    sub: 'テント屋SNS',
    plan: null,
  },
  {
    href: '/notifications',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    label: '通知',
    sub: null,
    plan: null,
  },
  {
    href: '/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    label: '設定',
    sub: null,
    plan: null,
  },
]

type Props = {
  plan: string | null
  isMonitor: boolean
  unreadCount: number
}

export default function AppNav({ plan, isMonitor, unreadCount }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 py-3 space-y-0.5 px-3 overflow-y-auto">
      {NAV_ITEMS.map(item => {
        const locked = item.plan === 'standard' && plan === 'lite' && !isMonitor
        const isActive = pathname === item.href
          || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        const isNotifications = item.href === '/notifications'

        return (
          <Link
            key={item.href}
            href={locked ? '/pricing' : item.href}
            className={`
              group flex items-center gap-3 px-3 py-2.5 rounded-xl
              transition-all duration-150 relative
              ${isActive
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-blue-200/80 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {/* アクティブ左ボーダー */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#E8342A] rounded-r" />
            )}

            {/* アイコン */}
            <span className="relative flex-shrink-0">
              {item.icon}
              {isNotifications && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#E8342A] text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>

            {/* テキスト */}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold leading-tight">{item.label}</div>
              {item.sub && (
                <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-blue-200' : 'text-blue-400'}`}>
                  {item.sub}
                </div>
              )}
            </div>

            {/* ロックバッジ */}
            {locked && (
              <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black tracking-wide flex-shrink-0">
                STD
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
