'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/* ===========================================================
   Hooks
   =========================================================== */
function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ===========================================================
   Tool color palette
   =========================================================== */
const TOOL_THEMES = {
  tenmitsu: {
    base: '#2b7a54',      // forest green
    soft: '#e8f3ec',
    deep: '#1e5a3d',
    tint: 'rgba(43,122,84,0.08)',
  },
  tentsu: {
    base: '#c96a3a',      // terracotta
    soft: '#fbeee3',
    deep: '#9a4d28',
    tint: 'rgba(201,106,58,0.08)',
  },
  yojaku: {
    base: '#c49a1f',      // gold
    soft: '#faf3dd',
    deep: '#8f6e10',
    tint: 'rgba(196,154,31,0.08)',
  },
  tentalk: {
    base: '#3a6fa8',      // sky
    soft: '#e6eef6',
    deep: '#27527f',
    tint: 'rgba(58,111,168,0.08)',
  },
} as const

/* ===========================================================
   Data
   =========================================================== */
const NAV = [
  { href: '#about', label: 'About' },
  { href: '#tools', label: 'Tools' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#referral', label: 'Referral' },
  { href: '#faq', label: 'FAQ' },
]

const PROBLEMS = [
  {
    no: '01',
    title: '夜、見積もりで帰れない。',
    body: '生地を決めて、巾を計算して、流れ寸を書き出して──電卓を叩き続ける。1件30分。気がつけば22時。',
  },
  {
    no: '02',
    title: '要尺が分かるのは、社長だけ。',
    body: '経験で組み上がった計算式は、ベテランの頭の中にしかない。若手は聞きにくいし、いつまでも任せられない。',
  },
  {
    no: '03',
    title: '写真は撮るけど、投稿はしない。',
    body: 'きれいな現場だな、と思ってスマホを出す。でも文章が書けない。ハッシュタグも分からない。そのまま閉じる。',
  },
]

const SOLUTIONS = [
  {
    no: '01',
    label: 'Quote',
    title: '見積もりは、3分で終わる。',
    body: '生地と寸法を選ぶだけ。巾・流れ・裁ち寸まで自動で計算。PDFでそのまま渡せます。',
    kpi: '92%',
    kpiSub: 'の時間短縮',
    color: '#2b7a54',
  },
  {
    no: '02',
    label: 'Training',
    title: '要尺は、毎日5問で身につく。',
    body: '通勤中にスマホでポチポチ。ゲーム感覚で続けられて、気づけば社長の計算に追いついている。',
    kpi: '5問',
    kpiSub: '／日の積み上げ',
    color: '#c49a1f',
  },
  {
    no: '03',
    label: 'AI',
    title: '投稿文は、AIが書く。',
    body: '施工内容を打ち込むだけで、テントーク用とInstagram用の文章を同時生成。あとは送信だけ。',
    kpi: '2媒体',
    kpiSub: '同時に出力',
    color: '#3a6fa8',
  },
]

const TOOLS = [
  {
    id: 'tenmitsu',
    index: '01',
    name: 'てんみつ君',
    eng: 'Tent Auto Quote',
    tagline: '見積もりを、つくる。',
    desc: '生地・寸法を選ぶと、巾・流れ・裁ち寸まで自動計算。PDFでそのまま提出できます。',
    features: ['生地データベース内蔵', '巾・流れ・裁ち寸の自動算出', 'PDF見積書の即時出力', '過去見積もりの再利用'],
    theme: TOOL_THEMES.tenmitsu,
  },
  {
    id: 'tentsu',
    index: '02',
    name: 'てんつ君',
    eng: 'Fabric Simulator',
    tagline: '生地を、見せる。',
    desc: '施工写真の上に候補の生地を合成。お客様の目の前で、張替後のイメージを共有できます。',
    features: ['写真への生地合成', 'Before / After 同時表示', 'Web Share で即共有', '提案資料への書き出し'],
    theme: TOOL_THEMES.tentsu,
  },
  {
    id: 'yojaku',
    index: '03',
    name: '要尺GP',
    eng: 'Yojaku Grand Prix',
    tagline: '要尺を、遊ぶ。',
    desc: '5問の要尺計算をスピード勝負。タイムが記録され、全国ランキングで同業者と競えます。',
    features: ['5問スピードチャレンジ', 'タイム計測・ベスト更新', '全国ランキング', '新人教育のきっかけに'],
    theme: TOOL_THEMES.yojaku,
  },
  {
    id: 'tentalk',
    index: '04',
    name: 'テントーク',
    eng: 'Tent Industry SNS',
    tagline: '同業者と、つながる。',
    desc: '施工写真のタイムラインと、AIによる投稿文の自動生成。テント屋だけが集まる、静かなSNS。',
    features: ['施工写真タイムライン', 'AI投稿文の自動生成', 'Instagram用コピー同時出力', 'いいね・コメント機能'],
    theme: TOOL_THEMES.tentalk,
  },
]

const PLAN_FEATURES = [
  '見積もり自動計算（テント専用）',
  '巾・流れ・裁ち寸 自動算出',
  'PDF 見積書の出力',
  '生地張替シミュレーター',
  '要尺グランプリ',
  'テントーク（専用SNS）',
  'AI 投稿文自動生成',
  'PC・スマホ・タブレット対応',
  'クラウド保存（端末変更OK）',
  '以降の機能追加もすべて込み',
]

const VOICES = [
  {
    company: '関東・テント施工会社',
    role: '代表',
    text: '1件30分かかっていた見積もりが、5分で出せる。お客様を待たせなくなったし、夜の時間が返ってきました。',
  },
  {
    company: '九州・幕屋',
    role: '営業',
    text: '投稿文を書くのがとにかく苦手で。いまはAIに任せて、写真だけ選んでいます。毎週出せるようになった。',
  },
  {
    company: '東海・テント屋',
    role: '工場長',
    text: '新人教育に要尺GPを使っています。「負けたくない」って自分から練習するんですよ。ゲームってすごい。',
  },
]

const FAQS = [
  {
    q: '本当にテント屋が作ったんですか？',
    a: 'はい。西岡テント（京都）の西岡が、自分たちが使いたくて開発しました。IT会社ではなく、現場で巾を測っている人間が設計しています。',
  },
  {
    q: 'スマホでも使えますか？',
    a: 'PC・スマホ・タブレットすべてで動きます。PWA対応なので、ホーム画面に追加すればアプリのように起動できます。',
  },
  {
    q: 'データはどこに保存されますか？',
    a: 'クラウド（Supabase）に暗号化して保存されます。端末が変わってもデータは消えず、スマホが壊れても安心です。',
  },
  {
    q: '解約したらデータは消えますか？',
    a: '解約後90日間はデータが保持されます。その間に再登録すれば、そのまま元通りに戻せます。',
  },
  {
    q: '他の見積もりソフトと何が違いますか？',
    a: 'テント屋専用であることが、すべての違いです。巾計算・流れ寸・裁ち寸の自動化はもちろん、生地シミュレーター・要尺ゲーム・業界SNSまで一本にまとまっています。',
  },
  {
    q: 'カーテンの見積もりもできますか？',
    a: '現在は固定テント専用ですが、カーテン対応も近日リリース予定です。要望の多い機能から順に追加しています。',
  },
  {
    q: '途中で解約できますか？',
    a: 'いつでも可能です。違約金や解約手数料はありません。マイページから数クリックで完了します。',
  },
  {
    q: 'カード以外の支払い方法はありますか？',
    a: '現在はクレジットカードのみです（Stripe決済）。カード情報は幕ナビのサーバーには保存されません。',
  },
  {
    q: '紹介コードはどこで取得できますか？',
    a: 'ログイン後、マイページ → 紹介プログラム から取得できます。コードをシェアするだけで紹介が成立します。',
  },
  {
    q: '紹介したら本当にギフト券がもらえますか？',
    a: '紹介した相手が3ヶ月継続した時点で、登録メールアドレスに¥3,000分のAmazonギフト券を自動送付します。紹介数に上限はありません。',
  },
]

/* ===========================================================
   Reveal wrapper
   =========================================================== */
function Reveal({
  children, className = '', delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { ref, visible } = useInView()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ===========================================================
   Primary CTA
   =========================================================== */
function PrimaryCTA({ label = '無料で始める', size = 'md' }: { label?: string; size?: 'md' | 'lg' }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <Link
        href="/login"
        className={`
          group inline-flex items-center justify-center
          bg-[#d63228] hover:bg-[#bf2a21] text-white font-bold tracking-wide
          rounded-full
          shadow-[0_8px_20px_-6px_rgba(214,50,40,0.4)]
          hover:shadow-[0_12px_24px_-6px_rgba(214,50,40,0.5)]
          active:scale-[0.98] transition-all duration-200
          ${size === 'lg' ? 'text-[14px] px-9 py-4 gap-2.5' : 'text-[13px] px-7 py-3.5 gap-2'}
        `}
      >
        <span>{label}</span>
        <svg
          className="transition-transform duration-300 group-hover:translate-x-0.5"
          width={size === 'lg' ? 16 : 14} height={size === 'lg' ? 16 : 14}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </Link>
      <p className="text-[10.5px] text-gray-500 tracking-wide">
        1ヶ月無料／カード登録のみ／いつでも解約OK
      </p>
    </div>
  )
}

/* ===========================================================
   Section heading
   =========================================================== */
function SectionHead({
  eyebrow, title, sub, accent = '#1A2F6E', invert = false,
}: {
  eyebrow: string
  title: React.ReactNode
  sub?: React.ReactNode
  accent?: string
  invert?: boolean
}) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className="inline-flex items-center gap-2.5 text-[10px] font-bold tracking-[0.3em] uppercase mb-5" style={{ color: accent }}>
        <span className="w-5 h-[1px]" style={{ background: accent }} />
        {eyebrow}
        <span className="w-5 h-[1px]" style={{ background: accent }} />
      </p>
      <h2
        className={`text-[22px] sm:text-[26px] md:text-[32px] font-black leading-[1.4] tracking-tight ${invert ? 'text-white' : 'text-gray-900'}`}
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        {title}
      </h2>
      {sub && (
        <p className={`mt-5 text-[13px] md:text-[14px] leading-[1.95] ${invert ? 'text-white/70' : 'text-gray-500'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

/* ===========================================================
   Tool Illustrations (SVG)
   =========================================================== */
type ToolTheme = { base: string; soft: string; deep: string; tint: string }
function ToolIllustration({ id, theme }: { id: string; theme: ToolTheme }) {
  const s = { stroke: theme.deep, fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (id === 'tenmitsu') {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <rect x="18" y="12" width="52" height="64" rx="3" {...s} />
        <path d="M28 28 H60" {...s} />
        <path d="M28 38 H54" {...s} />
        <path d="M28 48 H58" {...s} />
        <path d="M28 58 H48" {...s} />
        <rect x="52" y="55" width="14" height="14" rx="2" fill={theme.base} opacity="0.18" />
        <path d="M56 62 L59 65 L64 59" stroke={theme.base} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }
  if (id === 'tentsu') {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <rect x="12" y="18" width="64" height="48" rx="3" {...s} />
        <line x1="44" y1="18" x2="44" y2="66" stroke={theme.deep} strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="14" y="20" width="28" height="44" fill={theme.base} opacity="0.08" />
        <path d="M16 28 L40 28 M16 36 L40 36 M16 44 L40 44 M16 52 L40 52 M16 60 L40 60" stroke={theme.base} strokeWidth="0.8" opacity="0.4" />
        <path d="M48 26 L72 26 M48 34 L68 34 M48 42 L70 42 M48 50 L64 50 M48 58 L72 58" stroke={theme.base} strokeWidth="0.8" opacity="0.8" />
      </svg>
    )
  }
  if (id === 'yojaku') {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <circle cx="44" cy="48" r="22" {...s} />
        <path d="M44 18 V24" {...s} />
        <path d="M38 14 H50" {...s} />
        <path d="M44 48 L44 32" stroke={theme.base} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M44 48 L56 52" stroke={theme.base} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="44" cy="48" r="2.5" fill={theme.deep} />
        <path d="M44 26 L44 28 M62 48 L60 48 M44 70 L44 68 M26 48 L28 48" stroke={theme.deep} strokeWidth="1.2" />
      </svg>
    )
  }
  if (id === 'tentalk') {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <path d="M14 22 H58 C60 22 62 24 62 26 V52 C62 54 60 56 58 56 H32 L22 64 V56 H14 C12 56 10 54 10 52 V26 C10 24 12 22 14 22 Z" {...s} />
        <rect x="18" y="30" width="36" height="2" rx="1" fill={theme.base} opacity="0.5" />
        <rect x="18" y="36" width="28" height="2" rx="1" fill={theme.base} opacity="0.4" />
        <rect x="18" y="42" width="22" height="2" rx="1" fill={theme.base} opacity="0.3" />
        <circle cx="66" cy="30" r="10" fill={theme.base} opacity="0.12" />
        <path d="M62 30 L65 33 L70 28" stroke={theme.base} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }
  return null
}

/* ===========================================================
   Page
   =========================================================== */
export default function LPPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [planTab, setPlanTab] = useState<'standard' | 'referral'>('standard')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ============================================================
          NAV
          ============================================================ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#faf6ed]/90 backdrop-blur-xl border-b border-[#e8ddc8]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1180px] mx-auto px-5 md:px-8 h-[56px] flex items-center justify-between">
          <Link href="/lp" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#1A2F6E] flex items-center justify-center">
              <span className="text-white text-[11px] font-black" style={{ fontFamily: "'Noto Serif JP', serif" }}>幕</span>
            </div>
            <div>
              <p className="text-[13px] font-black leading-none tracking-wider text-gray-900" style={{ fontFamily: "'Noto Serif JP', serif" }}>幕ナビ</p>
              <p className="text-[8px] mt-1 tracking-[0.2em] text-gray-400">MAKU NAVI</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[11px] font-semibold tracking-[0.15em] text-gray-600 hover:text-[#1A2F6E] transition-colors">
                {n.label}
              </a>
            ))}
            <Link href="/login" className="text-[11px] font-bold tracking-wide px-5 py-2 rounded-full bg-[#1A2F6E] text-white hover:bg-[#0f1d45] transition-colors">
              ログイン
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================================
          HERO — warm paper feel
          ============================================================ */}
      <section className="relative pt-[56px] overflow-hidden" style={{ background: '#faf6ed' }}>
        {/* Subtle paper texture (warm diagonal stripe) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, transparent 0, transparent 28px, rgba(180,140,80,0.045) 28px, rgba(180,140,80,0.045) 56px)',
          }}
        />
        {/* Large tent line drawing on the right */}
        <svg
          className="absolute -right-32 top-1/2 -translate-y-1/2 text-[#1A2F6E]/[0.07] pointer-events-none hidden lg:block"
          width="700" height="700" viewBox="0 0 700 700" fill="none"
        >
          <path d="M350 60 L640 620 H60 Z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M350 120 L580 600 H120 Z" stroke="currentColor" strokeWidth="0.8" />
          <line x1="350" y1="60" x2="350" y2="620" stroke="currentColor" strokeWidth="0.8" />
        </svg>
        {/* Small red dot in corner */}
        <div className="absolute top-24 right-8 md:right-16 w-3 h-3 rounded-full bg-[#d63228] hidden md:block" />

        <div className="relative max-w-[1180px] mx-auto px-5 md:px-8 py-20 md:py-28 lg:py-32 grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <Reveal>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-[1.5px] bg-[#d63228]" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-[#d63228]">
                  テント屋の道具箱
                </span>
              </div>
            </Reveal>

            <h1
              className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-black leading-[1.2] tracking-tight text-[#1a2a4f] mb-8"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              <Reveal delay={100}>
                <span className="block">テント屋の仕事を、</span>
              </Reveal>
              <Reveal delay={180}>
                <span className="block">
                  ちょっと<span className="relative inline-block">
                    楽にする
                    <span className="absolute left-0 right-0 bottom-[-2px] h-[6px] bg-[#d63228]/20 -z-0" />
                  </span>。
                </span>
              </Reveal>
            </h1>

            <Reveal delay={280}>
              <p className="text-[14px] md:text-[15px] leading-[2] text-gray-700 max-w-lg mb-10">
                見積もり、生地シミュレーション、要尺計算、SNS投稿。
                別々に開いていた画面が、ひとつになりました。
                月額¥3,980。最初の1ヶ月は無料で試せます。
              </p>
            </Reveal>

            <Reveal delay={380}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <PrimaryCTA size="lg" />
                <a href="#tools" className="text-[12px] font-bold tracking-wide text-[#1A2F6E] hover:text-[#d63228] transition-colors inline-flex items-center gap-2">
                  機能を見る
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right: editorial spec card */}
          <Reveal delay={450}>
            <div className="relative">
              <div className="relative bg-white rounded-lg border border-[#e8ddc8] shadow-[0_20px_50px_-20px_rgba(26,47,110,0.15)] overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-2 px-5 py-2.5 bg-[#1A2F6E] text-white">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <p className="text-[9px] tracking-[0.25em] font-bold ml-2">MAKU NAVI / 2026</p>
                </div>

                <div className="p-6 md:p-8 space-y-5">
                  <div className="flex justify-between items-baseline pb-4 border-b border-dashed border-[#e8ddc8]">
                    <p className="text-[10px] tracking-[0.22em] text-gray-400 font-bold">PLAN</p>
                    <p className="text-[13px] font-bold text-gray-900">スタンダード</p>
                  </div>
                  <div className="flex justify-between items-baseline pb-4 border-b border-dashed border-[#e8ddc8]">
                    <p className="text-[10px] tracking-[0.22em] text-gray-400 font-bold">MONTHLY</p>
                    <p className="text-[22px] font-black text-[#1A2F6E]" style={{ fontFamily: "'Noto Serif JP', serif" }}>¥3,980</p>
                  </div>
                  <div className="flex justify-between items-baseline pb-4 border-b border-dashed border-[#e8ddc8]">
                    <p className="text-[10px] tracking-[0.22em] text-gray-400 font-bold">TRIAL</p>
                    <p className="text-[13px] font-bold text-gray-900">1ヶ月無料</p>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-[10px] tracking-[0.22em] text-gray-400 font-bold">TOOLS</p>
                    <p className="text-[13px] font-bold text-gray-900">4種すべて込み</p>
                  </div>

                  {/* Color dots showing each tool */}
                  <div className="flex items-center gap-2 pt-2">
                    {Object.values(TOOL_THEMES).map((t, i) => (
                      <span key={i} className="w-5 h-5 rounded-full" style={{ background: t.base }} />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1 tracking-wide">× 4 tools</span>
                  </div>
                </div>
              </div>

              {/* Stamp-like tag */}
              <div className="absolute -top-3 -right-3 rotate-6 bg-[#d63228] text-white text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded-sm shadow-md">
                1ヶ月 無料
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          ABOUT
          ============================================================ */}
      <section id="about" className="relative py-20 md:py-28 px-5 md:px-8 bg-white">
        <div className="max-w-[980px] mx-auto">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 items-start">
            <Reveal>
              <div>
                <p className="text-[9px] tracking-[0.3em] text-[#d63228] font-bold uppercase mb-2">About</p>
                <p className="text-[11px] text-gray-400 font-mono tracking-wider">— 001</p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <h2
                  className="text-[22px] md:text-[30px] font-black leading-[1.5] tracking-tight text-gray-900 mb-8"
                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                >
                  テント屋が、<br />
                  自分のために作りました。
                </h2>
                <div className="space-y-4 text-[13.5px] leading-[2] text-gray-600 max-w-xl">
                  <p>
                    京都でテントを張っている、西岡といいます。
                    うちは父から引き継いだ小さなテント屋で、
                    毎日現場に出て、夜に見積もりを作って、週末にHPを更新しようとして諦める──
                    そんな生活を20年続けてきました。
                  </p>
                  <p>
                    市販のソフトは試しました。でも巾計算は入っていないし、
                    要尺の考え方も違う。結局エクセルに戻る。
                    「テント屋のためのソフトは、テント屋が作らないと無理だ」
                    と思って、開発を始めました。
                  </p>
                  <p>
                    幕ナビは、私たちが毎日使うためのツールです。
                    同じように困っている同業者の方に、少しでも楽になってもらえたら嬉しいです。
                  </p>
                </div>
                <div className="mt-10 flex items-center gap-3">
                  <span className="h-[1px] w-8 bg-gray-300" />
                  <p className="text-[10px] tracking-[0.22em] text-gray-500 uppercase font-bold">
                    West Hill ／ 西岡テント・西岡
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          PROBLEMS
          ============================================================ */}
      <section className="relative py-20 md:py-28 px-5 md:px-8" style={{ background: '#faf6ed' }}>
        <div className="max-w-[1180px] mx-auto">
          <Reveal>
            <SectionHead
              eyebrow="Problems"
              accent="#d63228"
              title={<>こういうこと、<br className="sm:hidden" />ありませんか。</>}
              sub={<>開発のきっかけになった、私たち自身の悩みです。</>}
            />
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-4 md:gap-5 max-w-[1000px] mx-auto">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.no} delay={i * 100}>
                <div className="bg-white h-full p-6 md:p-7 rounded-xl border border-[#e8ddc8] hover:border-[#d63228]/30 hover:shadow-[0_10px_30px_-15px_rgba(214,50,40,0.25)] transition-all duration-400">
                  <div className="flex items-baseline gap-3 mb-5">
                    <span
                      className="text-[28px] leading-none font-black text-[#d63228]"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      {p.no}
                    </span>
                    <span className="w-6 h-[1px] bg-[#e8ddc8]" />
                  </div>
                  <h3
                    className="text-[15.5px] md:text-[16.5px] font-black leading-[1.55] text-gray-900 mb-3"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-[12.5px] leading-[1.9] text-gray-500">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SOLUTIONS
          ============================================================ */}
      <section className="relative py-20 md:py-28 px-5 md:px-8 bg-white">
        <div className="max-w-[1180px] mx-auto">
          <Reveal>
            <SectionHead
              eyebrow="Solutions"
              title={<>幕ナビで、こう変わります。</>}
              sub={<>3つの武器で、日々の摩擦を1つずつ無くしていきます。</>}
            />
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-5 md:gap-6 max-w-[1000px] mx-auto">
            {SOLUTIONS.map((s, i) => (
              <Reveal key={s.no} delay={i * 100}>
                <div
                  className="h-full p-6 md:p-7 rounded-xl border relative overflow-hidden group transition-all duration-400"
                  style={{
                    borderColor: `${s.color}25`,
                    background: `linear-gradient(180deg, ${s.color}06 0%, transparent 100%)`,
                  }}
                >
                  {/* Color bar top */}
                  <span className="absolute top-0 left-0 h-[3px] w-12 rounded-full" style={{ background: s.color }} />

                  <div className="flex items-center justify-between mb-5 mt-2">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-300">— {s.no}</span>
                  </div>

                  <h3
                    className="text-[17px] md:text-[18px] font-black leading-[1.5] text-gray-900 mb-3"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-[12.5px] leading-[1.9] text-gray-600 mb-6">{s.body}</p>

                  <div className="flex items-baseline gap-2 pt-4 border-t" style={{ borderColor: `${s.color}20` }}>
                    <span
                      className="text-[28px] md:text-[32px] font-black leading-none"
                      style={{ fontFamily: "'Noto Serif JP', serif", color: s.color }}
                    >
                      {s.kpi}
                    </span>
                    <span className="text-[11px] text-gray-500">{s.kpiSub}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TOOLS — each with its own color & illustration
          ============================================================ */}
      <section id="tools" className="relative py-20 md:py-28 px-5 md:px-8" style={{ background: '#faf6ed' }}>
        <div className="max-w-[1180px] mx-auto">
          <Reveal>
            <SectionHead
              eyebrow="Tools"
              accent="#d63228"
              title={<>4つの道具、ひとつの契約。</>}
              sub={<>すべてブラウザで動きます。アプリインストールは不要です。</>}
            />
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 gap-5 md:gap-6">
            {TOOLS.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <article
                  className="group relative bg-white rounded-xl p-6 md:p-7 border transition-all duration-400 h-full hover:-translate-y-0.5"
                  style={{
                    borderColor: `${t.theme.base}25`,
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: `0 20px 40px -20px ${t.theme.base}40` }}
                  />

                  <div className="relative flex items-start gap-5">
                    {/* Illustration block */}
                    <div
                      className="shrink-0 w-[88px] h-[88px] rounded-lg flex items-center justify-center"
                      style={{ background: t.theme.soft }}
                    >
                      <ToolIllustration id={t.id} theme={t.theme} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold font-mono tracking-[0.15em]"
                          style={{ color: t.theme.base }}
                        >
                          {t.index}
                        </span>
                        <span className="text-[9px] text-gray-400 tracking-[0.22em] uppercase font-bold">
                          {t.eng}
                        </span>
                      </div>
                      <h3
                        className="text-[18px] md:text-[19px] font-black text-gray-900 mb-1"
                        style={{ fontFamily: "'Noto Serif JP', serif" }}
                      >
                        {t.name}
                      </h3>
                      <p
                        className="text-[12.5px] font-bold mb-3"
                        style={{ color: t.theme.deep }}
                      >
                        {t.tagline}
                      </p>
                      <p className="text-[12.5px] leading-[1.9] text-gray-500">
                        {t.desc}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div
                    className="mt-5 pt-5 border-t"
                    style={{ borderColor: `${t.theme.base}18` }}
                  >
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[11.5px] text-gray-600 leading-[1.5]">
                          <svg className="w-3 h-3 shrink-0 mt-0.5" style={{ color: t.theme.base }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          PRICING
          ============================================================ */}
      <section id="pricing" className="relative py-20 md:py-28 px-5 md:px-8 bg-white">
        <div className="max-w-[1180px] mx-auto">
          <Reveal>
            <SectionHead
              eyebrow="Pricing"
              title={<>プランは、ひとつだけ。</>}
              sub={<>全機能込みで月額¥3,980。迷う要素をなくしました。</>}
            />
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-12 max-w-[720px] mx-auto">
              {/* Tab switcher */}
              <div className="relative flex items-center p-1 bg-[#f0ebdf] rounded-full w-full max-w-sm mx-auto mb-8">
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-[0_2px_8px_rgba(26,47,110,0.1)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: planTab === 'standard' ? 'translateX(0)' : 'translateX(calc(100% + 8px))' }}
                />
                <button
                  onClick={() => setPlanTab('standard')}
                  className={`relative flex-1 py-2.5 text-[12px] font-bold tracking-wide transition-colors duration-300 ${
                    planTab === 'standard' ? 'text-[#1A2F6E]' : 'text-gray-500'
                  }`}
                >
                  通常登録
                </button>
                <button
                  onClick={() => setPlanTab('referral')}
                  className={`relative flex-1 py-2.5 text-[12px] font-bold tracking-wide transition-colors duration-300 flex items-center justify-center gap-1.5 ${
                    planTab === 'referral' ? 'text-[#1A2F6E]' : 'text-gray-500'
                  }`}
                >
                  紹介コード登録
                </button>
              </div>

              {/* Plan card */}
              <div className="relative bg-white rounded-2xl border border-[#e8ddc8] shadow-[0_20px_50px_-20px_rgba(26,47,110,0.15)] overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#2b7a54] via-[#c49a1f] to-[#3a6fa8]" />

                <div className="p-6 md:p-8 grid md:grid-cols-[1fr_1fr] gap-6 md:gap-10 items-start">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.28em] text-[#1A2F6E] uppercase mb-3">
                      Standard
                    </p>
                    <h3
                      className="text-[20px] md:text-[24px] font-black leading-tight text-gray-900 mb-3"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      幕ナビ スタンダード
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-4">
                      <span
                        className="text-[38px] md:text-[44px] font-black leading-none text-[#1A2F6E]"
                        style={{ fontFamily: "'Noto Serif JP', serif" }}
                      >
                        ¥3,980
                      </span>
                      <span className="text-gray-400 text-[12px] font-bold">／月（税込）</span>
                    </div>

                    <div
                      key={planTab}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#d63228]/8 border border-[#d63228]/20"
                      style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d63228]" />
                      <p className="text-[11.5px] font-bold text-[#d63228]">
                        {planTab === 'standard'
                          ? '最初の1ヶ月は無料'
                          : '紹介コードで最初の1ヶ月無料'}
                      </p>
                    </div>

                    <p className="text-[11.5px] text-gray-500 mt-4 leading-relaxed">
                      {planTab === 'standard'
                        ? 'カード登録のみで始められます。2ヶ月目から自動課金。'
                        : 'コードを入れて登録すると、通常同様に初月無料。加えて紹介者に¥3,000。'}
                    </p>
                  </div>

                  {/* Features list */}
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.25em] text-gray-400 uppercase mb-3">
                      含まれる機能
                    </p>
                    <ul className="space-y-2">
                      {PLAN_FEATURES.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] text-gray-700">
                          <svg className="w-3.5 h-3.5 text-[#2b7a54] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="leading-[1.5]">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="px-6 md:px-8 pb-7">
                  <Link
                    href={planTab === 'standard' ? '/login' : '/login?ref=1'}
                    className="group relative flex items-center justify-center w-full bg-[#1A2F6E] hover:bg-[#0f1d45] text-white font-bold text-[13px] tracking-wide py-4 rounded-xl transition-all duration-200 active:scale-[0.99]"
                  >
                    <span>{planTab === 'standard' ? '無料で始める' : '紹介コードで登録する'}</span>
                    <svg className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <p className="text-center text-[10.5px] text-gray-400 mt-3 tracking-wide">
                    通常・紹介ともに <span className="font-bold text-gray-700">月額¥3,980・機能同一・1ヶ月無料</span>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          REFERRAL
          ============================================================ */}
      <section
        id="referral"
        className="relative py-20 md:py-28 px-5 md:px-8 overflow-hidden"
        style={{ background: '#0f1d3d' }}
      >
        <div
          className="absolute inset-0 opacity-70 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, transparent 0, transparent 22px, rgba(255,255,255,0.018) 22px, rgba(255,255,255,0.018) 44px)',
          }}
        />
        <div className="relative max-w-[1180px] mx-auto">
          <Reveal>
            <SectionHead
              eyebrow="Referral"
              accent="#f5c14b"
              invert
              title={<>紹介すると、<br className="sm:hidden" />¥3,000もらえます。</>}
              sub={<>紹介する側・される側、どちらも初月は無料。違いは、あなたに¥3,000届くかどうかだけです。</>}
            />
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-12 max-w-[820px] mx-auto">
              <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 md:p-10 overflow-hidden">
                <div
                  className="absolute -right-8 -bottom-12 text-white/[0.04] leading-none select-none pointer-events-none"
                  style={{
                    fontFamily: "'Noto Serif JP', serif",
                    fontSize: 'clamp(140px, 24vw, 320px)',
                    fontWeight: 900,
                  }}
                >
                  ¥3,000
                </div>

                <div className="relative grid md:grid-cols-[1fr_auto] gap-7 md:gap-10 items-center">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] text-[#f5c14b] font-bold uppercase mb-3">
                      For the Referrer
                    </p>
                    <h3
                      className="text-[19px] md:text-[24px] font-black leading-[1.5] text-white mb-4"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      紹介した相手が3ヶ月続けたら、<br className="hidden md:block" />
                      Amazonギフト券 ¥3,000。
                    </h3>
                    <p className="text-[12.5px] leading-[2] text-white/70 max-w-md">
                      登録メールアドレスへ自動送付します。
                      紹介数に上限はありません。同業者が増えるほど、あなたにも積み上がります。
                    </p>
                  </div>

                  <div className="md:shrink-0">
                    <div className="text-center px-6 py-6 rounded-xl bg-gradient-to-b from-[#f5c14b]/15 to-[#f5c14b]/5 border border-[#f5c14b]/30">
                      <p className="text-[9px] tracking-[0.3em] text-[#f5c14b] font-bold uppercase mb-2">
                        Reward
                      </p>
                      <p
                        className="text-[36px] md:text-[42px] leading-none font-black text-white mb-1"
                        style={{ fontFamily: "'Noto Serif JP', serif" }}
                      >
                        ¥3,000
                      </p>
                      <p className="text-[10.5px] text-[#f5c14b]/80 tracking-wide">
                        Amazonギフト券
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flow */}
                <div className="relative mt-10 pt-8 border-t border-white/10">
                  <p className="text-[10px] tracking-[0.3em] text-white/50 font-bold uppercase mb-6 text-center md:text-left">
                    How it works
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-3 relative">
                    {[
                      { step: '01', text: 'マイページで\n紹介コード取得' },
                      { step: '02', text: '同業者にコードをシェア' },
                      { step: '03', text: '相手が登録・\n3ヶ月継続' },
                      { step: '04', text: '¥3,000ギフト券\n自動送付' },
                    ].map((s, i) => (
                      <div key={i} className="relative">
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-black tracking-[0.2em] text-[#f5c14b] font-mono">
                            {s.step}
                          </span>
                          <p className="text-[11.5px] text-white/85 leading-[1.65] whitespace-pre-line">
                            {s.text}
                          </p>
                        </div>
                        {i < 3 && (
                          <div className="hidden md:block absolute top-1 -right-2 text-white/20">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          VOICES
          ============================================================ */}
      <section className="relative py-20 md:py-28 px-5 md:px-8 bg-white">
        <div className="max-w-[1180px] mx-auto">
          <Reveal>
            <SectionHead
              eyebrow="Voices"
              accent="#d63228"
              title={<>現場から、届いた声。</>}
            />
          </Reveal>

          <div className="mt-12 grid md:grid-cols-3 gap-4 md:gap-5 max-w-[1000px] mx-auto">
            {VOICES.map((v, i) => (
              <Reveal key={i} delay={i * 100}>
                <figure className="h-full flex flex-col p-6 md:p-7 rounded-xl bg-[#faf6ed] border border-[#e8ddc8] relative">
                  <svg className="absolute top-6 right-6 w-6 h-6 text-[#d63228]/20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 8c-3.3 0-6 2.7-6 6v6h6v-6h-3c0-1.7 1.3-3 3-3V8zm10 0c-3.3 0-6 2.7-6 6v6h6v-6h-3c0-1.7 1.3-3 3-3V8z" />
                  </svg>
                  <blockquote className="text-[13px] leading-[2] text-gray-700 mb-5 flex-1" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                    「{v.text}」
                  </blockquote>
                  <figcaption className="border-t border-dashed border-[#e8ddc8] pt-4">
                    <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-bold mb-0.5">
                      {v.company}
                    </p>
                    <p className="text-[12px] text-gray-800 font-bold">{v.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <section id="faq" className="relative py-20 md:py-28 px-5 md:px-8" style={{ background: '#faf6ed' }}>
        <div className="max-w-[780px] mx-auto">
          <Reveal>
            <SectionHead eyebrow="FAQ" title={<>よくある質問。</>} />
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-10 space-y-2.5">
              {FAQS.map((item, i) => {
                const isOpen = openFaq === i
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-xl overflow-hidden border transition-all duration-300 ${
                      isOpen ? 'border-[#1A2F6E]/25 shadow-[0_8px_20px_-10px_rgba(26,47,110,0.18)]' : 'border-[#e8ddc8]'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full px-5 py-4 md:px-6 md:py-5 text-left flex items-start gap-4 hover:bg-[#faf6ed]/50 transition-colors"
                    >
                      <span className="text-[11px] font-black font-mono text-[#d63228] shrink-0 pt-0.5 tracking-wider">
                        Q{String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-bold text-[13.5px] text-gray-800 flex-1 leading-[1.7]" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                        {item.q}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-400 mt-0.5 ${isOpen ? 'rotate-45' : ''}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <div
                      className="grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 md:px-6 pb-5 pl-[52px] md:pl-[60px]">
                          <p className="text-[12.5px] leading-[1.95] text-gray-600">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section
        className="relative py-24 md:py-32 px-5 md:px-8 overflow-hidden"
        style={{ background: '#0f1d3d' }}
      >
        <div
          className="absolute inset-0 opacity-70 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, transparent 0, transparent 22px, rgba(255,255,255,0.02) 22px, rgba(255,255,255,0.02) 44px)',
          }}
        />
        <svg
          className="absolute left-1/2 -translate-x-1/2 bottom-0 text-white/[0.035] pointer-events-none"
          width="700" height="400" viewBox="0 0 700 400" fill="none"
        >
          <path d="M350 20 L660 380 H40 Z" stroke="currentColor" strokeWidth="1" />
          <line x1="350" y1="20" x2="350" y2="380" stroke="currentColor" strokeWidth="0.8" />
        </svg>

        <div className="relative max-w-[780px] mx-auto text-center">
          <Reveal>
            <p className="text-[10px] tracking-[0.3em] text-[#d63228] font-bold uppercase mb-4">
              Start Today
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2
              className="text-[26px] md:text-[36px] lg:text-[42px] font-black leading-[1.35] text-white mb-6"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              夜、少し早く<br className="sm:hidden" />帰れる日を、<br />
              幕ナビから始めませんか。
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-white/70 text-[13px] md:text-[14px] leading-[2] mb-9 max-w-md mx-auto">
              1ヶ月の無料トライアルで、すべての機能を試せます。
              カード登録のみ、請求は2ヶ月目以降から。
            </p>
          </Reveal>
          <Reveal delay={300}>
            <PrimaryCTA size="lg" />
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-[#050c20] text-gray-400 py-12 px-5 md:px-8">
        <div className="max-w-[1180px] mx-auto">
          <div className="grid md:grid-cols-[auto_1fr_auto] gap-8 md:gap-12 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-[#1A2F6E] rounded-md flex items-center justify-center">
                  <span className="text-white text-[12px] font-black" style={{ fontFamily: "'Noto Serif JP', serif" }}>幕</span>
                </div>
                <div>
                  <p className="text-[13px] font-black text-white tracking-wider" style={{ fontFamily: "'Noto Serif JP', serif" }}>幕ナビ</p>
                  <p className="text-[8.5px] tracking-[0.22em] text-gray-500">MAKU NAVI</p>
                </div>
              </div>
              <p className="text-[11px] leading-[1.85] text-gray-500 max-w-[240px]">
                テント屋が、テント屋のために作った業務道具。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] tracking-[0.28em] text-gray-600 uppercase font-bold mb-3">Product</p>
                <ul className="space-y-2">
                  {NAV.map((n) => (
                    <li key={n.href}>
                      <a href={n.href} className="text-[12px] text-gray-400 hover:text-white transition-colors">
                        {n.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.28em] text-gray-600 uppercase font-bold mb-3">Account</p>
                <ul className="space-y-2">
                  <li><Link href="/login" className="text-[12px] text-gray-400 hover:text-white transition-colors">ログイン</Link></li>
                  <li><Link href="/login" className="text-[12px] text-gray-400 hover:text-white transition-colors">新規登録</Link></li>
                </ul>
              </div>
            </div>

            <div>
              <p className="text-[9px] tracking-[0.28em] text-gray-600 uppercase font-bold mb-3">Publisher</p>
              <p className="text-[12px] text-gray-400 leading-[1.8]">
                West Hill<br />
                西岡テント・西岡
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <p className="text-[10px] text-gray-600 tracking-wide">
              © {new Date().getFullYear()} 幕ナビ All rights reserved.
            </p>
            <p className="text-[9px] text-gray-700 tracking-[0.2em] uppercase">
              Made in Kyoto
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
