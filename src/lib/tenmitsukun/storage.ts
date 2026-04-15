import type { Master, SavedCase } from '@/types/tenmitsukun'
import { DEFAULT_MASTER } from './defaults'

const LS_MASTER  = 'taq_m3'
const LS_CASES   = 'taq_c3'

export function loadMaster(): Master {
  try {
    const raw = localStorage.getItem(LS_MASTER)
    if (!raw) return structuredClone(DEFAULT_MASTER)
    const saved = JSON.parse(raw)
    return { ...structuredClone(DEFAULT_MASTER), ...saved }
  } catch {
    return structuredClone(DEFAULT_MASTER)
  }
}

export function loadCases(): SavedCase[] {
  try {
    const raw = localStorage.getItem(LS_CASES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMaster(master: Master): void {
  localStorage.setItem(LS_MASTER, JSON.stringify(master))
}

export function saveCases(cases: SavedCase[]): void {
  localStorage.setItem(LS_CASES, JSON.stringify(cases))
}
