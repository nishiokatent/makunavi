import Link from 'next/link'
import { type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/layout/LogoutButton'
import AppNav from '@/components/layout/AppNav'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name, plan, is_monitor').eq('id', user.id).single()
    : { data: null }

  let unreadCount = 0
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    unreadCount = count ?? 0
  }

  const planLabel = profile?.is_monitor
    ? 'モニター'
    : profile?.plan === 'lite' ? 'ライト' : 'スタンダード'

  const planColor = profile?.is_monitor
    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
    : profile?.plan === 'standard'
    ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30'
    : 'bg-white/10 text-blue-200 border border-white/10'

  const displayName = profile?.display_name || user?.email?.split('@')[0] || ''
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex h-full min-h-screen">
      {/* ===== サイドバー ===== */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col relative"
        style={{
          background: 'linear-gradient(180deg, #0f1d45 0%, #1A2F6E 50%, #1e3578 100%)',
        }}
      >
        {/* テントストライプ */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 14px,
              rgba(255,255,255,0.018) 14px,
              rgba(255,255,255,0.018) 28px
            )`,
          }}
        />

        {/* ロゴ */}
        <Link
          href="/dashboard"
          className="relative flex items-center gap-3 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          {/* テントアイコン */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #E8342A, #c42820)' }}
          >
            <svg width="22" height="19" viewBox="0 0 22 19" fill="none">
              <path d="M11 1 L21 18 H1 Z" fill="white" opacity="0.95"/>
              <line x1="11" y1="1" x2="11" y2="18" stroke="rgba(232,52,42,0.5)" strokeWidth="1"/>
              <rect x="8.5" y="11" width="5" height="7" rx="0.5" fill="rgba(232,52,42,0.35)"/>
            </svg>
          </div>
          <div>
            <div
              className="text-sm font-black text-white leading-none tracking-wide"
              style={{ fontFamily: 'Noto Serif JP, serif' }}
            >
              幕ナビ
            </div>
            <div className="text-[9px] text-blue-300 mt-0.5 tracking-widest uppercase font-medium">
              Tent Business Tool
            </div>
          </div>
        </Link>

        {/* ナビゲーション */}
        <AppNav
          plan={profile?.plan ?? null}
          isMonitor={profile?.is_monitor ?? false}
          unreadCount={unreadCount}
        />

        {/* フッター：ユーザー情報 + ログアウト */}
        <div className="relative px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            {/* アバター */}
            <div className="w-8 h-8 rounded-full bg-[#E8342A]/80 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium truncate leading-none">
                {displayName || user?.email || ''}
              </div>
              <div className="mt-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${planColor}`}>
                  {planLabel}
                </span>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ===== メインコンテンツ ===== */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
        {children}
      </main>
    </div>
  )
}
