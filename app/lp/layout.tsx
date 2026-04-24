import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '幕ナビ | テント屋のための業務効率化ツール',
  description:
    '見積もり自動計算・生地シミュレーション・要尺トレーニング・テント屋専用SNS。月額¥980〜で、すべてのテント業務を効率化。3ヶ月無料トライアル。',
  openGraph: {
    title: '幕ナビ | テント屋のための業務効率化ツール',
    description:
      '見積もり自動計算・生地シミュレーション・要尺トレーニング・テント屋専用SNS。月額¥980〜。3ヶ月無料。',
    type: 'website',
  },
}

export default function LPLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
