import type { Metadata } from 'next'
import { Noto_Sans_JP, Noto_Serif_JP, Roboto_Mono } from 'next/font/google'
import './globals.css'
import { NumberWheelGuard } from '@/components/layout/NumberWheelGuard'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
})

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
  variable: '--font-serif-jp',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export const metadata: Metadata = {
  title: '幕ナビ | Tent Business Tool',
  description: '見積もりから図面まで、一本で。テント屋のための業務効率化ツール。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${notoSansJP.className} ${notoSerifJP.variable} ${robotoMono.variable} h-full antialiased`}>
        <NumberWheelGuard />
        {children}
      </body>
    </html>
  )
}
