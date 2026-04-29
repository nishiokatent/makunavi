'use client'

import dynamic from 'next/dynamic'

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
