import Link from 'next/link'

const COMPANY_EMAIL = 'shunki.west.1995@gmail.com'

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 px-4">
      <div className="flex items-center gap-2 mb-5">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center -ml-2 text-gray-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#1A2F6E]">お問い合わせ</h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4">運営会社</h2>
        <dl className="space-y-3 text-sm">
          <Row label="会社名" value="West Hill" />
          <Row label="担当者" value="西岡 駿生" />
          <Row label="電話番号" value={
            <a href="tel:0753138498" className="text-[#1A2F6E] hover:underline font-medium">
              075-313-8498
            </a>
          } />
          <Row label="メール" value={
            <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#1A2F6E] hover:underline font-medium break-all">
              {COMPANY_EMAIL}
            </a>
          } />
        </dl>
        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
          お電話またはメールにてお気軽にお問い合わせください。<br />
          営業時間：平日 9:00〜18:00
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs text-gray-500 w-16 flex-shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-gray-800 flex-1">{value}</dd>
    </div>
  )
}
