'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f1d45 0%, #1A2F6E 55%, #243d8a 100%)',
      }}
    >
      {/* テントストライプ背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 12px,
            rgba(255,255,255,0.025) 12px,
            rgba(255,255,255,0.025) 24px
          )`,
        }}
      />

      {/* 浮かぶ装飾円 */}
      <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2a4fab 0%, transparent 70%)' }} />
      <div className="absolute bottom-16 right-1/4 w-56 h-56 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8342A 0%, transparent 70%)' }} />

      {/* カード */}
      <div className="relative w-full max-w-sm animate-bounceIn">
        {/* カード上部の赤いアクセントバー */}
        <div className="h-1.5 bg-[#E8342A] rounded-t-2xl" />

        <div className="bg-white rounded-b-2xl shadow-2xl px-8 pt-8 pb-8"
          style={{ boxShadow: '0 24px 64px rgba(10,20,50,0.45)' }}>

          {/* ロゴ */}
          <div className="text-center mb-7">
            {/* テントアイコン — 幕をイメージした三角形 */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1A2F6E, #243d8a)' }}>
              {/* テントシルエット (SVG) */}
              <svg width="34" height="30" viewBox="0 0 34 30" fill="none">
                <path d="M17 2 L32 28 H2 Z" fill="white" opacity="0.9"/>
                <path d="M17 2 L32 28 H2 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
                <line x1="17" y1="2" x2="17" y2="28" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                <rect x="13" y="18" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)"/>
              </svg>
              {/* 赤い右下角 */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#E8342A]"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
            </div>

            <h1 className="text-2xl font-black text-[#1A2F6E] tracking-wide"
              style={{ fontFamily: 'Noto Serif JP, serif' }}>
              幕ナビ
            </h1>
            <p className="text-[11px] font-semibold text-gray-400 tracking-[0.2em] uppercase mt-0.5">
              Tent Business Tool
            </p>
          </div>

          {/* キャッチコピー */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 mb-6 text-center border border-slate-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              テント屋が、テント屋のために作った<br/>
              <span className="font-semibold text-[#1A2F6E]">業務効率化ツール</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Googleログインボタン */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="text-gray-700 font-semibold text-sm">
              {loading ? 'ログイン中...' : 'Googleでログイン'}
            </span>
          </button>

          {/* 信頼シグナル */}
          <div className="flex items-center justify-center gap-4 mt-5 mb-4">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              3ヶ月無料
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              いつでも解約OK
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 leading-relaxed">
            ログインすることで
            <a href="/terms" className="text-[#1A2F6E] hover:underline">利用規約</a>
            に同意したことになります
          </p>
        </div>
      </div>
    </div>
  )
}
