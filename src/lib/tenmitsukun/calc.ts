import type { TankaRange, UnitType } from '@/types/tenmitsukun'

export interface CalcDimsResult {
  nagare: number
  tachi: number
  mHaba: number
  omote: number
  tsumaOne: number
  tsumaY: number
  totalY: number
  menseki: number
}

export function calcDims(
  maguchi: number,
  debaba: number,
  okutaka: number,
  maetaka: number,
  tsumaC: number,
  habaM: number,
): CalcDimsResult {
  const nagare = Math.sqrt(debaba * debaba + (okutaka - maetaka) * (okutaka - maetaka))
  const tachi = nagare + maetaka
  const mHaba = Math.ceil(maguchi / habaM)
  const omote = tachi * mHaba
  const kodo = debaba > 0 ? (okutaka - maetaka) / debaba : 0
  const n = Math.ceil(debaba / habaM)
  let tsumaOne = 0
  for (let i = 0; i < n; i++) {
    const ex = Math.min((i + 1) * habaM, debaba)
    tsumaOne += maetaka + ex * kodo
  }
  const tsumaY = tsumaOne * tsumaC
  const mensekiOmote = nagare * maguchi
  const mensekiMae = maetaka * maguchi
  const mensekiTsumaOne = ((maetaka + okutaka) / 2) * debaba
  const mensekiTsuma = mensekiTsumaOne * tsumaC
  const menseki = mensekiOmote + mensekiMae + mensekiTsuma
  return { nagare, tachi, mHaba, omote, tsumaOne, tsumaY, totalY: omote + tsumaY, menseki }
}

export function getRangeTanka(ranges: TankaRange[], val: number): number {
  if (!ranges?.length) return 0
  for (const r of ranges) {
    if (val >= r.from && val < r.to) return r.tanka
  }
  return ranges[ranges.length - 1].tanka
}

// 10の位を四捨五入して100円単位に丸める（例：4783 → 4800、5447 → 5400）
const round100 = (n: number) => Math.round(n / 100) * 100

export function getAutoVal(
  item: { unit: UnitType; ranges: TankaRange[] },
  dims: { totalY: number; menseki: number; kojihi: number; maguchi: number; debaba: number },
): number {
  const { totalY, menseki, kojihi, maguchi, debaba } = dims
  if (item.unit === 'yojaku') return round100(totalY * getRangeTanka(item.ranges, totalY))
  if (item.unit === 'menseki') return round100(menseki * getRangeTanka(item.ranges, menseki))
  if (item.unit === 'maguchi') return round100(maguchi * getRangeTanka(item.ranges, maguchi))
  if (item.unit === 'debaba') return round100(debaba * getRangeTanka(item.ranges, debaba))
  if (item.unit === 'ninku') return round100(kojihi)
  if (item.unit === 'shiki') return round100(getRangeTanka(item.ranges, 0))
  return 0
}

export function getShokehi(distKm: number, dist: number[], distTh: number[]): number {
  if (distKm < distTh[0]) return dist[0]
  if (distKm < distTh[1]) return dist[1]
  if (distKm < distTh[2]) return dist[2]
  return dist[3]
}

export const fmt = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP')
