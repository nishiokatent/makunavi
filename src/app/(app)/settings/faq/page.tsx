'use client'

import Link from 'next/link'
import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
  category: string
}

const FAQ: FaqItem[] = [
  // ─── サービス全般 ─────────────────
  {
    category: 'サービス全般',
    q: '幕ナビ（Maku Navi）はどんなサービスですか？',
    a: '全国のテント屋さん向けに作られた業務支援ツールです。見積もり自動生成（てんみつ君）、生地張替シミュレーター（てんつ君）、要尺計算スピードチャレンジ（要尺GP）、テント屋専用SNS（テントーク）の4つのツールをご利用いただけます。',
  },
  {
    category: 'サービス全般',
    q: 'スマホでも使えますか？',
    a: 'はい、PC・スマホ両対応です。レスポンシブデザインで、外出先からでも快適にご利用いただけます。',
  },
  {
    category: 'サービス全般',
    q: '無料で試せますか？',
    a: 'はい。カード登録のみで3ヶ月の無料トライアル期間を設けています。期間中はすべての機能をお使いいただけ、4ヶ月目から自動課金が始まります。期間内であればいつでも解約可能です。',
  },

  // ─── 料金・プラン ─────────────────
  {
    category: '料金・プラン',
    q: '料金プランを教えてください',
    a: 'ライトプラン¥980/月、スタンダードプラン¥1,980/月、創業メンバー向けモニタープラン¥980/月（永久固定価格）の3種類をご用意しています。年額プランもございます。',
  },
  {
    category: '料金・プラン',
    q: 'プランの違いは何ですか？',
    a: 'ライトプランでは見積もり自動生成とテントークがご利用いただけます。スタンダードプランは追加で生地シミュレーター・要尺GP・カーテン見積・PDF出力が使えます。モニタープランはスタンダード相当の機能を半額の永久固定価格でご利用いただけます。',
  },
  {
    category: '料金・プラン',
    q: '解約はできますか？',
    a: 'はい、いつでも解約可能です。アカウント情報ページから手続きいただけます。解約後も契約期間内は機能をご利用いただけます。',
  },

  // ─── 機能 ─────────────────────
  {
    category: '機能',
    q: '見積もりのPDF出力はできますか？',
    a: 'スタンダードプラン以上で対応予定です。ご利用準備が整い次第、順次提供させていただきます。',
  },
  {
    category: '機能',
    q: 'AIの投稿文生成は本当に使えますか？',
    a: 'はい。施工タイプ・場所・サイズ・生地などの情報を入力するだけで、テントーク用とInstagram用の投稿文を同時に生成します。トーン（職人メモ風／信頼感重視など）も選べ、生成後の編集・再生成も可能です。',
  },
  {
    category: '機能',
    q: '他のテント屋さんとつながれますか？',
    a: 'はい、テントークで全国のテント屋さんと交流いただけます。施工写真の投稿、いいね、コメントなど一般的なSNSと同じ感覚でご利用ください。',
  },

  // ─── データ・セキュリティ ───────────
  {
    category: 'データ・セキュリティ',
    q: 'データは安全ですか？',
    a: 'お客様のデータはSupabase（業界標準のセキュアなクラウドDB）に暗号化して保存しています。第三者への提供は、ユーザー本人の同意がある場合または法令に基づく場合を除き行いません。',
  },
  {
    category: 'データ・セキュリティ',
    q: '見積もりデータは他の会社から見えますか？',
    a: 'いいえ。見積もりデータ、案件情報、マスタ設定はすべてアカウントごとに完全分離されており、他のユーザーから閲覧されることはありません。',
  },

  // ─── アカウント ───────────────
  {
    category: 'アカウント',
    q: 'パスワードを忘れた場合は？',
    a: '幕ナビはGoogleアカウントでのログインに対応しています。Googleアカウントのパスワード再設定からお手続きください。',
  },
  {
    category: 'アカウント',
    q: '会社情報を変更したい',
    a: '設定 → アカウント情報 から会社名・お名前・電話番号などを変更できます。',
  },
  {
    category: 'アカウント',
    q: 'メールアドレスを変更できますか？',
    a: 'ログイン用メールアドレスは現在変更不可となっております。変更が必要な場合はお問い合わせフォームからご連絡ください。',
  },
]

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  // カテゴリーごとにグループ化
  const grouped = FAQ.reduce<Record<string, FaqItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  let counter = -1

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">

      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center -ml-2 text-gray-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#1A2F6E]">よくあるご質問（FAQ）</h1>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {category}
            </h2>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {items.map(item => {
                counter++
                const idx = counter
                const isOpen = openIdx === idx
                return (
                  <div key={idx} className="border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-800 flex-1">
                        <span className="text-[#E8342A] font-black mr-1.5">Q.</span>{item.q}
                      </span>
                      <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed bg-gray-50/50">
                        <span className="text-[#1A2F6E] font-black mr-1.5">A.</span>{item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* お問い合わせ誘導 */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
          <div className="text-sm font-bold text-[#1A2F6E] mb-1">お探しの答えが見つかりませんでしたか？</div>
          <div className="text-xs text-gray-600 mb-3">お気軽にお問い合わせください</div>
          <Link
            href="/settings/contact"
            className="inline-flex items-center gap-2 bg-[#1A2F6E] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-[#152560] transition-colors"
          >
            お問い合わせはこちら
          </Link>
        </div>
      </div>
    </div>
  )
}
