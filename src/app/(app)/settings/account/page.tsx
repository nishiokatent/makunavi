'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/tentalk'

type FormData = {
  display_name: string
  company_name: string
  company_name_visible: boolean
  phone: string
  location: string
  location_visible: boolean
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRequired = searchParams.get('required') === '1'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState<FormData>({
    display_name: '',
    company_name: '',
    company_name_visible: false,
    phone: '',
    location: '',
    location_visible: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [avatarFile, setAvatarFile]       = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          display_name:         data.display_name ?? '',
          company_name:         data.company_name ?? '',
          company_name_visible: data.company_name_visible ?? false,
          phone:                data.phone ?? '',
          location:             data.location ?? '',
          location_visible:     data.location_visible ?? false,
        })
      }
    }
    load()
  }, [supabase, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setError(null)
    if (!form.display_name.trim()) { setError('お名前を入力してください'); return }
    if (!form.company_name.trim()) { setError('会社名を入力してください'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let avatar_url = profile?.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const filename = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('tentalk-images')
        .upload(filename, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('tentalk-images').getPublicUrl(filename)
        avatar_url = publicUrl
      }
    }

    const { error: updateError } = await supabase.from('profiles').update({
      ...form,
      avatar_url,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)
    if (updateError) {
      setError(`保存に失敗しました: ${updateError.message}`)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (isRequired) router.replace('/dashboard')
  }

  const planLabel = profile?.is_monitor
    ? 'モニター（創業メンバー）'
    : profile?.plan === 'lite' ? 'ライト' : 'スタンダード'
  const planPrice = profile?.is_monitor
    ? '¥980/月（永久固定）'
    : profile?.plan === 'lite' ? '¥980/月' : '¥1,980/月'

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 px-4">

      {/* ヘッダー（戻る + タイトル） */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center -ml-2 text-gray-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#1A2F6E]">アカウント情報</h1>
      </div>

      {/* 必須項目案内（初回ログイン時） */}
      {isRequired && (
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 mb-4">
          <div className="text-sm font-bold text-amber-800 mb-1">初期設定をお願いします</div>
          <div className="text-xs text-amber-700 leading-relaxed">
            ご利用の前に、<strong>会社名</strong>と<strong>お名前</strong>の登録が必要です。下のフォームに入力して保存してください。
          </div>
        </div>
      )}

      {/* アバター */}
      <Card title="プロフィール写真">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
            {avatarPreview || profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview ?? profile?.avatar_url ?? ''} alt="" className="w-full h-full object-cover" />
            ) : (
              (form.display_name?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <label className="cursor-pointer text-sm text-[#1A2F6E] hover:underline font-medium">
            写真を変更
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
      </Card>

      {/* 必須項目 */}
      <Card title="基本情報" required>
        <Field label="お名前" required>
          <input
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            placeholder="例：テント太郎"
            className="input-base"
          />
        </Field>
        <Field label="会社名" required>
          <div className="flex items-center gap-2">
            <input
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="例：○○テント"
              className="input-base flex-1"
            />
            <VisibleToggle
              visible={form.company_name_visible}
              onChange={v => setForm(f => ({ ...f, company_name_visible: v }))}
            />
          </div>
        </Field>
        <Field label="メールアドレス（ログイン用）">
          <input
            value={email}
            disabled
            className="input-base bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-[10px] text-gray-400 mt-1">ログイン用のメールアドレスは変更できません</p>
        </Field>
      </Card>

      {/* 任意項目 */}
      <Card title="連絡先・その他（任意）">
        <Field label="電話番号">
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="例：075-313-8498"
            className="input-base"
          />
        </Field>
        <Field label="会社所在地（住所）">
          <input
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="例：京都府京都市下京区〇〇町1-1"
            className="input-base"
          />
        </Field>
      </Card>

      {/* プラン */}
      <Card title="現在のプラン">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-[#1A2F6E]">{planLabel}</div>
            <div className="text-xs text-gray-400">{planPrice}</div>
          </div>
          {!profile?.is_monitor && (
            <Link href="/pricing" className="text-xs text-[#1A2F6E] hover:underline font-medium">
              プランを変更 →
            </Link>
          )}
        </div>
      </Card>

      {/* エラー */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-3">
          {error}
        </div>
      )}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#1A2F6E] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#152560] transition-colors"
      >
        {saving ? '保存中...' : saved ? '✓ 保存しました' : '保存する'}
      </button>

      <style jsx>{`
        :global(.input-base) {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: #fafafa;
        }
        :global(.input-base:focus) {
          outline: none;
          border-color: #1A2F6E;
          background: white;
        }
      `}</style>
    </div>
  )
}

function Card({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-3 space-y-4">
      <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
        {title}
        {required && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">必須含む</span>}
      </h2>
      {children}
    </div>
  )
}

function Field({
  label, required, toggle, children,
}: {
  label: string
  required?: boolean
  toggle?: { visible: boolean; onChange: (v: boolean) => void }
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {toggle && <VisibleToggle visible={toggle.visible} onChange={toggle.onChange} />}
      </div>
      {children}
    </div>
  )
}

function VisibleToggle({ visible, onChange }: { visible: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!visible)}
      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors flex-shrink-0 ${
        visible
          ? 'border-green-500 text-green-600 bg-green-50'
          : 'border-gray-300 text-gray-400 bg-gray-50'
      }`}
    >
      {visible ? '公開' : '非公開'}
    </button>
  )
}
