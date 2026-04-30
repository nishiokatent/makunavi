import Link from 'next/link'

export default function PrivacyPage() {
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
        <h1 className="text-lg font-bold text-[#1A2F6E]">プライバシーポリシー</h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-7 text-sm text-gray-700 leading-relaxed space-y-5">

        <p>
          West Hill（以下「当社」といいます）は、当社が提供するサービス「幕ナビ」（以下「本サービス」といいます）における、ユーザーの個人情報を含む情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
        </p>

        <Section title="1. 取得する情報">
          <p>当社は、本サービスの提供にあたり、以下の情報を取得します。</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>氏名、会社名、メールアドレス、電話番号などのアカウント情報</li>
            <li>会社所在地、活動エリア等のプロフィール情報</li>
            <li>本サービス上で作成・保存された見積データ・案件データ・施工写真等</li>
            <li>アクセスログ、Cookie、デバイス情報、利用履歴</li>
          </ul>
        </Section>

        <Section title="2. 利用目的">
          <p>取得した情報は、以下の目的のために利用します。</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>本サービスの提供・運営・維持・改善のため</li>
            <li>ユーザー認証およびアカウント管理のため</li>
            <li>料金の請求、支払い処理のため</li>
            <li>お問い合わせ対応、サービスに関するご案内のため</li>
            <li>不正利用の検知・防止のため</li>
            <li>サービス向上のための統計分析のため（個人を特定できない形に加工して利用）</li>
          </ul>
        </Section>

        <Section title="3. 第三者提供">
          <p>当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>業務委託先（決済代行、クラウドサービス、地図API等）に必要な範囲で提供する場合</li>
          </ul>
        </Section>

        <Section title="4. 業務委託先（外部サービス）">
          <p>当社は、本サービスの運営にあたり、以下の外部サービスを利用しています。</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Supabase（データベース・認証）</li>
            <li>Vercel（ホスティング）</li>
            <li>Stripe（決済処理）</li>
            <li>Anthropic Claude API（AI投稿文生成）</li>
            <li>Open-Meteo（天気予報）</li>
            <li>OpenStreetMap Nominatim（住所のジオコーディング）</li>
          </ul>
        </Section>

        <Section title="5. 開示・訂正・削除">
          <p>
            ユーザーは、当社に対して自己の個人情報の開示、訂正、追加、削除を求めることができます。請求があった場合、本人確認を行った上で、合理的な期間内に対応します。お問い合わせは下記窓口までお願いいたします。
          </p>
        </Section>

        <Section title="6. 安全管理措置">
          <p>
            当社は、取得した情報の漏えい、滅失または毀損の防止その他、情報の安全管理のために必要かつ適切な措置を講じます。
          </p>
        </Section>

        <Section title="7. プライバシーポリシーの変更">
          <p>
            当社は、必要に応じて本ポリシーの内容を変更することがあります。変更後の本ポリシーは、本サービス上に掲載した時点から効力を生じるものとします。
          </p>
        </Section>

        <Section title="8. お問い合わせ窓口">
          <div className="bg-gray-50 rounded-lg p-4 mt-2 space-y-1 text-xs">
            <div>会社名：West Hill</div>
            <div>担当者：西岡 駿生</div>
            <div>電話番号：075-313-8498</div>
            <div>メール：shunki.west.1995@gmail.com</div>
          </div>
        </Section>

        <p className="text-xs text-gray-400 pt-3">
          制定日：2026年4月1日<br />
          最終改定日：2026年4月30日
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-bold text-[#1A2F6E] text-base mb-2">{title}</h2>
      <div className="text-[13px]">{children}</div>
    </section>
  )
}
