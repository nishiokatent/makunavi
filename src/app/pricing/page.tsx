import Link from 'next/link'

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
    cta: '無料で始める',
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
    cta: '無料で始める',
    highlight: true,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ヘッダー */}
      <div
        className="relative text-white py-16 px-4 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f1d45 0%, #1A2F6E 55%, #243d8a 100%)',
        }}
      >
        {/* テントストライプ */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg, transparent, transparent 12px,
              rgba(255,255,255,0.025) 12px, rgba(255,255,255,0.025) 24px
            )`,
          }}
        />
        {/* 装飾テント */}
        <div className="absolute right-12 bottom-0 opacity-[0.07] pointer-events-none">
          <svg width="120" height="100" viewBox="0 0 120 100" fill="white">
            <path d="M60 5 L115 95 H5 Z"/>
            <rect x="50" y="65" width="20" height="30" rx="1.5"/>
          </svg>
        </div>

        <div className="relative">
          <p className="text-blue-300 text-xs font-bold tracking-[0.25em] uppercase mb-3">Pricing</p>
          <h1 className="text-3xl font-black mb-3" style={{ fontFamily: 'Noto Serif JP, serif' }}>
            シンプルな料金プラン
          </h1>
          <p className="text-blue-200 text-sm">
            トライアル3ヶ月無料（カード登録必須）。いつでも解約OK。
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* プランカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {PLANS.map(plan => (
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
              {/* おすすめバッジ */}
              {plan.highlight && (
                <>
                  {/* 上部カラーバー */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#1A2F6E] rounded-t-xl" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8342A] text-white text-[10px] font-black px-4 py-1 rounded-full shadow-md tracking-wide">
                    ⭐ おすすめ
                  </div>
                </>
              )}

              <div className="mb-6 mt-2">
                <h2 className="text-lg font-black text-gray-800 mb-0.5">{plan.name}</h2>
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
                {plan.features.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                        f.ok
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-300'
                      }`}
                    >
                      {f.ok ? '✓' : '✗'}
                    </span>
                    <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`block w-full text-center py-3 rounded-xl font-black text-sm transition-all active:scale-95 ${
                  plan.highlight
                    ? 'bg-[#1A2F6E] text-white hover:bg-[#0f1d45] shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* モニター（創業メンバー）特典 */}
        <div
          className="relative rounded-2xl p-8 mb-10 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1A2F6E 0%, #243d8a 60%, #2a4fab 100%)',
          }}
        >
          {/* テントストライプ */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg, transparent, transparent 10px,
                rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px
              )`,
            }}
          />
          {/* 装飾テント */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none">
            <svg width="80" height="70" viewBox="0 0 80 70" fill="white">
              <path d="M40 4 L76 66 H4 Z"/>
              <rect x="33" y="44" width="14" height="22" rx="1"/>
            </svg>
          </div>

          <div className="relative flex items-start gap-5">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-full tracking-wide">
                  先着10社限定
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Noto Serif JP, serif' }}>
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
                {['3ヶ月無料', '¥980/月（永久固定）', 'スタンダード全機能'].map(t => (
                  <span key={t} className="bg-white/15 border border-white/20 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1 h-4 bg-[#E8342A] rounded inline-block" />
            よくある質問
          </h2>
          <div className="space-y-3">
            {[
              {
                q: '無料期間中にカードを請求されますか？',
                a: 'トライアル期間中（3ヶ月）は一切請求されません。カード登録は4ヶ月目以降の課金開始時に必要です。',
              },
              {
                q: 'いつでも解約できますか？',
                a: 'はい、いつでも解約できます。解約後はトライアル期間内であれば引き続き使用可能です。',
              },
              {
                q: 'プランの変更はできますか？',
                a: 'ライト⇔スタンダードの変更はいつでも可能です。アップグレードは即時反映されます。',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="font-bold text-sm text-gray-800 mb-2 flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#1A2F6E]/10 text-[#1A2F6E] rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">Q</span>
                  {item.q}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed pl-7">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/login"
            className="inline-block bg-[#1A2F6E] text-white font-black px-10 py-4 rounded-2xl hover:bg-[#0f1d45] transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            無料で始める（3ヶ月）
          </Link>
          <p className="text-xs text-gray-400 mt-3">クレジットカード不要・いつでも解約OK</p>
        </div>
      </div>
    </div>
  )
}
