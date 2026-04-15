'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/* ─────────────────────────────────────
   Intersection Observer Hook
   ───────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
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

/* ─────────────────────────────────────
   Data
   ───────────────────────────────────── */
const TRUST_NUMBERS = [
  { num: '3ヶ月', label: '無料トライアル', sub: 'カード登録のみ' },
  { num: '¥980〜', label: '月額料金', sub: '業界最安クラス' },
  { num: '2,000社', label: '全国テント屋', sub: 'がターゲット' },
]

const PAIN_POINTS = [
  {
    icon: '📝',
    title: '見積もりに時間がかかる',
    items: ['手計算で1件30分以上', '計算ミスでやり直し', '外出先で見積もりが出せない'],
  },
  {
    icon: '👤',
    title: 'ベテラン頼みの属人化',
    items: ['要尺計算は"勘と経験"', '新人が育つまで何年もかかる', 'ベテラン不在で仕事が止まる'],
  },
  {
    icon: '📱',
    title: 'SNS発信ができない',
    items: ['何を書けばいいかわからない', '写真は撮るが投稿まで至らない', '同業者の事例が見えない'],
  },
]

const SOLUTIONS = [
  {
    icon: '⚡',
    title: '見積もり作成を90%時短',
    desc: '生地・寸法を選ぶだけで自動計算。PDF出力でそのままお客様に提出。現場でスマホからでも即対応。',
    color: '#16a34a',
  },
  {
    icon: '🎓',
    title: '要尺計算を"ゲーム"で習得',
    desc: '要尺GPで毎日5問チャレンジ。新人でも楽しみながらスキルアップ。全国ランキングで競争心も刺激。',
    color: '#f59e0b',
  },
  {
    icon: '🤖',
    title: 'AIが投稿文を自動生成',
    desc: '施工情報を入力するだけでClaude AIがプロ級の投稿文を作成。テント屋専用SNS「テントーク」で同業者と繋がる。',
    color: '#0ea5e9',
  },
]

const TOOLS = [
  {
    id: 'tenmitsukun',
    name: 'てんみつ君',
    sub: '見積もり自動生成',
    icon: '🧮',
    color: '#16a34a',
    bg: '#f0fdf4',
    desc: '生地選択・寸法入力で自動計算。カーテン見積もり・PDF出力にも対応。',
    features: ['テント生地データベース', '自動面積・金額計算', 'PDF見積書出力', 'カーテン見積もり'],
  },
  {
    id: 'tentsukun',
    name: 'てんつ君',
    sub: '生地張替シミュレーター',
    icon: '🎨',
    color: '#7c3aed',
    bg: '#f5f3ff',
    desc: '施工写真に生地を合成。Before/After比較でお客様への提案力UP。',
    features: ['写真に生地合成', 'Before/After比較', 'Web Share API対応', 'お客様提案用画像'],
  },
  {
    id: 'yojakugp',
    name: '要尺GP',
    sub: '要尺計算グランプリ',
    icon: '🏆',
    color: '#f59e0b',
    bg: '#fffbeb',
    desc: '5問の要尺計算スピードチャレンジ。毎日の習慣で計算スキルが身につく。',
    features: ['5問スピードチャレンジ', 'タイム計測・記録', '全国ランキング', '毎日開く習慣づくり'],
  },
  {
    id: 'tentalk',
    name: 'テントーク',
    sub: 'テント屋専用SNS',
    icon: '💬',
    color: '#0ea5e9',
    bg: '#f0f9ff',
    desc: '施工写真の投稿・共有。AI投稿文生成で発信のハードルを下げる。',
    features: ['施工写真タイムライン', 'AI投稿文自動生成', 'いいね・コメント', '同業者ネットワーク'],
  },
]

const PLANS = [
  {
    id: 'lite',
    name: 'ライト',
    price: 980,
    yearPrice: 9800,
    desc: 'まず使ってみたい方に',
    features: [
      { label: '見積もり自動計算', ok: true },
      { label: 'テントーク（SNS）', ok: true },
      { label: 'AI投稿文生成', ok: true },
      { label: '生地張替シミュレーター', ok: false },
      { label: '要尺GP', ok: false },
      { label: 'カーテン見積もり', ok: false },
      { label: 'PDF見積書出力', ok: false },
    ],
    highlight: false,
  },
  {
    id: 'standard',
    name: 'スタンダード',
    price: 1980,
    yearPrice: 19800,
    desc: '現場で毎日使いたい方に',
    features: [
      { label: '見積もり自動計算', ok: true },
      { label: 'テントーク（SNS）', ok: true },
      { label: 'AI投稿文生成', ok: true },
      { label: '生地張替シミュレーター', ok: true },
      { label: '要尺GP', ok: true },
      { label: 'カーテン見積もり', ok: true },
      { label: 'PDF見積書出力', ok: true },
    ],
    highlight: true,
  },
]

const VOICES = [
  {
    company: '関東のテント施工会社',
    plan: 'スタンダード',
    name: 'A社 代表',
    text: '見積もり作成が劇的に早くなった。以前は1件30分かかっていたのが、今は5分で完了。お客様への対応スピードが上がり、受注率も改善しました。',
  },
  {
    company: '九州の幕屋',
    plan: 'ライト',
    name: 'B社 営業担当',
    text: 'テントークのAI投稿文生成が便利すぎる。施工情報を入れるだけでプロっぽい文章が出来上がる。SNS苦手な自分でも毎週投稿できるようになった。',
  },
  {
    company: '東海のテント屋',
    plan: 'スタンダード',
    name: 'C社 工場長',
    text: '要尺GPを新人教育に使っています。ゲーム感覚で覚えられるから、新人のモチベーションが全然違う。ランキングで競い合って自主的に練習してくれる。',
  },
]

const FAQS = [
  {
    q: '無料期間中にカードを請求されますか？',
    a: 'トライアル期間中（3ヶ月）は一切請求されません。カード登録は本人確認のためで、4ヶ月目以降の課金開始時に初めて請求が発生します。',
  },
  {
    q: 'パソコンが苦手でも使えますか？',
    a: 'はい。テント屋が作ったツールなので、現場目線のシンプルな操作です。スマホからも使えます。導入サポートも行っています。',
  },
  {
    q: 'いつでも解約できますか？',
    a: 'はい、いつでも解約可能です。解約後もトライアル期間内であれば引き続き全機能を使えます。',
  },
  {
    q: 'プランの変更はできますか？',
    a: 'ライト⇔スタンダードの変更はいつでも可能です。アップグレードは即時反映されます。',
  },
  {
    q: '創業メンバー（モニター）とは何ですか？',
    a: '先着10社限定の特別プランです。スタンダードと同じ全機能を¥980/月（永久固定）で使えます。3ヶ月の無料期間終了後も値上げはありません。',
  },
]

/* ─────────────────────────────────────
   Section wrapper with reveal animation
   ───────────────────────────────────── */
function Section({
  children,
  className = '',
  id,
  style,
}: {
  children: React.ReactNode
  className?: string
  id?: string
  style?: React.CSSProperties
}) {
  const { ref, visible } = useInView()
  return (
    <section
      id={id}
      ref={ref}
      style={style}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </section>
  )
}

/* ─────────────────────────────────────
   CTA Button Component
   ───────────────────────────────────── */
function CTAButton({ large = false }: { large?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${large ? 'gap-3' : 'gap-2'}`}>
      <Link
        href="/login"
        className={`
          inline-flex items-center justify-center
          bg-[#E8342A] text-white font-black
          rounded-2xl shadow-lg
          hover:bg-[#d42d23] hover:shadow-xl
          active:scale-95 transition-all
          ${large ? 'text-lg px-12 py-5 gap-3' : 'text-sm px-8 py-4 gap-2'}
        `}
      >
        <span>無料で始める</span>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
      <p className="text-xs text-gray-400">3ヶ月無料 ・ クレジットカード登録のみ ・ いつでも解約OK</p>
    </div>
  )
}

/* ─────────────────────────────────────
   Main LP Page
   ───────────────────────────────────── */
export default function LPPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">

      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1A2F6E] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">幕</span>
            </div>
            <div>
              <p className="text-base font-black text-gray-900 leading-none tracking-wide">幕ナビ</p>
              <p className="text-[9px] text-gray-400 tracking-widest">Tent Business Tool</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-[#1A2F6E] transition-colors">機能</a>
            <a href="#tools" className="hover:text-[#1A2F6E] transition-colors">ツール</a>
            <a href="#pricing" className="hover:text-[#1A2F6E] transition-colors">料金</a>
            <a href="#faq" className="hover:text-[#1A2F6E] transition-colors">FAQ</a>
            <Link
              href="/login"
              className="bg-[#1A2F6E] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-[#0f1d45] transition-colors"
            >
              ログイン
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="relative pt-16 overflow-hidden">
        <div
          className="relative py-24 md:py-36 px-6"
          style={{
            background: 'linear-gradient(135deg, #0f1d45 0%, #1A2F6E 50%, #243d8a 100%)',
          }}
        >
          {/* Tent stripe overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(255,255,255,0.025) 14px, rgba(255,255,255,0.025) 28px)`,
            }}
          />
          {/* Decorative tent */}
          <div className="absolute right-8 md:right-24 bottom-0 opacity-[0.06] pointer-events-none">
            <svg width="200" height="180" viewBox="0 0 200 180" fill="white">
              <path d="M100 10 L190 170 H10 Z" />
              <rect x="82" y="110" width="36" height="60" rx="2" />
            </svg>
          </div>
          <div className="absolute left-8 md:left-16 top-12 opacity-[0.04] pointer-events-none">
            <svg width="100" height="90" viewBox="0 0 100 90" fill="white">
              <path d="M50 5 L95 85 H5 Z" />
            </svg>
          </div>

          <div className="relative max-w-[1200px] mx-auto text-center">
            <p className="text-blue-300 text-xs font-bold tracking-[0.3em] uppercase mb-6 animate-fadeIn">
              テント屋が、テント屋のために作った
            </p>
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight animate-fadeInUp"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              見積もりから発信まで、
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                一本で。
              </span>
            </h1>
            <p className="text-blue-200 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed animate-fadeInUp" style={{ animationDelay: '100ms' }}>
              見積もり自動計算・生地シミュレーション・要尺トレーニング・テント屋専用SNS。
              <br className="hidden md:block" />
              月額¥980〜 で、すべてのテント業務を効率化。
            </p>

            <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              <CTAButton large />
            </div>

            {/* Trust indicators */}
            <div className="mt-14 flex flex-wrap justify-center gap-6 md:gap-10 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
              {TRUST_NUMBERS.map((t) => (
                <div key={t.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-black text-white">{t.num}</p>
                  <p className="text-xs text-blue-200 font-bold mt-1">{t.label}</p>
                  <p className="text-[10px] text-blue-300/60">{t.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT IS 幕ナビ
          ============================================================ */}
      <Section className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="text-[#E8342A] text-xs font-bold tracking-[0.25em] uppercase mb-3">What is 幕ナビ?</p>
          <h2
            className="text-2xl md:text-4xl font-black text-gray-900 mb-6"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            テント業務を、もっとスマートに。
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            幕ナビは、全国のテント屋さんの「あったらいいな」を形にした業務効率化ツールです。
            <br />
            見積もり作成、生地シミュレーション、要尺計算トレーニング、テント屋専用SNSまで——
            <br />
            <span className="font-bold text-gray-700">現場を知っているからこそ作れた、テント屋のためだけのSaaS。</span>
          </p>
        </div>
      </Section>

      {/* ============================================================
          PAIN POINTS - お悩み
          ============================================================ */}
      <Section className="py-20 md:py-28 px-6" style={{ background: '#f8fafc' }} id="problems">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#E8342A] text-xs font-bold tracking-[0.25em] uppercase mb-3">Problems</p>
            <h2
              className="text-2xl md:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              こんなお悩みありませんか？
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PAIN_POINTS.map((p, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-black text-gray-800 mb-4">{p.title}</h3>
                <ul className="space-y-2.5">
                  {p.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-500">
                      <span className="text-red-400 font-bold mt-0.5 shrink-0">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ============================================================
          SOLUTIONS
          ============================================================ */}
      <Section className="py-20 md:py-28 px-6 bg-white" id="features">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#1A2F6E] text-xs font-bold tracking-[0.25em] uppercase mb-3">Solutions</p>
            <h2
              className="text-2xl md:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              幕ナビが、すべて解決します。
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {SOLUTIONS.map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm"
                  style={{ background: `${s.color}12`, border: `1.5px solid ${s.color}25` }}
                >
                  {s.icon}
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-3">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <CTAButton />
          </div>
        </div>
      </Section>

      {/* ============================================================
          TOOLS DETAIL
          ============================================================ */}
      <Section className="py-20 md:py-28 px-6" style={{ background: '#f8fafc' }} id="tools">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#E8342A] text-xs font-bold tracking-[0.25em] uppercase mb-3">Tools</p>
            <h2
              className="text-2xl md:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              4つのツールで業務を変える
            </h2>
            <p className="text-gray-500 text-sm">すべてブラウザで動作。アプリインストール不要。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {TOOLS.map((tool) => (
              <div
                key={tool.id}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className="flex items-start gap-5">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: tool.bg, border: `1.5px solid ${tool.color}30` }}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-gray-800">{tool.name}</h3>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${tool.color}15`, color: tool.color }}
                      >
                        {tool.sub}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{tool.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {tool.features.map((f) => (
                        <span
                          key={f}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ============================================================
          PRICING
          ============================================================ */}
      <Section className="py-20 md:py-28 px-6 bg-white" id="pricing">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#1A2F6E] text-xs font-bold tracking-[0.25em] uppercase mb-3">Pricing</p>
            <h2
              className="text-2xl md:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              シンプルな料金プラン
            </h2>
            <p className="text-gray-500 text-sm">
              トライアル3ヶ月無料。いつでも解約OK。
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl p-8 relative overflow-hidden"
                style={{
                  border: plan.highlight ? '2px solid #1A2F6E' : '1.5px solid #e2e8f0',
                  boxShadow: plan.highlight
                    ? '0 8px 32px rgba(26,47,110,0.16)'
                    : '0 2px 8px rgba(26,47,110,0.06)',
                }}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#1A2F6E] rounded-t-xl" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8342A] text-white text-[10px] font-black px-4 py-1 rounded-full shadow-md tracking-wide whitespace-nowrap">
                      人気 No.1
                    </div>
                  </>
                )}

                <div className="mb-6 mt-2">
                  <h3 className="text-lg font-black text-gray-800 mb-0.5">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-4xl font-black"
                      style={{ color: plan.highlight ? '#1A2F6E' : '#374151' }}
                    >
                      ¥{plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm">/月</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <span className="text-green-600 font-bold">年払い</span>
                    ¥{plan.yearPrice.toLocaleString()}
                    <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      2ヶ月お得
                    </span>
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5 text-sm">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                          f.ok ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {f.ok ? '✓' : '—'}
                      </span>
                      <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block w-full text-center py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 ${
                    plan.highlight
                      ? 'bg-[#1A2F6E] text-white hover:bg-[#0f1d45] shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  無料で始める
                </Link>
              </div>
            ))}
          </div>

          {/* Monitor Special */}
          <div
            className="relative rounded-2xl p-8 max-w-3xl mx-auto overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1A2F6E 0%, #243d8a 60%, #2a4fab 100%)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`,
              }}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none">
              <svg width="80" height="70" viewBox="0 0 80 70" fill="white">
                <path d="M40 4 L76 66 H4 Z" />
                <rect x="33" y="44" width="14" height="22" rx="1" />
              </svg>
            </div>

            <div className="relative flex items-start gap-5">
              <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center text-3xl shrink-0 shadow-lg">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-full tracking-wide">
                    先着10社限定
                  </span>
                </div>
                <h3
                  className="text-xl font-black text-white mb-2"
                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                >
                  創業メンバー特典
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-4">
                  先着10社限定で
                  <span className="font-black text-white text-base"> ¥980/月</span>
                  （スタンダードの半額）でスタンダード機能が
                  <span className="font-black text-white">永久に使えます。</span>
                  3ヶ月の無料モニター期間終了後も¥980/月のまま。
                </p>
                <div className="flex flex-wrap gap-2">
                  {['3ヶ月無料', '¥980/月（永久固定）', 'スタンダード全機能'].map((t) => (
                    <span
                      key={t}
                      className="bg-white/15 border border-white/20 text-white text-[11px] font-semibold px-3 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================================
          CUSTOMER VOICES
          ============================================================ */}
      <Section className="py-20 md:py-28 px-6" style={{ background: '#f8fafc' }} id="voices">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#E8342A] text-xs font-bold tracking-[0.25em] uppercase mb-3">Voices</p>
            <h2
              className="text-2xl md:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              導入テント屋さんの声
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {VOICES.map((v, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative"
              >
                {/* Quote mark */}
                <div className="text-5xl text-[#1A2F6E]/10 font-serif absolute top-4 right-6 leading-none">"</div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold bg-[#1A2F6E]/8 text-[#1A2F6E] px-2.5 py-0.5 rounded-full">
                    {v.plan}
                  </span>
                  <span className="text-[10px] text-gray-400">{v.company}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{v.text}</p>
                <p className="text-xs text-gray-400 font-bold">{v.name}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <Section className="py-20 md:py-28 px-6 bg-white" id="faq">
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#1A2F6E] text-xs font-bold tracking-[0.25em] uppercase mb-3">FAQ</p>
            <h2
              className="text-2xl md:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              よくある質問
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
                >
                  <span className="w-6 h-6 bg-[#1A2F6E]/10 text-[#1A2F6E] rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    Q
                  </span>
                  <span className="font-bold text-sm text-gray-800 flex-1">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-sm text-gray-500 leading-relaxed px-6 pb-6 pl-[3.25rem]">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0f1d45 0%, #1A2F6E 50%, #243d8a 100%)',
      }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(255,255,255,0.02) 14px, rgba(255,255,255,0.02) 28px)`,
          }}
        />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 opacity-[0.04] pointer-events-none">
          <svg width="300" height="260" viewBox="0 0 300 260" fill="white">
            <path d="M150 15 L285 250 H15 Z" />
            <rect x="125" y="170" width="50" height="80" rx="3" />
          </svg>
        </div>

        <div className="relative max-w-[800px] mx-auto text-center">
          <h2
            className="text-2xl md:text-4xl font-black text-white mb-4"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            テントの仕事を、もっと楽しく。
          </h2>
          <p className="text-blue-200 text-sm md:text-base mb-10 leading-relaxed">
            3ヶ月の無料トライアルで、すべての機能をお試しください。
            <br />
            テント屋が作ったからこそ、現場にフィットするツールです。
          </p>
          <CTAButton large />
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-[#0a1634] text-gray-400 py-12 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1A2F6E] rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">幕</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">幕ナビ</p>
                <p className="text-[9px] text-gray-500">Tent Business Tool</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-xs">
              <a href="#features" className="hover:text-white transition-colors">機能</a>
              <a href="#tools" className="hover:text-white transition-colors">ツール</a>
              <a href="#pricing" className="hover:text-white transition-colors">料金</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/login" className="hover:text-white transition-colors">ログイン</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-gray-500">
              開発：West Hill / 西岡テント・西岡
            </p>
            <p className="text-[11px] text-gray-600">
              © {new Date().getFullYear()} 幕ナビ All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
