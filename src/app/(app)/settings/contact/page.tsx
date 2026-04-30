'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const COMPANY_EMAIL = 'shunki.west.1995@gmail.com'

export default function ContactPage() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      supabase.from('profiles').select('display_name').eq('id', user.id).single()
        .then(({ data }) => { if (data?.display_name) setName(data.display_name) })
    })
  }, [])

  const canSubmit = name.trim() && email.trim() && message.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const body = [
      `お名前：${name}`,
      `メールアドレス：${email}`,
      '',
      '─────────',
      message,
      '',
      '─────────',
      '※幕ナビ お問い合わせフォームより送信',
    ].join('\n')
    const mailtoUrl =
      `mailto:${COMPANY_EMAIL}` +
      `?subject=${encodeURIComponent(`【幕ナビ】${subject || 'お問い合わせ'}`)}` +
      `&body=${encodeURIComponent(body)}`
    window.location.href = mailtoUrl
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 px-4">

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
        <h1 className="text-lg font-bold text-[#1A2F6E]">お問い合わせ</h1>
      </div>

      {/* 運営会社情報 */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">運営会社</h2>
        <dl className="space-y-2.5 text-sm">
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
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          お電話・メールでも直接お問い合わせいただけます。
          下のフォームから送信いただいた場合、ご利用のメールアプリが起動します。
        </p>
      </div>

      {/* 問い合わせフォーム */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-700">お問い合わせフォーム</h2>

        <Field label="お名前" required>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：山田 太郎"
            className="input"
            required
          />
        </Field>

        <Field label="メールアドレス" required>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@example.com"
            className="input"
            required
          />
        </Field>

        <Field label="件名">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="例：機能のご要望について"
            className="input"
          />
        </Field>

        <Field label="お問い合わせ内容" required>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="お問い合わせ内容をご記入ください"
            rows={6}
            className="input resize-none"
            required
          />
        </Field>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-[#1A2F6E] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#152560] transition-colors"
        >
          メールアプリで送信する
        </button>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          ボタンを押すと、お使いのメールアプリが起動します。<br />
          内容を確認のうえ送信してください。
        </p>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          background: #fafafa;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #1A2F6E;
          background: white;
        }
      `}</style>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}
