import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/layout/LogoutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, company_name, plan, is_monitor')
    .eq('id', user.id)
    .single()

  const planLabel = profile?.is_monitor
    ? 'モニター（創業メンバー）'
    : profile?.plan === 'lite' ? 'ライト' : 'スタンダード'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* ヘッダー */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-[#1A2F6E]" style={{ fontFamily: 'Noto Serif JP, serif' }}>
          設定
        </h1>
        <p className="text-xs text-gray-500 mt-1">アカウント情報とサービスについて</p>
      </div>

      {/* ユーザーカード */}
      <div className="bg-gradient-to-br from-[#1A2F6E] to-[#2a4fab] rounded-2xl px-5 py-4 mb-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-blue-200 mb-0.5">ようこそ</div>
            <div className="font-bold truncate">{profile?.display_name || user.email?.split('@')[0]}</div>
            {profile?.company_name && (
              <div className="text-xs text-blue-200 truncate mt-0.5">{profile.company_name}</div>
            )}
          </div>
          <span className="text-[10px] bg-white/15 border border-white/30 rounded-full px-2 py-0.5 font-bold whitespace-nowrap">
            {planLabel}
          </span>
        </div>
      </div>

      {/* アカウント */}
      <SectionTitle>アカウント</SectionTitle>
      <List>
        <Item href="/settings/account" icon={<UserIcon />} label="アカウント情報" sub="会社名・名前・連絡先など" />
      </List>

      {/* サービス */}
      <SectionTitle>サービス</SectionTitle>
      <List>
        <Item href="/settings/contact"  icon={<MailIcon />}    label="お問い合わせ" sub="ご意見・ご要望はこちら" />
        <Item href="/settings/faq"      icon={<QuestionIcon/>} label="よくあるご質問（FAQ）" />
        <Item href="/settings/privacy"  icon={<LockIcon />}    label="プライバシーポリシー" />
        <Item href="/settings/terms"    icon={<DocIcon />}     label="利用規約" />
      </List>

      {/* ログアウト */}
      <div className="mt-6">
        <LogoutButton />
      </div>

      <div className="text-center mt-8 text-[10px] text-gray-300">
        幕ナビ（Maku Navi）— Tent Business Tool
      </div>
    </div>
  )
}

// ─── UI helpers ───────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-5 mb-2 px-1">
      {children}
    </h2>
  )
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {children}
    </div>
  )
}

function Item({
  href, icon, label, sub,
}: {
  href: string
  icon: React.ReactNode
  label: string
  sub?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0"
    >
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#1A2F6E] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 flex-shrink-0">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </Link>
  )
}

// ─── Icons ────────────────────────────────────
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
function QuestionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}
