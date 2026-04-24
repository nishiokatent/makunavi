'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadMaster } from '@/lib/tenmitsukun/supabase-storage'
import type { Fabric } from '@/types/tenmitsukun'

interface FabricPickerProps {
  selected: Fabric | null
  onSelect: (fabric: Fabric | null) => void
  colorNote: string
  onChangeColorNote: (value: string) => void
  freeInput: string
  onChangeFreeInput: (value: string) => void
}

export function FabricPicker({
  selected,
  onSelect,
  colorNote,
  onChangeColorNote,
  freeInput,
  onChangeFreeInput,
}: FabricPickerProps) {
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      loadMaster(user.id)
        .then(master => setFabrics(master.fabrics))
        .finally(() => setLoading(false))
    })
  }, [])

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return fabrics.slice(0, 8)
    return fabrics
      .filter(f => f.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [fabrics, query])

  const handlePick = (f: Fabric) => {
    onSelect(f)
    setQuery('')
    setFocused(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">使用生地・素材</label>

      {selected ? (
        <div className="flex items-center gap-2 border border-[#1A2F6E] bg-blue-50 rounded-xl px-3 py-2">
          <span className="text-sm font-medium text-[#1A2F6E] flex-1">{selected.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 text-sm"
            aria-label="生地選択を解除"
          >×</button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(true) }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={loading ? '生地マスタ読み込み中...' : '生地を検索（てんみつ君の生地マスタから）'}
            disabled={loading}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A2F6E] disabled:bg-gray-50"
          />
          {focused && candidates.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {candidates.map(f => (
                <li key={f.id}>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handlePick(f)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {focused && query.trim() && candidates.length === 0 && !loading && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs text-gray-400">
              該当する生地がありません。下の自由入力欄をご利用ください。
            </div>
          )}
        </div>
      )}

      {selected && (
        <input
          type="text"
          value={colorNote}
          onChange={e => onChangeColorNote(e.target.value)}
          placeholder="色・備考（例：ホワイト、ふちどりあり）"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A2F6E]"
        />
      )}

      {!selected && (
        <div>
          <div className="text-xs text-gray-400 mb-1">マスタにない生地は直接入力</div>
          <input
            type="text"
            value={freeInput}
            onChange={e => onChangeFreeInput(e.target.value)}
            placeholder="自由入力（例：帝人シャガール ホワイト）"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A2F6E]"
          />
        </div>
      )}
    </div>
  )
}
