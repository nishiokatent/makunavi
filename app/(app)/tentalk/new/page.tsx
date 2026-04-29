'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FabricPicker } from '@/components/tentalk/FabricPicker'
import type { Fabric } from '@/types/tenmitsukun'

// ─────────────────────────────────────────
// 定数
// ─────────────────────────────────────────

const TYPE_OPTIONS = [
  '張替え', '新調', 'カーテン', 'オーニング', '固定テント',
  '看板テント', 'ショート・日よけ', '防炎シート', 'カバー',
  'オリジナル製作', 'その他',
]

const BASE_OPTIONS = [
  '木造壁', 'ALC', 'コンクリート', 'スチール', '既存フレーム',
  '軒天', '工場', '店舗', '個人宅', 'その他',
]

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

const SEASON_OPTIONS = ['春', '夏', '秋', '冬', '梅雨', '行楽シーズン', '特になし']

type TentalkTone = 'memo' | 'report' | 'matome' | 'ask'
type InstagramTone = 'bright' | 'tryIt' | 'trust' | 'seasonal'

const TENTALK_TONES: { value: TentalkTone; label: string; desc: string }[] = [
  { value: 'memo',   label: '職人メモ風',       desc: '数値・工夫をそのまま記録したいとき' },
  { value: 'report', label: 'ひとこと報告',     desc: '気軽にサクッと投稿したいとき' },
  { value: 'matome', label: 'まとめ投稿',       desc: 'しっかり記録として残したいとき' },
  { value: 'ask',    label: 'みんなに聞いてみる', desc: '同業者に意見を求めたいとき' },
]

const INSTAGRAM_TONES: { value: InstagramTone; label: string; desc: string }[] = [
  { value: 'bright',   label: '明るく元気に',     desc: 'パッと目を引く明るいトーンで伝えたいとき' },
  { value: 'tryIt',    label: '使ってみたいな',   desc: '「ちょっとやってみたい」と思えるような提案トーン' },
  { value: 'trust',    label: '品質・信頼を伝える', desc: '丁寧な仕事ぶり・素材へのこだわりをアピール' },
  { value: 'seasonal', label: '季節感を添えて',   desc: '季節や風景と絡めた、ちょっとした雰囲気で' },
]

// ─────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────

function buildSizeString(width: string, depth: string, height: string): string {
  const parts: string[] = []
  if (width)  parts.push(`幅${Number(width).toLocaleString()}mm`)
  if (depth)  parts.push(`出幅${Number(depth).toLocaleString()}mm`)
  if (height) parts.push(`高さ${Number(height).toLocaleString()}mm`)
  return parts.join(' × ')
}

function buildFabricString(
  selected: Fabric | null,
  colorNote: string,
  freeInput: string,
): string {
  if (selected) {
    return colorNote.trim() ? `${selected.name} ${colorNote.trim()}` : selected.name
  }
  return freeInput.trim()
}

async function compressImage(file: File, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      const maxSize = 1920
      let { width, height } = img
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width); width = maxSize
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height); height = maxSize
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => { if (blob) resolve(blob); else reject(new Error('compress failed')) },
        'image/jpeg', quality,
      )
    }
    img.onerror = reject
  })
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ─────────────────────────────────────────
// ページ
// ─────────────────────────────────────────

export default function NewPostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // 初回名前入力ステップ
  const [nameStep, setNameStep] = useState<'loading' | 'needed' | 'done'>('loading')
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  // 写真
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // 入力フォーム
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedBases, setSelectedBases] = useState<string[]>([])
  const [width, setWidth] = useState('')
  const [depth, setDepth] = useState('')
  const [height, setHeight] = useState('')
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null)
  const [fabricColorNote, setFabricColorNote] = useState('')
  const [fabricFreeInput, setFabricFreeInput] = useState('')
  const [note, setNote] = useState('')
  const [background, setBackground] = useState('')
  const [area, setArea] = useState('')
  const [season, setSeason] = useState('')
  const [customerVoice, setCustomerVoice] = useState('')

  // トーン
  const [tentalkTone, setTentalkTone] = useState<TentalkTone>('memo')
  const [instagramTone, setInstagramTone] = useState<InstagramTone>('bright')

  // 生成結果
  const [tentalkText, setTentalkText] = useState('')
  const [instagramBody, setInstagramBody] = useState('')
  const [instagramTags, setInstagramTags] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  // 実行
  const [postToTenTalk, setPostToTenTalk] = useState(true)
  const [copyInstagramBody, setCopyInstagramBody] = useState(false)
  const [copyHashtagsOnly, setCopyHashtagsOnly] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ─────────────────────────────────────────
  // 初回：表示名チェック
  // ─────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
      if (!profile?.display_name?.trim()) {
        setNameStep('needed')
      } else {
        setNameStep('done')
      }
    }
    check()
  }, [supabase, router])

  const handleSaveName = async () => {
    if (!nameInput.trim()) { setNameError('表示名を入力してください'); return }
    if (!myUserId) return
    setNameSaving(true)
    setNameError(null)
    const { error } = await supabase.from('profiles').upsert({
      id: myUserId,
      display_name: nameInput.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (error) { setNameError('保存に失敗しました: ' + error.message); setNameSaving(false); return }
    setNameSaving(false)
    setNameStep('done')
  }

  // ─────────────────────────────────────────
  // 写真
  // ─────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length + images.length > 10) { alert('写真は最大10枚までです'); return }
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setImages(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setImages(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  // ─────────────────────────────────────────
  // チェックボックス切替
  // ─────────────────────────────────────────
  const toggleInArray = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]

  // ─────────────────────────────────────────
  // 生成
  // ─────────────────────────────────────────
  const fabricString = buildFabricString(selectedFabric, fabricColorNote, fabricFreeInput)
  const sizeString = buildSizeString(width, depth, height)

  const canGenerate =
    selectedTypes.length > 0 ||
    fabricString !== '' ||
    width !== '' ||
    depth !== '' ||
    height !== '' ||
    note.trim() !== '' ||
    background.trim() !== ''

  const handleGenerate = async () => {
    if (!canGenerate) {
      setAiError('施工情報をいずれか1項目以上入力してください')
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/tentalk/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fabric: fabricString,
          size: sizeString,
          type: selectedTypes.join('、'),
          base: selectedBases.join('、'),
          note,
          background,
          area,
          season,
          customerVoice,
          tentalkTone,
          instagramTone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error ?? `エラー ${res.status}`)
        return
      }
      setTentalkText(data.tentalk ?? '')
      setInstagramBody(data.instagram?.body ?? '')
      setInstagramTags(Array.isArray(data.instagram?.hashtags) ? data.instagram.hashtags : [])
      setHasGenerated(true)
    } catch (e) {
      setAiError('通信エラー: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setAiLoading(false)
    }
  }

  // ─────────────────────────────────────────
  // 実行
  // ─────────────────────────────────────────
  const canExecute = hasGenerated && (postToTenTalk || copyInstagramBody || copyHashtagsOnly)

  const handleExecute = async () => {
    if (!canExecute) return
    setSubmitting(true)
    const messages: string[] = []
    try {
      // ① テントーク投稿
      if (postToTenTalk) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('ログインが必要です')
        if (!tentalkText.trim() && images.length === 0) {
          throw new Error('テントーク本文または写真を入力してください')
        }

        const imageUrls: string[] = []
        for (const file of images) {
          const compressed = await compressImage(file)
          const filename = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('tentalk-images')
            .upload(filename, compressed)
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('tentalk-images').getPublicUrl(filename)
          imageUrls.push(publicUrl)
        }

        const { error: insertError } = await supabase.from('posts').insert({
          user_id: user.id,
          caption: tentalkText,
          images: imageUrls,
          hashtags: [],
        })
        if (insertError) throw insertError
        messages.push('テントークに投稿しました')
      }

      // ② Instagram文章コピー（本文＋ハッシュタグ）
      if (copyInstagramBody) {
        const hashtagLine = instagramTags.map(t => `#${t}`).join(' ')
        const fullText = [instagramBody, hashtagLine].filter(Boolean).join('\n\n')
        const ok = await copyToClipboard(fullText)
        messages.push(ok ? 'Instagram文章をコピーしました' : 'Instagram文章のコピーに失敗しました')
      }

      // ③ ハッシュタグのみコピー
      if (copyHashtagsOnly) {
        const hashtagLine = instagramTags.map(t => `#${t}`).join(' ')
        const ok = await copyToClipboard(hashtagLine)
        messages.push(ok ? 'ハッシュタグをコピーしました' : 'ハッシュタグのコピーに失敗しました')
      }

      alert(messages.join('\n'))
      if (postToTenTalk) router.push('/tentalk')
    } catch (err) {
      alert('実行に失敗しました: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────
  // レンダリング
  // ─────────────────────────────────────────

  if (nameStep === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (nameStep === 'needed') {
    return (
      <div className="max-w-xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← 戻る</button>
          <h1 className="text-xl font-bold text-[#1A2F6E]">テントークに参加する</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="text-3xl mb-4 text-center">👤</div>
          <h2 className="text-lg font-bold text-gray-800 text-center mb-2">まず表示名を決めましょう</h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
            テントークでの表示名を入力してください。<br />
            <span className="text-[#1A2F6E] font-medium">匿名・ニックネーム・本名・社名、なんでもOK</span>です。<br />
            次回からは自動で使われます（あとから変更できます）。
          </p>

          <div className="space-y-3">
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              placeholder="例：山田太郎 / 西岡テント / テント職人K"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A2F6E]"
              autoFocus
            />

            {nameError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{nameError}</p>
            )}

            <div className="flex gap-2 pt-1">
              {['匿名', 'テント職人', '施工専門'].map(example => (
                <button
                  key={example}
                  onClick={() => setNameInput(example)}
                  className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full hover:border-[#1A2F6E] hover:text-[#1A2F6E] transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveName}
              disabled={nameSaving || !nameInput.trim()}
              className="w-full bg-[#1A2F6E] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#152560] transition-colors mt-2"
            >
              {nameSaving ? '保存中...' : '決定して投稿へ進む →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 投稿フォーム ──
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← 戻る</button>
        <h1 className="text-xl font-bold text-[#1A2F6E]">新規投稿</h1>
      </div>

      {/* 写真選択 */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          写真を選択 <span className="text-gray-400 font-normal">（最大10枚）</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#1A2F6E] transition-colors"
        >
          <p className="text-3xl mb-2">📷</p>
          <p className="text-sm text-gray-500">タップして写真を選択</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square">
                <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-gray-800 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 施工タイプ */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          施工タイプ <span className="text-gray-400 font-normal">（複数選択可）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map(t => {
            const on = selectedTypes.includes(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTypes(prev => toggleInArray(prev, t))}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  on
                    ? 'bg-[#1A2F6E] text-white border-[#1A2F6E]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2F6E]'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </section>

      {/* 取付け場所・下地 */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          取付け場所・下地 <span className="text-gray-400 font-normal">（複数選択可）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {BASE_OPTIONS.map(b => {
            const on = selectedBases.includes(b)
            return (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBases(prev => toggleInArray(prev, b))}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  on
                    ? 'bg-[#1A2F6E] text-white border-[#1A2F6E]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2F6E]'
                }`}
              >
                {b}
              </button>
            )
          })}
        </div>
      </section>

      {/* サイズ */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">サイズ</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">幅</div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={width}
                onChange={e => setWidth(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:border-[#1A2F6E]"
              />
              <span className="text-xs text-gray-400">mm</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">出幅</div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={depth}
                onChange={e => setDepth(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:border-[#1A2F6E]"
              />
              <span className="text-xs text-gray-400">mm</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">高さ</div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={height}
                onChange={e => setHeight(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:border-[#1A2F6E]"
              />
              <span className="text-xs text-gray-400">mm</span>
            </div>
          </div>
        </div>
      </section>

      {/* 生地 */}
      <section className="mb-6">
        <FabricPicker
          selected={selectedFabric}
          onSelect={setSelectedFabric}
          colorNote={fabricColorNote}
          onChangeColorNote={setFabricColorNote}
          freeInput={fabricFreeInput}
          onChangeFreeInput={setFabricFreeInput}
        />
      </section>

      {/* 工夫・苦労 */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          施工の工夫・苦労した点 <span className="text-gray-400 font-normal">（任意）</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="例：下地が古かったので追加補強を入れました"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1A2F6E]"
        />
      </section>

      {/* 背景 */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          お客様の要望・背景 <span className="text-gray-400 font-normal">（任意）</span>
        </label>
        <textarea
          value={background}
          onChange={e => setBackground(e.target.value)}
          rows={3}
          placeholder="例：前のテントが10年経って劣化していたので新調したい"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1A2F6E]"
        />
      </section>

      {/* エリア */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          施工エリア <span className="text-gray-400 font-normal">（任意）</span>
        </label>
        <select
          value={area}
          onChange={e => setArea(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A2F6E]"
        >
          <option value="">選択してください</option>
          {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </section>

      {/* Instagram追加：季節 */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          季節・シーン <span className="text-gray-400 font-normal">（Instagram用・任意）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SEASON_OPTIONS.map(s => {
            const on = season === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSeason(on ? '' : s)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  on
                    ? 'bg-[#1A2F6E] text-white border-[#1A2F6E]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2F6E]'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </section>

      {/* Instagram追加：お客様への一言 */}
      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          お客様への一言・掲載OKコメント <span className="text-gray-400 font-normal">（Instagram用・任意）</span>
        </label>
        <textarea
          value={customerVoice}
          onChange={e => setCustomerVoice(e.target.value)}
          rows={2}
          placeholder="例：「明るくなって気持ちいい！」と喜んでいただけました"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1A2F6E]"
        />
      </section>

      {/* トーン選択 */}
      <section className="mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💬 テントーク用トーン
          </label>
          <div className="space-y-2">
            {TENTALK_TONES.map(t => (
              <label
                key={t.value}
                className={`flex items-start gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  tentalkTone === t.value
                    ? 'border-[#1A2F6E] bg-blue-50'
                    : 'border-gray-200 hover:border-[#1A2F6E]'
                }`}
              >
                <input
                  type="radio"
                  name="tentalkTone"
                  value={t.value}
                  checked={tentalkTone === t.value}
                  onChange={() => setTentalkTone(t.value)}
                  className="mt-0.5 accent-[#1A2F6E]"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{t.label}</div>
                  <div className="text-xs text-gray-500">{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📸 Instagram用トーン
          </label>
          <div className="space-y-2">
            {INSTAGRAM_TONES.map(t => (
              <label
                key={t.value}
                className={`flex items-start gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  instagramTone === t.value
                    ? 'border-[#1A2F6E] bg-blue-50'
                    : 'border-gray-200 hover:border-[#1A2F6E]'
                }`}
              >
                <input
                  type="radio"
                  name="instagramTone"
                  value={t.value}
                  checked={instagramTone === t.value}
                  onChange={() => setInstagramTone(t.value)}
                  className="mt-0.5 accent-[#1A2F6E]"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{t.label}</div>
                  <div className="text-xs text-gray-500">{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* まとめて生成ボタン */}
      <section className="mb-6">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || aiLoading}
          className="w-full bg-[#E8342A] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#d02820] transition-colors"
        >
          {aiLoading ? '生成中...' : '✨ まとめて生成'}
        </button>
        {aiError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {aiError}
          </div>
        )}
      </section>

      {/* 生成結果：2パネル */}
      {hasGenerated && (
        <section className="mb-6 grid md:grid-cols-2 gap-4">
          {/* テントーク用 */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">💬 テントーク用</div>
              <button
                type="button"
                onClick={() => copyToClipboard(tentalkText).then(ok => alert(ok ? 'コピーしました' : 'コピーに失敗しました'))}
                className="text-xs text-[#1A2F6E] hover:underline"
              >
                コピー
              </button>
            </div>
            <textarea
              value={tentalkText}
              onChange={e => setTentalkText(e.target.value)}
              rows={8}
              className="w-full border border-gray-100 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-[#1A2F6E]"
            />
          </div>

          {/* Instagram用 */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">📸 Instagram用</div>
              <button
                type="button"
                onClick={() => copyToClipboard(instagramBody).then(ok => alert(ok ? 'コピーしました' : 'コピーに失敗しました'))}
                className="text-xs text-[#1A2F6E] hover:underline"
              >
                本文コピー
              </button>
            </div>
            <textarea
              value={instagramBody}
              onChange={e => setInstagramBody(e.target.value)}
              rows={8}
              className="w-full border border-gray-100 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-[#1A2F6E] mb-2"
            />
            <div className="border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500">ハッシュタグ（{instagramTags.length}個）</div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(instagramTags.map(t => `#${t}`).join(' ')).then(ok => alert(ok ? 'コピーしました' : 'コピーに失敗しました'))}
                  className="text-xs text-[#1A2F6E] hover:underline"
                >
                  タグのみコピー
                </button>
              </div>
              <div className="text-xs text-blue-600 leading-relaxed break-words">
                {instagramTags.map(t => `#${t}`).join(' ') || '—'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 再生成 */}
      {hasGenerated && (
        <section className="mb-6">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={aiLoading}
            className="w-full border border-[#1A2F6E] text-[#1A2F6E] py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-50 transition-colors"
          >
            {aiLoading ? '生成中...' : '🔄 もう一度生成'}
          </button>
        </section>
      )}

      {/* 実行チェック */}
      {hasGenerated && (
        <section className="mb-4 space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-1">実行する内容</div>
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={postToTenTalk}
              onChange={e => setPostToTenTalk(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#1A2F6E]"
            />
            <div>
              <div className="text-sm font-medium">💬 テントークに投稿する</div>
              <div className="text-xs text-gray-400">テント屋仲間のタイムラインに表示されます</div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={copyInstagramBody}
              onChange={e => setCopyInstagramBody(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#1A2F6E]"
            />
            <div>
              <div className="text-sm font-medium">📸 Instagram文章をコピー</div>
              <div className="text-xs text-gray-400">本文＋ハッシュタグをクリップボードにコピー</div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={copyHashtagsOnly}
              onChange={e => setCopyHashtagsOnly(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#1A2F6E]"
            />
            <div>
              <div className="text-sm font-medium">🏷 ハッシュタグだけコピー</div>
              <div className="text-xs text-gray-400">ハッシュタグ部分のみをクリップボードにコピー</div>
            </div>
          </label>
          {copyInstagramBody && copyHashtagsOnly && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ※ クリップボードは1つのみ保持できます。両方チェックした場合、最後に実行された方が残ります。
            </div>
          )}
        </section>
      )}

      {/* 実行ボタン */}
      <button
        type="button"
        onClick={handleExecute}
        disabled={!canExecute || submitting}
        className="w-full bg-[#1A2F6E] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#152560] transition-colors"
      >
        {submitting ? '実行中...' : '実行'}
      </button>
    </div>
  )
}
