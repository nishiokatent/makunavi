import Link from 'next/link'

// ─── ツール定義（各ツール固有のカラーテーマ）────────────────────────
const TOOLS = [
  {
    href:    '/tenmitsukun',
    emoji:   '📋',
    name:    'てんみつ君',
    label:   '見積もり自動生成',
    desc:    '生地・サイズを選ぶだけで即座に見積もりが完成。計算ミスゼロで商談もスムーズに。',
    tags:    ['PDF出力', '無制限作成', '過去案件検索'],
    status:  'available' as const,
    plan:    null,
    // ツール固有カラー
    accent:  '#16a34a',   // green
    bg:      '#f0fdf4',
    border:  '#bbf7d0',
    iconBg:  '#dcfce7',
  },
  {
    href:    '/tentalk',
    emoji:   '💬',
    name:    'テントーク',
    label:   'テント屋専用SNS',
    desc:    '施工写真を投稿してテント屋仲間と繋がろう。AIが投稿文を自動生成します。',
    tags:    ['施工写真', 'AI投稿文', 'いいね・コメント'],
    status:  'available' as const,
    plan:    null,
    accent:  '#0ea5e9',   // sky
    bg:      '#f0f9ff',
    border:  '#bae6fd',
    iconBg:  '#e0f2fe',
  },
  {
    href:    '/tentsukun',
    emoji:   '🎨',
    name:    'てんつ君',
    label:   '生地張替シミュレーター',
    desc:    '写真に生地を合成してビジュアルで提案。お客様のイメージを共有して受注率アップ。',
    tags:    ['写真合成', 'Before/After', 'ピンチズーム'],
    status:  'available' as const,
    plan:    'standard',
    accent:  '#7c3aed',   // purple
    bg:      '#faf5ff',
    border:  '#ddd6fe',
    iconBg:  '#ede9fe',
  },
  {
    href:    '/yojakugp',
    emoji:   '⚡',
    name:    '要尺GP',
    label:   'スピードチャレンジ',
    desc:    '要尺計算の速さを競うゲーム。5問の計算問題を最速でクリアして腕試し！',
    tags:    ['5問チャレンジ', 'タイム計測', 'ランキング'],
    status:  'available' as const,
    plan:    'standard',
    accent:  '#f59e0b',   // amber
    bg:      '#fffbeb',
    border:  '#fde68a',
    iconBg:  '#fef3c7',
  },
]

// ダミーの最近の見積もり（後でSupabaseから取得）
const RECENT_QUOTES = [
  { id: 1, client: '〇〇商店', title: 'テント張替見積もり', amount: 285000, date: '2026/03/30' },
  { id: 2, client: '△△会社', title: '新規テント設置',      amount: 520000, date: '2026/03/29' },
  { id: 3, client: '□□店舗', title: '日除けテント',        amount: 180000, date: '2026/03/28' },
]

const ANNOUNCEMENTS = [
  {
    date: '2026.04',
    badge: '新機能',
    badgeColor: 'bg-sky-100 text-sky-700',
    title: 'テントーク β公開',
    body: 'テント屋専用SNS「テントーク」が使えるようになりました。施工写真を投稿してみましょう！',
  },
  {
    date: '2026.04',
    badge: 'アップデート',
    badgeColor: 'bg-green-100 text-green-700',
    title: 'Next.js移行完了',
    body: 'アプリ全体をリニューアル。より快適にお使いいただけます。',
  },
]

export default function DashboardPage() {
  const totalQuotes = 12
  const monthAmount = 985000
  const activeDays = 8

  return (
    <div className="px-7 py-7 max-w-5xl mx-auto animate-fadeInUp">

      {/* ─── ウェルカムバナー ─────────────────────── */}
      <div
        className="relative rounded-2xl px-7 py-6 mb-7 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1A2F6E 0%, #243d8a 60%, #2a4fab 100%)',
        }}
      >
        {/* テントストライプ */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent, transparent 12px,
              rgba(255,255,255,0.025) 12px, rgba(255,255,255,0.025) 24px
            )`,
          }}
        />
        {/* テントシルエット — 装飾 */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <svg width="80" height="70" viewBox="0 0 80 70" fill="white">
            <path d="M40 4 L76 66 H4 Z"/>
            <rect x="33" y="44" width="14" height="22" rx="1"/>
          </svg>
        </div>

        <div className="relative">
          <p className="text-blue-200 text-xs font-medium mb-1">おかえりなさい 👋</p>
          <h1 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Noto Serif JP, serif' }}>
            今日も効率的な業務を
          </h1>
          <p className="text-sm text-blue-200">必要なツールを選んで作業を始めましょう。</p>
        </div>
      </div>

      {/* ─── クイック統計 ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-7 stagger">
        {[
          { label: '今月の見積もり', value: `${totalQuotes}件`, sub: '今月作成', color: '#16a34a' },
          { label: '今月の見積総額', value: `¥${(monthAmount / 10000).toFixed(0)}万`, sub: '累計金額', color: '#1A2F6E' },
          { label: '今月の稼働日数', value: `${activeDays}日`, sub: '利用実績', color: '#f59e0b' },
        ].map((stat, i) => (
          <div
            key={i}
            className="animate-fadeInUp bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm"
          >
            <div className="text-xs text-gray-500 mb-1.5">{stat.label}</div>
            <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── ツール一覧 ───────────────────────────── */}
      <section className="mb-8">
        <SectionHeading>ツール</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
          {TOOLS.map(tool => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>
      </section>

      {/* ─── 情報グリッド ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 最近の見積もり */}
        <section className="lg:col-span-2">
          <SectionHeading>最近の見積もり</SectionHeading>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {RECENT_QUOTES.map((q, i) => (
              <div
                key={q.id}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 ${
                  i < RECENT_QUOTES.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg flex-shrink-0">
                  📋
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {q.client}　{q.title}
                  </div>
                  <div className="text-xs text-gray-400">{q.date}</div>
                </div>
                <div className="text-sm font-black text-[#1A2F6E]">
                  ¥{q.amount.toLocaleString()}
                </div>
              </div>
            ))}
            <div className="px-4 py-3 border-t border-gray-50">
              <Link
                href="/tenmitsukun"
                className="text-xs text-[#1A2F6E] hover:underline font-medium flex items-center gap-1"
              >
                すべての見積もりを見る
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* お知らせ */}
        <section>
          <SectionHeading>お知らせ</SectionHeading>
          <div className="space-y-3">
            {ANNOUNCEMENTS.map((a, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm border-l-4"
                style={{ borderLeftColor: '#1A2F6E' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${a.badgeColor}`}>
                    {a.badge}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{a.date}</span>
                </div>
                <div className="text-xs font-bold text-gray-800 mb-1">{a.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{a.body}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ─── セクション見出し ──────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
      <span className="w-1 h-4 bg-[#E8342A] rounded inline-block" />
      {children}
    </h2>
  )
}

// ─── ツールカード ──────────────────────────────────────
function ToolCard({ tool }: { tool: typeof TOOLS[0] }) {
  const inner = (
    <div
      className="animate-fadeInUp relative rounded-2xl p-5 transition-all duration-200 h-full cursor-pointer group overflow-hidden"
      style={{
        background: tool.bg,
        border: `1.5px solid ${tool.border}`,
      }}
    >
      {/* ホバー時グロー */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1.5px ${tool.accent}` }}
      />

      {/* プランバッジ */}
      {tool.plan && (
        <div className="absolute top-3.5 right-3.5">
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-white/80 text-gray-500 border border-gray-200">
            STD
          </span>
        </div>
      )}

      {/* アイコン */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3.5 transition-transform duration-200 group-hover:scale-110"
        style={{ background: tool.iconBg }}
      >
        {tool.emoji}
      </div>

      {/* テキスト */}
      <div className="text-sm font-black text-gray-800 mb-0.5">{tool.name}</div>
      <div className="text-[10px] font-bold mb-2" style={{ color: tool.accent }}>
        {tool.label}
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{tool.desc}</p>

      {/* タグ */}
      <div className="flex flex-wrap gap-1">
        {tool.tags.map(tag => (
          <span
            key={tag}
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: tool.iconBg, color: tool.accent }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )

  return tool.status === 'available' ? (
    <Link href={tool.href} className="block h-full">{inner}</Link>
  ) : (
    <div className="h-full">{inner}</div>
  )
}
