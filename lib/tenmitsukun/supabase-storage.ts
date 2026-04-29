import { createClient } from '@/lib/supabase/client'
import type { Master, SavedCase } from '@/types/tenmitsukun'
import { DEFAULT_MASTER } from './defaults'

// ── localStorage キー（キャッシュ用）──
const LS_MASTER = 'taq_m3'
const LS_CASES  = 'taq_c3'

// ─────────────────────────────────────────
// localStorage（ローカルキャッシュ・移行元）
// ─────────────────────────────────────────
export function loadMasterLocal(): Master {
  try {
    const raw = localStorage.getItem(LS_MASTER)
    if (!raw) return structuredClone(DEFAULT_MASTER)
    return { ...structuredClone(DEFAULT_MASTER), ...JSON.parse(raw) }
  } catch {
    return structuredClone(DEFAULT_MASTER)
  }
}

export function loadCasesLocal(): SavedCase[] {
  try {
    const raw = localStorage.getItem(LS_CASES)
    if (!raw) return []
    // 旧形式（id: number）を string に変換して返す
    const parsed: Array<SavedCase & { id: number | string }> = JSON.parse(raw)
    return parsed.map(c => ({ ...c, id: String(c.id) }))
  } catch {
    return []
  }
}

function saveMasterLocal(master: Master) {
  try { localStorage.setItem(LS_MASTER, JSON.stringify(master)) } catch { /* quota */ }
}

// ─────────────────────────────────────────
// Supabase：マスタ
// ─────────────────────────────────────────
export async function loadMaster(userId: string): Promise<Master> {
  const supabase = createClient()
  const { data } = await supabase
    .from('tenmitsu_master')
    .select('data')
    .eq('user_id', userId)
    .single()

  if (data?.data) {
    const master = { ...structuredClone(DEFAULT_MASTER), ...data.data } as Master
    saveMasterLocal(master) // キャッシュ更新
    return master
  }

  // Supabaseに未保存 → localStorageから移行
  const localMaster = loadMasterLocal()
  await saveMaster(userId, localMaster) // Supabaseへ移行
  return localMaster
}

export async function saveMaster(userId: string, master: Master): Promise<void> {
  const supabase = createClient()
  await supabase.from('tenmitsu_master').upsert({
    user_id: userId,
    data: master,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  saveMasterLocal(master) // キャッシュ更新
}

// ─────────────────────────────────────────
// Supabase：案件
// ─────────────────────────────────────────
export async function loadCases(userId: string): Promise<SavedCase[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('tenmitsu_cases')
    .select('id, data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (data && data.length > 0) {
    return data.map(row => ({ ...(row.data as SavedCase), id: row.id as string }))
  }

  // Supabaseに未保存 → localStorageから移行
  const localCases = loadCasesLocal()
  if (localCases.length > 0) {
    await migrateCasesToSupabase(userId, localCases)
    // 移行後に再取得
    const { data: migrated } = await supabase
      .from('tenmitsu_cases')
      .select('id, data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return (migrated ?? []).map(row => ({ ...(row.data as SavedCase), id: row.id as string }))
  }

  return []
}

async function migrateCasesToSupabase(userId: string, cases: SavedCase[]): Promise<void> {
  const supabase = createClient()
  // 古い順に挿入して created_at を自然な順序に
  for (const c of [...cases].reverse()) {
    await supabase.from('tenmitsu_cases').insert({
      user_id: userId,
      name: c.name,
      client: c.client ?? '',
      data: c,
    })
  }
}

export async function insertCase(userId: string, c: Omit<SavedCase, 'id'>): Promise<SavedCase> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tenmitsu_cases')
    .insert({ user_id: userId, name: c.name, client: c.client ?? '', data: c })
    .select('id')
    .single()
  if (error) throw error
  return { ...c, id: data.id as string }
}

export async function updateCase(userId: string, c: SavedCase): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('tenmitsu_cases')
    .update({ name: c.name, client: c.client ?? '', data: c, updated_at: new Date().toISOString() })
    .eq('id', c.id)
    .eq('user_id', userId)
}

export async function deleteCase(userId: string, id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('tenmitsu_cases').delete().eq('id', id).eq('user_id', userId)
}
