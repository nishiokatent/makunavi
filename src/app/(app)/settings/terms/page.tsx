import Link from 'next/link'

export default function TermsPage() {
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
        <h1 className="text-lg font-bold text-[#1A2F6E]">利用規約</h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-7 text-sm text-gray-700 leading-relaxed space-y-5">

        <p>
          本利用規約（以下「本規約」といいます）は、West Hill（以下「当社」といいます）が提供する「幕ナビ」（以下「本サービス」といいます）の利用条件を定めるものです。本サービスを利用するすべての方（以下「ユーザー」といいます）には、本規約に同意のうえご利用いただきます。
        </p>

        <Section title="第1条（適用）">
          <p>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
        </Section>

        <Section title="第2条（利用登録）">
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>本サービスの利用を希望する者は、本規約に同意のうえ、当社の定める方法により利用登録を申請するものとします。</li>
            <li>当社は、利用登録の申請者が以下のいずれかに該当する場合、登録を承認しないことがあります。
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>虚偽の事項を届け出た場合</li>
                <li>本規約に違反したことがある者からの申請である場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>
            </li>
          </ol>
        </Section>

        <Section title="第3条（料金および支払方法）">
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>ユーザーは、本サービスの有料部分の対価として、当社が別途定める利用料金を支払うものとします。</li>
            <li>ユーザーが利用料金の支払を遅滞した場合、年14.6%の割合による遅延損害金を支払うものとします。</li>
            <li>無料トライアル期間中に解約しなかった場合、自動的に有料プランへ移行し課金が開始されます。</li>
          </ol>
        </Section>

        <Section title="第4条（禁止事項）">
          <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当社、他のユーザーまたはその他第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
            <li>本サービスの運営を妨害するおそれのある行為</li>
            <li>不正アクセスをし、またはこれを試みる行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>本サービスを商用目的で第三者に提供・転売する行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section title="第5条（投稿コンテンツ）">
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>ユーザーは、テントーク等で投稿するコンテンツ（写真、文章等）について、自らがその投稿に必要な権利を有することを保証するものとします。</li>
            <li>ユーザーは、投稿コンテンツについて、当社に対し、本サービスの提供・改善・宣伝のために必要な範囲で利用できる権利を許諾するものとします。</li>
            <li>当社は、投稿コンテンツが本規約に違反すると判断した場合、ユーザーに通知することなく削除することができます。</li>
          </ol>
        </Section>

        <Section title="第6条（本サービスの提供の停止等）">
          <p>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前通知することなく本サービスの全部または一部の提供を停止または中断できるものとします。</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>本サービスにかかるシステムの保守点検または更新を行う場合</li>
            <li>地震、落雷、火災、停電または天災などの不可抗力により提供が困難となった場合</li>
            <li>コンピュータまたは通信回線等が事故により停止した場合</li>
            <li>その他、当社が停止または中断を必要と判断した場合</li>
          </ul>
        </Section>

        <Section title="第7条（利用制限および登録抹消）">
          <p>当社は、ユーザーが本規約のいずれかに違反した場合、事前の通知なく投稿コンテンツの削除、本サービスの利用制限またはアカウントの削除を行うことができます。</p>
        </Section>

        <Section title="第8条（保証の否認および免責事項）">
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しません。</li>
            <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。</li>
            <li>本サービスにおいて生成・自動計算された見積データ・要尺データは参考情報であり、実際の取引における正確性は保証されません。最終的な確認はユーザーの責任において行うものとします。</li>
          </ol>
        </Section>

        <Section title="第9条（サービス内容の変更等）">
          <p>当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあります。</p>
        </Section>

        <Section title="第10条（利用規約の変更）">
          <p>当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができます。変更後の本規約は、本サービス上に掲示した時点から効力を生じるものとします。</p>
        </Section>

        <Section title="第11条（準拠法・裁判管轄）">
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
            <li>本サービスに関して紛争が生じた場合には、京都地方裁判所を専属的合意管轄とします。</li>
          </ol>
        </Section>

        <p className="text-xs text-gray-400 pt-3">
          制定日：2026年4月1日<br />
          最終改定日：2026年4月30日<br /><br />
          West Hill / 西岡駿生
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
