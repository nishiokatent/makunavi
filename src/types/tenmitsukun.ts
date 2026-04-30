export type UnitType = 'yojaku' | 'menseki' | 'maguchi' | 'debaba' | 'shiki' | 'ninku'

export interface TankaRange {
  from: number
  to: number
  tanka: number
}

export interface Fabric {
  id: number
  name: string
  haba: number   // mm
  siire: number  // 円/m
  kake: number   // %
}

export interface EstItemMaster {
  id: string
  name: string
  unit: UnitType
  ranges: TankaRange[]
  template: boolean
}

export interface SampleItem {
  masterId: string
  name: string
  unit: UnitType
  value: number
  tanka: number
}

export interface Sample {
  id: string
  name: string
  shokei: number
  date: string
  totalY: number
  menseki: number
  maguchi: number   // meters
  debaba: number    // meters
  okutaka: number   // meters
  maetaka: number   // meters
  tsumaC: number
  kojihi: number
  genka: number
  fabricId: number
  fabricName: string
  workers: number
  wtime: number
  items: SampleItem[]
}

export interface Client {
  id: string
  name: string
  furigana: string
}

export interface Master {
  companyName: string
  company: string
  ninku: number
  dist: [number, number, number, number]
  distTh: [number, number, number]
  fabrics: Fabric[]
  estItems: EstItemMaster[]
  nextFabricId: number
  nextItemId: number
  recentAddr: string[]
  samples: Sample[]
  clients: Client[]
  nextClientId: number
}

export interface ActiveEstItem {
  uid: number
  masterId: string
  name: string
  unit: UnitType
  ranges: TankaRange[]
  value: number
  edited: boolean
}

export interface CalcResult {
  nagare: number
  tachi: number
  mHaba: number
  omote: number
  tsumaY: number
  totalY: number
  menseki: number
  kojihi: number
  maguchi: number
  debaba: number
  okutaka: number
  maetaka: number
  tsumaC: number
  fabricId: number
  fabricName: string
  workers: number
  wtime: number
  genka: number
}

export interface SavedCase {
  id: string
  name: string
  client: string
  shokei: number
  rieki: number
  date: string
  address: string
  distKm: number | null
  estItems: { name: string; value: number }[]
  nagare: number
  totalY: number
  menseki: number
  maguchi: number
  debaba: number
  okutaka: number
  maetaka: number
  tsumaC: number
  fabricId: number
  fabricName: string
  workers: number
  wtime: number
  genka: number
}
