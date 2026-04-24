'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/tentalk'

type FormData = {
  display_name: string
  company_name: string
  company_name_visible: boolean
  location: string
  location_visible: boolean
  business_type: string
  business_type_visible: boolean
  bio: string
  bio_visible: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<FormData>({
    display_name: '',
    company_name: '',
    company_name_visible: false,
    location: '',
    location_visible: false,
    business_type: '',
    business_type_visible: false,
    bio: '',
    bio_visible: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          display_name: data.display_name ?? '',
          company_name: data.company_name ?? '',
          company_name_visible: data.company_name_visible ?? false,
          location: data.location ?? '',
          location_visible: data.location_visible ?? false,
          business_type: data.business_type ?? '',
          business_type_visible: data.business_type_visible ?? false,
          bio: data.bio ?? '',
          bio_visible: data.bio_visible ?? false,
        })
      }
    }
    load()
  }, [supabase])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let avatar_url = profile?.avatar_url

    // アバター画像アップロード
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const filename = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('tentalk-images')
        .upload(filename, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('tentalk-images')
          .getPublicUrl(filename)
        avatar_url = publicUrl
      }
    }

    await supabase.from('profiles').update({
      ...form,
      avatar_url,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const planLabel = profile?.is_monitor ? 'モニター（創業メンバー）' : profile?.plan === 'lite' ? 'ライト' : 'スタンダード'
  const planPrice = profile?.is_monitor ? '¥980/月（永久固定）' : profile?.plan === 'lite' ? '¥980/月' : '¥1,980/月'

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold text-[#1A2F6E] mb-6">プロフィール設定</h1>

      {/* アバター */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-4">プロフィール写真</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
            {avatarPreview || profile?.avatar_url ? (
              <img src={avatarPreview ?? profile?.avatar_url ?? ''} alt="" className="w-full h-full object-cover" />
            ) : (
              (form.display_name?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <label className="cursor-pointer text-sm text-[#1A2F6E] hover:underline">
            写真を変更
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4 space-y-5">
        <h2 className="text-sm font-medium text-gray-700">基本情報</h2>

        <Field label="表示名 *">
          <input
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            placeholder="山田 太郎"
            className="input"
          />
        </Field>

        <FieldWithToggle
          label="会社名"
          value={form.company_name}
          visible={form.company_name_visible}
          placeholder="西岡テント"
          onChange={v => setForm(f => ({ ...f, company_name: v }))}
          onToggle={v => setForm(f => ({ ...f, company_name_visible: v }))}
        />

        <FieldWithToggle
          label="活動エリア"
          value={form.location}
          visible={form.location_visible}
          placeholder="京都府"
          onChange={v => setForm(f => ({ ...f, location: v }))}
          onToggle={v => setForm(f => ({ ...f, location_visible: v }))}
        />

        <FieldWithToggle
          label="業態"
          value={form.business_type}
          visible={form.business_type_visible}
          placeholder="テント・日除け施工業"
          onChange={v => setForm(f => ({ ...f, business_type: v }))}
          onToggle={v => setForm(f => ({ ...f, business_type_visible: v }))}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-600">自己紹介</label>
            <VisibleToggle
              visible={form.bio_visible}
              onChange={v => setForm(f => ({ ...f, bio_visible: v }))}
            />
          </div>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="京都でテント・日除けの施工をしています。お気軽にご相談ください。"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1A2F6E]"
          />
        </div>
      </div>

      {/* プラン情報 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">現在のプラン</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-[#1A2F6E]">{planLabel}</div>
            <div className="text-xs text-gray-400">{planPrice}</div>
          </div>
          {!profile?.is_monitor && (
            <a href="/pricing" className="text-xs text-[#1A2F6E] hover:underline">
              プランを変更 →
            </a>
          )}
        </div>
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#1A2F6E] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#152560] transition-colors"
      >
        {saving ? '保存中...' : saved ? '✓ 保存しました' : '保存する'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function FieldWithToggle({
  label, value, visible, placeholder, onChange, onToggle,
}: {
  label: string; value: string; visible: boolean; placeholder: string
  onChange: (v: string) => void; onToggle: (v: boolean) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <VisibleToggle visible={visible} onChange={onToggle} />
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A2F6E]"
      />
    </div>
  )
}

function VisibleToggle({ visible, onChange }: { visible: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!visible)}
      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
        visible
          ? 'border-green-500 text-green-600 bg-green-50'
          : 'border-gray-300 text-gray-400 bg-gray-50'
      }`}
    >
      {visible ? '公開' : '非公開'}
    </button>
  )
}
