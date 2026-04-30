'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types/tentalk'

type ProfileForm = {
  display_name: string
  avatar_url: string | null
}

export default function TenTalkProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileForm>({ display_name: '', avatar_url: null })
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setMyUserId(user.id)

    const [{ data: profile }, { data: postsData }] = await Promise.all([
      supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single(),
      supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    if (profile) {
      setForm({ display_name: profile.display_name ?? '', avatar_url: profile.avatar_url ?? null })
    }
    setPosts(postsData ?? [])
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadData() }, [loadData])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!myUserId) return
    if (!form.display_name.trim()) { setSaveError('表示名を入力してください'); return }
    setSaving(true)
    setSaveError(null)

    let avatar_url = form.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg'
      const filename = `${myUserId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('tentalk-images')
        .upload(filename, avatarFile, { upsert: true })
      if (uploadError) {
        setSaveError('画像のアップロードに失敗しました: ' + uploadError.message)
        setSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('tentalk-images').getPublicUrl(filename)
      avatar_url = publicUrl
    }

    const { error } = await supabase.from('profiles').upsert({
      id: myUserId,
      display_name: form.display_name.trim(),
      avatar_url,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (error) {
      setSaveError('保存に失敗しました: ' + error.message)
      setSaving(false)
      return
    }

    setForm(f => ({ ...f, avatar_url }))
    setAvatarFile(null)
    setAvatarPreview(null)
    setSaving(false)
    setEditing(false)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  const displayAvatar = avatarPreview ?? form.avatar_url

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← 戻る</button>
        <h1 className="text-lg font-bold text-[#1A2F6E]">マイプロフィール</h1>
      </div>

      {/* プロフィールカード */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        {editing ? (
          <div className="space-y-4">
            {/* アバター編集 */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-2xl font-bold overflow-hidden cursor-pointer flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (form.display_name[0] ?? '?').toUpperCase()
                )}
              </div>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-[#1A2F6E] hover:underline"
                >
                  写真を変更
                </button>
                <p className="text-xs text-gray-400 mt-0.5">タップして選択</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* 表示名 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">表示名</label>
              <input
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="テント太郎 / ○○テント / テント職人"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A2F6E]"
              />
            </div>

            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#1A2F6E] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
              <button
                onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); setSaveError(null) }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1A2F6E] flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (form.display_name[0] ?? '?').toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900">{form.display_name || '（未設定）'}</div>
              <div className="text-xs text-gray-400 mt-0.5">投稿数 {posts.length}件</div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-[#1A2F6E] border border-[#1A2F6E] px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              編集
            </button>
          </div>
        )}
      </div>

      {/* 投稿一覧 */}
      <h2 className="text-sm font-medium text-gray-700 mb-3">投稿一覧</h2>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📷</p>
          <p className="font-medium">まだ投稿がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <MyPostCard
              key={post.id}
              post={post}
              onDelete={() => handleDelete(post.id)}
              fmt={fmt}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MyPostCard({ post, onDelete, fmt }: { post: Post; onDelete: () => void; fmt: (s: string) => string }) {
  const [imgIdx, setImgIdx] = useState(0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {post.images.length > 0 && (
        <div className="relative bg-gray-100">
          <img src={post.images[imgIdx]} alt="" className="w-full aspect-square object-cover" />
          {post.images.length > 1 && (
            <>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {post.images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center">‹</button>
              )}
              {imgIdx < post.images.length - 1 && (
                <button onClick={() => setImgIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center">›</button>
              )}
            </>
          )}
        </div>
      )}
      <div className="px-4 py-3">
        {post.caption && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">{post.caption}</p>
        )}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.hashtags.map(tag => (
              <span key={tag} className="text-xs text-[#1A2F6E]">#{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{fmt(post.created_at)}</span>
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
