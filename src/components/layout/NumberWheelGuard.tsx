'use client'

import { useEffect } from 'react'

export function NumberWheelGuard() {
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      const t = e.target as HTMLElement | null
      if (
        t instanceof HTMLInputElement &&
        t.type === 'number' &&
        document.activeElement === t
      ) {
        t.blur()
      }
    }
    document.addEventListener('wheel', handler, { passive: true })
    return () => document.removeEventListener('wheel', handler)
  }, [])
  return null
}
