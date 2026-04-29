'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── アイコン ─────────────────────────────────────────────
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={active ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22" fill={active ? 'white' : 'none'} stroke="currentColor"/>
  </svg>
)

const QuoteIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={active ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8" fill={active ? 'white' : 'none'} stroke="currentColor"/>
    <line x1="16" y1="13" x2="8" y2="13" stroke={active ? 'white' : 'currentColor'}/>
    <line x1="16" y1="17" x2="8" y2="17" stroke={active ? 'white' : 'currentColor'}/>
  </svg>
)

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={active ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const BellIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={active ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor"/>
  </svg>
)

const MenuIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" fill={active ? 'currentColor' : 'none'} stroke="currentColor"/>
    <path d="M8 12h8M12 8v8" stroke={active ? 'white' : 'currentColor'}/>
  </svg>
)

// ─── ナビアイテム ────────────────────────────────────────
type Item = {
  href: string
  Icon: React.FC<{ active: boolean }>
  label: string
  hasBadge?: boolean
}

const ITEMS: Item[] = [
  { href: '/dashboard',      Icon: HomeIcon,  label: 'ホーム' },
  { href: '/tenmitsukun',    Icon: QuoteIcon, label: 'てんみつ' },
  { href: '/tentalk',        Icon: ChatIcon,  label: 'テントーク' },
  { href: '/notifications',  Icon: BellIcon,  label: '通知', hasBadge: true },
  { href: '/profile',        Icon: MenuIcon,  label: 'メニュー' },
]

type Props = {
  unreadCount: number
}

export default function BottomNav({ unreadCount }: Props) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 safe-bottom"
      style={{ boxShadow: '0 -4px 16px rgba(26,47,110,0.06)' }}
    >
      <div className="grid grid-cols-5 h-16">
        {ITEMS.map(item => {
          const isActive = pathname === item.href
            || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center gap-0.5
                touch-target transition-all duration-150 active:scale-95
                ${isActive
                  ? 'text-[#1A2F6E]'
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              {/* アクティブ時の上部インジケーター */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[#E8342A] rounded-b-full" />
              )}

              {/* アイコン + バッジ */}
              <span className="relative">
                <item.Icon active={isActive} />
                {item.hasBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-[#E8342A] text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>

              {/* ラベル */}
              <span className={`text-[10px] leading-none ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
