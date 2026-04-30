import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'てんつ君 | 幕ナビ',
  description: '生地張替シミュレーター・新調シミュレーター',
}

const TentsukuCanvas = dynamic(
  () => import('@/components/tentsukun/TentsukuCanvas'),
  { ssr: false }
)

export default function TentsukuPage() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TentsukuCanvas />
    </div>
  )
}
