'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Master, ActiveEstItem, CalcResult, SavedCase, EstItemMaster, TankaRange, Sample, Client } from '@/types/tenmitsukun'
import { calcDims, getAutoVal, getShokehi, fmt } from '@/lib/tenmitsukun/calc'
import { LOCATIONS, PREF_COORDS } from '@/lib/tenmitsukun/locations'
import { SETUP_PRESETS } from '@/lib/tenmitsukun/presets'
import {
  loadMaster, loadCases,
  saveMaster, insertCase, updateCase, deleteCase,
} from '@/lib/tenmitsukun/supabase-storage'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
const UNIT_LABELS: Record<string, string> = {
  yojaku: '要尺', menseki: '面積', maguchi: '間口',
  debaba: '出幅', shiki: '式', ninku: '人工',
}
const UNIT_BADGE: Record<string, string> = {
  yojaku: 'bg-blue-100 text-blue-700', menseki: 'bg-green-100 text-green-700',
  maguchi: 'bg-purple-100 text-purple-700', debaba: 'bg-orange-100 text-orange-700',
  shiki: 'bg-gray-100 text-gray-600', ninku: 'bg-yellow-100 text-yellow-700',
}

// ─────────────────────────────────────────
// City map (city → wards) built from LOCATIONS
// ─────────────────────────────────────────
const CITY_MAP: Record<string, { pref: string; wards: string[] }> = {}
for (const [name, pref] of LOCATIONS) {
  if (name.endsWith('区') && name.includes('市')) {
    const cityEnd = name.indexOf('市') + 1
    const city = name.slice(0, cityEnd)
    const ward = name.slice(cityEnd)
    if (!CITY_MAP[city]) CITY_MAP[city] = { pref, wards: [] }
    CITY_MAP[city].wards.push(ward)
  } else {
    if (!CITY_MAP[name]) CITY_MAP[name] = { pref, wards: [] }
  }
}

type TabId = 'est' | 'cases' | 'master'

// ─────────────────────────────────────────
// Setup wizard answer type
// ─────────────────────────────────────────
interface SetupAnswer {
  name: string
  maguchi: number
  debaba: number
  okutaka: number
  maetaka: number
  tsuma: number
  fabricId: number
  items: Record<string, number>
  workers: number
  wtime: number
}

// ─────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────
function haversine(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371
  const dL = (la2 - la1) * Math.PI / 180
  const dO = (lo2 - lo1) * Math.PI / 180
  const a = Math.sin(dL / 2) ** 2 + Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dO / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function extractPref(s: string): string | null {
  return Object.keys(PREF_COORDS).find(p => s.startsWith(p)) ?? null
}

function generateRangesFromSamples(samples: Sample[], estItems: EstItemMaster[]): EstItemMaster[] {
  if (samples.length < 3) return estItems
  const itemData: Record<string, { base: number; tanka: number }[]> = {}
  samples.forEach(s => {
    (s.items ?? []).forEach(item => {
      if (!item.value || !item.masterId) return
      if (!itemData[item.masterId]) itemData[item.masterId] = []
      const base =
        item.unit === 'yojaku'  ? s.totalY  :
        item.unit === 'menseki' ? s.menseki :
        item.unit === 'maguchi' ? s.maguchi :
        item.unit === 'debaba'  ? s.debaba  : 0
      if (base > 0) itemData[item.masterId].push({ base, tanka: item.tanka })
    })
  })
  return estItems.map(mi => {
    const data = itemData[mi.id]
    if (!data?.length || !['yojaku', 'menseki', 'maguchi', 'debaba'].includes(mi.unit)) return mi
    data.sort((a, b) => a.base - b.base)
    const n = data.length
    const avg = (arr: typeof data) => Math.round(arr.reduce((s, d) => s + d.tanka, 0) / arr.length)
    let ranges: TankaRange[]
    if (n === 1) {
      ranges = [{ from: 0, to: 9999, tanka: Math.round(data[0].tanka) }]
    } else if (n === 2) {
      const b = parseFloat(((data[0].base + data[1].base) / 2).toFixed(1))
      const t0 = Math.round(data[0].tanka), t1 = Math.round(data[1].tanka)
      ranges = Math.abs(t0 - t1) / Math.max(t0, t1) > 0.05
        ? [{ from: 0, to: b, tanka: t0 }, { from: b, to: 9999, tanka: t1 }]
        : [{ from: 0, to: 9999, tanka: avg(data) }]
    } else {
      const third = Math.floor(n / 3)
      const small = data.slice(0, third)
      const mid   = data.slice(third, third * 2)
      const large = data.slice(third * 2)
      const b1 = parseFloat(((small[small.length - 1].base + mid[0].base) / 2).toFixed(1))
      const b2 = parseFloat(((mid[mid.length - 1].base + large[0].base) / 2).toFixed(1))
      const t0 = avg(small), t1 = avg(mid), t2 = avg(large)
      const maxT = Math.max(t0, t2)
      const allSame = maxT > 0 && Math.abs(t0 - t2) / maxT < 0.05
      const smSame  = Math.max(t0, t1) > 0 && Math.abs(t0 - t1) / Math.max(t0, t1) < 0.05
      const mlSame  = Math.max(t1, t2) > 0 && Math.abs(t1 - t2) / Math.max(t1, t2) < 0.05
      if (allSame) {
        ranges = [{ from: 0, to: 9999, tanka: avg(data) }]
      } else if (smSame) {
        ranges = [{ from: 0, to: b2, tanka: avg([...small, ...mid]) }, { from: b2, to: 9999, tanka: t2 }]
      } else if (mlSame) {
        ranges = [{ from: 0, to: b1, tanka: t0 }, { from: b1, to: 9999, tanka: avg([...mid, ...large]) }]
      } else {
        ranges = [{ from: 0, to: b1, tanka: t0 }, { from: b1, to: b2, tanka: t1 }, { from: b2, to: 9999, tanka: t2 }]
      }
    }
    return { ...mi, ranges }
  })
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────
export default function TenmitsukuPage() {
  const [loaded,    setLoaded]    = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'est'
    const t = new URLSearchParams(window.location.search).get('tab')
    return t === 'master' || t === 'cases' ? t : 'est'
  })
  const [master,    setMaster]    = useState<Master | null>(null)
  const [cases,     setCases]     = useState<SavedCase[]>([])
  const [toast,     setToast]     = useState<string | null>(null)
  const [myUserId,  setMyUserId]  = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)

  // Est form
  const [caseName,  setCaseName]  = useState('')
  const [client,    setClient]    = useState('')
  const [address,   setAddress]   = useState('')
  const [distKm,    setDistKm]    = useState<number | null>(null)
  const [maguchi,   setMaguchi]   = useState('')
  const [debaba,    setDebaba]    = useState('')
  const [okutaka,   setOkutaka]   = useState('')
  const [maetaka,   setMaetaka]   = useState('')
  const [tsumaC,    setTsumaC]    = useState(0)
  const [fabricId,  setFabricId]  = useState<number>(1)
  const [workers,   setWorkers]   = useState('2')
  const [worktime,  setWorktime]  = useState('1')
  const [items,     setItems]     = useState<ActiveEstItem[]>([])
  const [lastCalc,  setLastCalc]  = useState<CalcResult | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Setup wizard
  const [showSetup,     setShowSetup]     = useState(false)
  const [editingSample, setEditingSample] = useState<Sample | null>(null)

  // Case modal
  const [modalCase, setModalCase] = useState<SavedCase | null>(null)

  // Init
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyUserId(user.id)
      const [m, c] = await Promise.all([loadMaster(user.id), loadCases(user.id)])
      setMaster(m)
      setCases(c)
      setFabricId(m.fabrics[0]?.id ?? 1)
      initItems(m)
      setLoaded(true)
    }
    init()
  }, [])

  function initItems(m: Master) {
    setItems(m.estItems.filter(ei => ei.template).map(ei => ({
      uid: Date.now() + Math.random(),
      masterId: ei.id, name: ei.name, unit: ei.unit,
      ranges: ei.ranges, value: 0, edited: false,
    } as ActiveEstItem)))
  }

  // Save master on change (fire-and-forget)
  useEffect(() => {
    if (!master || !myUserId || !loaded) return
    saveMaster(myUserId, master)
  }, [master, myUserId, loaded])

  // Recalculate dims / item values when inputs change
  useEffect(() => {
    if (!master) return
    const f = master.fabrics.find(f => f.id === fabricId) ?? master.fabrics[0]
    if (!f) return
    const habaM = f.haba / 1000
    const mg = (parseFloat(maguchi) || 0) / 1000
    const db = (parseFloat(debaba)  || 0) / 1000
    const ok = (parseFloat(okutaka) || 0) / 1000
    const mt = (parseFloat(maetaka) || 0) / 1000
    const w  = parseFloat(workers)  || 0
    const wt = parseFloat(worktime) || 0
    if (mg <= 0) { setLastCalc(null); return }

    const dims   = calcDims(mg, db, ok, mt, tsumaC, habaM)
    const kojihi = w * wt * master.ninku
    const genka  = f.siire * dims.totalY
    const result: CalcResult = {
      ...dims, kojihi, genka,
      maguchi: mg, debaba: db, okutaka: ok, maetaka: mt, tsumaC,
      fabricId: f.id, fabricName: f.name, workers: w, wtime: wt,
    }
    setLastCalc(result)

    setItems(prev => prev.map(item => {
      if (item.edited) return item
      const m2 = master.estItems.find(ei => ei.id === item.masterId) ?? item
      return { ...item, value: getAutoVal({ ...m2, ranges: item.ranges }, { ...dims, kojihi, maguchi: mg, debaba: db }) }
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maguchi, debaba, okutaka, maetaka, tsumaC, fabricId, workers, worktime, master])

  // Auto-update 式 items when distance changes
  useEffect(() => {
    if (distKm === null || !master) return
    const fee = getShokehi(distKm, master.dist, master.distTh)
    setItems(prev => prev.map(item =>
      item.unit === 'shiki' && !item.edited ? { ...item, value: fee } : item
    ))
  }, [distKm, master])

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2500)
  }, [])

  const shokei = items.reduce((s, i) => s + (i.value || 0), 0)
  const tax    = shokei * 0.1
  const total  = shokei + tax
  const genka  = lastCalc?.genka ?? 0
  const rieki  = shokei > 0 ? (shokei - genka) / shokei * 100 : 0
  const rColor = rieki >= 40 ? '#4ade80' : rieki >= 25 ? '#facc15' : '#f87171'

  function resetEst() {
    setCaseName(''); setClient(''); setAddress(''); setDistKm(null)
    setMaguchi(''); setDebaba(''); setOkutaka(''); setMaetaka('')
    setTsumaC(0); setWorkers('2'); setWorktime('1')
    setLastCalc(null); setEditingId(null)
    if (!master) return
    setFabricId(master.fabrics[0]?.id ?? 1)
    initItems(master)
  }

  const saveCase = async () => {
    if (!lastCalc) { showToast('先に寸法を入力してください'); return }
    if (!myUserId) { showToast('ログインが必要です'); return }
    setSaving(true)
    const name = caseName || '無題案件'
    const rk   = shokei > 0 ? (shokei - lastCalc.genka) / shokei * 100 : 0
    const caseData = {
      name, client: client || '', shokei, rieki: rk,
      date: new Date().toLocaleDateString('ja-JP'),
      address, distKm,
      estItems: items.map(i => ({ name: i.name, value: i.value || 0 })),
      ...lastCalc,
    }
    if (master) {
      let nextMaster = master
      if (address) {
        const recent = [address, ...(nextMaster.recentAddr ?? []).filter(a => a !== address)].slice(0, 8)
        nextMaster = { ...nextMaster, recentAddr: recent }
      }
      const clientName = (client || '').trim()
      if (clientName) {
        const list = nextMaster.clients ?? []
        const exists = list.some(c => c.name === clientName)
        if (!exists) {
          const nextId = nextMaster.nextClientId ?? (list.length + 1)
          const newClient: Client = { id: 'cl' + nextId, name: clientName, furigana: '' }
          nextMaster = { ...nextMaster, clients: [...list, newClient], nextClientId: nextId + 1 }
        }
      }
      if (nextMaster !== master) setMaster(nextMaster)
    }
    try {
      if (editingId != null) {
        const updated: SavedCase = { ...caseData, id: editingId }
        await updateCase(myUserId, updated)
        setCases(prev => prev.map(c => c.id === editingId ? updated : c))
        showToast(`「${name}」を更新しました`)
        setEditingId(null)
      } else {
        const saved = await insertCase(myUserId, caseData)
        setCases(prev => [saved, ...prev])
        showToast(`「${name}」を保存しました`)
      }
    } catch (e) {
      showToast('保存に失敗しました: ' + (e instanceof Error ? e.message : ''))
    } finally {
      setSaving(false)
    }
  }

  if (!loaded || !master) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        読み込み中...
      </div>
    )
  }

  const hasNoSamples = (master.samples ?? []).length === 0

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-4 max-w-3xl mx-auto">
          <span className="text-2xl">📋</span>
          <div>
            <h1 className="text-lg font-bold text-gray-800">てんみつ君</h1>
            <p className="text-xs text-gray-500">テント見積もり自動計算</p>
          </div>
          {hasNoSamples && (
            <button
              onClick={() => setShowSetup(true)}
              className="ml-auto text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              ✨ 初回単価設定
            </button>
          )}
        </div>
        <div className="flex gap-0 max-w-3xl mx-auto">
          {([
            { id: 'est',    label: '見積作成' },
            { id: 'cases',  label: '案件一覧' },
            { id: 'master', label: 'マスタ' },
          ] as { id: TabId; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1A2F6E] text-[#1A2F6E]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'cases' && cases.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{cases.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {activeTab === 'est' && (
          <EstTab
            master={master}
            fabricId={fabricId} setFabricId={setFabricId}
            caseName={caseName} setCaseName={setCaseName}
            client={client}     setClient={setClient}
            address={address}   setAddress={setAddress}
            distKm={distKm}     setDistKm={setDistKm}
            maguchi={maguchi}   setMaguchi={setMaguchi}
            debaba={debaba}     setDebaba={setDebaba}
            okutaka={okutaka}   setOkutaka={setOkutaka}
            maetaka={maetaka}   setMaetaka={setMaetaka}
            tsumaC={tsumaC}     setTsumaC={setTsumaC}
            workers={workers}   setWorkers={setWorkers}
            worktime={worktime} setWorktime={setWorktime}
            items={items}       setItems={setItems}
            lastCalc={lastCalc}
            editingId={editingId}
            saving={saving}
            onSave={saveCase}
            onReset={resetEst}
            onCancelEdit={() => { setEditingId(null); resetEst() }}
          />
        )}
        {activeTab === 'cases' && (
          <CasesTab
            cases={cases}
            onOpen={setModalCase}
            onDelete={async (id) => {
              if (!myUserId) return
              await deleteCase(myUserId, id)
              setCases(prev => prev.filter(c => c.id !== id))
            }}
          />
        )}
        {activeTab === 'master' && (
          <MasterTab
            master={master}
            onChange={m => setMaster(m)}
            onStartSetup={() => { setEditingSample(null); setShowSetup(true) }}
            onEditSample={s => { setEditingSample(s); setShowSetup(true) }}
          />
        )}
      </div>

      {/* Floating bottom bar */}
      {activeTab === 'est' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A2F6E] text-white z-50 shadow-2xl">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-blue-200">小計 <span className="font-mono text-white font-bold">{fmt(shokei)}</span></span>
                <span className="text-blue-200">消費税 <span className="font-mono text-white">{fmt(tax)}</span></span>
                <span className="text-blue-200">原価 <span className="font-mono text-white">{fmt(genka)}</span></span>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-200">合計（税込）</div>
                <div className="text-xl font-bold font-mono">{fmt(total)}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 bg-[#0f1e4a] rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, rieki))}%`, background: rColor }} />
              </div>
              <span className="text-xs font-bold font-mono" style={{ color: rColor }}>利益率 {rieki.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Setup wizard */}
      {showSetup && (
        <SetupWizard
          master={master}
          editingSample={editingSample}
          onClose={() => { setShowSetup(false); setEditingSample(null) }}
          onFinish={(newSamples, updatedItems) => {
            setMaster(prev => prev ? { ...prev, samples: newSamples, estItems: updatedItems } : prev)
            setShowSetup(false); setEditingSample(null)
            showToast(newSamples.length >= 3
              ? `✨ ${newSamples.length}件のサンプルから単価を自動設定しました`
              : `${newSamples.length}件のサンプルを保存しました（3件以上で単価自動設定）`)
          }}
        />
      )}

      {/* Case detail modal */}
      {modalCase && (
        <CaseModal
          c={modalCase}
          onClose={() => setModalCase(null)}
          onDelete={async () => {
            if (myUserId) await deleteCase(myUserId, modalCase.id)
            setCases(prev => prev.filter(c => c.id !== modalCase.id))
            setModalCase(null)
          }}
          onEdit={() => {
            setCaseName(modalCase.name); setClient(modalCase.client)
            setAddress(modalCase.address ?? ''); setDistKm(modalCase.distKm ?? null)
            setMaguchi(String(Math.round(modalCase.maguchi * 1000)))
            setDebaba(String(Math.round(modalCase.debaba * 1000)))
            setOkutaka(String(Math.round(modalCase.okutaka * 1000)))
            setMaetaka(String(Math.round(modalCase.maetaka * 1000)))
            setTsumaC(modalCase.tsumaC)
            setWorkers(String(modalCase.workers)); setWorktime(String(modalCase.wtime))
            if (master) {
              const f = master.fabrics.find(f => f.id === modalCase.fabricId)
              if (f) setFabricId(f.id)
            }
            setItems(modalCase.estItems.map((ei, idx) => {
              const m2 = master?.estItems.find(i => i.name === ei.name)
              return {
                uid: Date.now() + idx, masterId: m2?.id ?? '_', name: ei.name,
                unit: m2?.unit ?? 'shiki', ranges: m2?.ranges ?? [{ from: 0, to: 9999, tanka: 0 }],
                value: ei.value, edited: true,
              }
            }))
            setEditingId(modalCase.id); setActiveTab('est'); setModalCase(null)
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-5 py-2.5 rounded-full z-[999] pointer-events-none border border-gray-700 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// AddressInput — hierarchical city → ward selection
// ─────────────────────────────────────────
interface AddressInputProps {
  address: string
  setAddress: (v: string) => void
  distKm: number | null
  setDistKm: (v: number | null) => void
  master: Master
}

function AddressInput({ address, setAddress, distKm, setDistKm, master }: AddressInputProps) {
  const [cityInput,    setCityInput]    = useState('')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedPref, setSelectedPref] = useState<string | null>(null)
  const [selectedWard, setSelectedWard] = useState<string | null>(null)
  const [streetInput,  setStreetInput]  = useState('')
  const [showSugg,     setShowSugg]     = useState(false)
  const [calcingDist,  setCalcingDist]  = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Sync from parent address string (e.g. when loading edit)
  useEffect(() => {
    if (!address) {
      setCityInput(''); setSelectedCity(null); setSelectedWard(null); setStreetInput('')
      return
    }
    // Try to parse address into city/ward/street
    for (const [city, { pref, wards }] of Object.entries(CITY_MAP)) {
      if (address.startsWith(city)) {
        const rest = address.slice(city.length)
        const matchedWard = wards.find(w => rest.startsWith(w))
        setCityInput(city); setSelectedCity(city); setSelectedPref(pref)
        if (matchedWard) {
          setSelectedWard(matchedWard)
          setStreetInput(rest.slice(matchedWard.length))
        } else {
          setSelectedWard(null); setStreetInput(rest)
        }
        return
      }
    }
    // Fallback: just show as raw cityInput
    setCityInput(address)
  }, []) // Only run on mount to not conflict with user input
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Build full address and notify parent
  function buildAndSet(city: string | null, ward: string | null, street: string) {
    const parts = [city, ward, street].filter(Boolean)
    const full = parts.join('')
    setAddress(full)
    setDistKm(null)
  }

  // City suggestions filtered from CITY_MAP
  const citySuggs = useMemo(() => {
    const q = cityInput.trim()
    if (q.length < 1) return []
    return Object.entries(CITY_MAP)
      .filter(([city]) => city.includes(q))
      .slice(0, 10)
  }, [cityInput])

  const wards = selectedCity ? (CITY_MAP[selectedCity]?.wards ?? []) : []

  function handleCityInput(v: string) {
    setCityInput(v)
    setSelectedCity(null); setSelectedWard(null); setStreetInput('')
    setShowSugg(true)
    setAddress(v); setDistKm(null)
  }

  function selectCity(city: string, pref: string) {
    setCityInput(city); setSelectedCity(city); setSelectedPref(pref)
    setSelectedWard(null); setStreetInput('')
    setShowSugg(false)
    const noWards = (CITY_MAP[city]?.wards ?? []).length === 0
    if (noWards) buildAndSet(city, null, '')
  }

  function selectWard(w: string) {
    setSelectedWard(w)
    buildAndSet(selectedCity, w, streetInput)
  }

  function handleStreetInput(v: string) {
    setStreetInput(v)
    buildAndSet(selectedCity, selectedWard, v)
  }

  function selectChip(addr: string) {
    // Parse chip into components
    for (const [city, { pref, wards: ws }] of Object.entries(CITY_MAP)) {
      if (addr.startsWith(city)) {
        const rest = addr.slice(city.length)
        const matchedWard = ws.find(w => rest.startsWith(w))
        setCityInput(city); setSelectedCity(city); setSelectedPref(pref)
        if (matchedWard) {
          setSelectedWard(matchedWard); setStreetInput(rest.slice(matchedWard.length))
        } else {
          setSelectedWard(null); setStreetInput(rest)
        }
        setAddress(addr); setDistKm(null); setShowSugg(false)
        return
      }
    }
    setCityInput(addr); setSelectedCity(null); setSelectedWard(null); setStreetInput('')
    setAddress(addr); setDistKm(null); setShowSugg(false)
  }

  function resetAddr() {
    setCityInput(''); setSelectedCity(null); setSelectedPref(null)
    setSelectedWard(null); setStreetInput('')
    setAddress(''); setDistKm(null)
  }

  async function calcDistance() {
    if (!address.trim() || !master.company) return
    setCalcingDist(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(master.company)}&format=json&limit=1&countrycodes=jp`).then(r => r.json()),
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=jp`).then(r => r.json()),
      ])
      if (r1.length && r2.length) {
        setDistKm(haversine(+r1[0].lat, +r1[0].lon, +r2[0].lat, +r2[0].lon))
      } else throw new Error()
    } catch {
      const fromPref = extractPref(master.company)
      const toPref   = selectedPref ?? extractPref(address)
      if (fromPref && toPref && PREF_COORDS[fromPref] && PREF_COORDS[toPref]) {
        const [la1, lo1] = PREF_COORDS[fromPref]
        const [la2, lo2] = PREF_COORDS[toPref]
        setDistKm(haversine(la1, lo1, la2, lo2))
      }
    } finally {
      setCalcingDist(false)
    }
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSugg(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fee = distKm !== null ? getShokehi(distKm, master.dist, master.distTh) : null
  const inputBase = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30 bg-gray-50'

  return (
    <div className="space-y-2">
      {/* Recent address chips */}
      {(master.recentAddr ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-gray-400 self-center">最近使った住所：</span>
          {master.recentAddr.slice(0, 6).map(addr => (
            <button
              key={addr}
              onClick={() => selectChip(addr)}
              className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {addr}
            </button>
          ))}
        </div>
      )}

      {/* City input with dropdown */}
      <div className="relative" ref={wrapRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className={inputBase}
              placeholder="市・区・町を入力（例：大阪市）"
              value={cityInput}
              onChange={e => handleCityInput(e.target.value)}
              onFocus={() => { if (citySuggs.length > 0) setShowSugg(true) }}
            />
            {cityInput && (
              <button
                onClick={resetAddr}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-base leading-none"
              >×</button>
            )}
          </div>
          <button
            onClick={calcDistance}
            disabled={!address.trim() || !master.company || calcingDist}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:border-[#1A2F6E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {calcingDist ? '計算中…' : '距離計算'}
          </button>
        </div>

        {/* City suggestions dropdown */}
        {showSugg && citySuggs.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden max-h-52 overflow-y-auto">
            {citySuggs.map(([city, { pref, wards: ws }]) => (
              <button
                key={city}
                onMouseDown={() => selectCity(city, pref)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-800 font-medium">{city}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {ws.length > 0 && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{ws.length}区</span>}
                  <span>{pref}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ward chips — shown when city with wards is selected */}
      {selectedCity && wards.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 mb-1.5">区を選択</div>
          <div className="flex flex-wrap gap-1.5">
            {wards.map(w => (
              <button
                key={w}
                onClick={() => selectWard(w)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedWard === w
                    ? 'bg-[#1A2F6E] text-white border-[#1A2F6E]'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1A2F6E] hover:text-[#1A2F6E]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Street input — shown after ward selected or city with no wards */}
      {selectedCity && (wards.length === 0 || selectedWard) && (
        <input
          className={inputBase + ' text-sm'}
          placeholder="番地・建物名など（任意）"
          value={streetInput}
          onChange={e => handleStreetInput(e.target.value)}
        />
      )}

      {/* Distance result */}
      {distKm !== null && fee !== null && (
        <div className="text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-green-700">
          📍 {distKm.toFixed(1)}km → 諸経費の目安 {fmt(fee)}（式項目に自動適用）
        </div>
      )}
      {!master.company && address && (
        <p className="text-xs text-amber-600">※ 距離計算にはマスタで「会社所在地」を設定してください</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// YojakuBox — 要尺・面積 自動計算表示
// ─────────────────────────────────────────
function YojakuBox({ calc, tsumaC }: { calc: CalcResult; tsumaC: number }) {
  const perTsuma = tsumaC > 0 ? calc.tsumaY / tsumaC : 0
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
      <div className="text-[11px] font-bold text-green-700 tracking-wider mb-3">要尺・面積（自動計算）</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {/* 主（間口）要尺 */}
        <div>
          <div className="text-[10px] text-green-600 mb-1 leading-tight">主（間口）要尺</div>
          <div className="text-xl font-bold font-mono text-green-800 leading-none">{calc.omote.toFixed(2)}<span className="text-sm font-medium"> m</span></div>
          <div className="text-[9px] text-green-500 mt-1.5 leading-tight">裁ち寸 {calc.tachi.toFixed(2)}m × {calc.mHaba}巾</div>
        </div>
        {/* 妻要尺 */}
        <div>
          <div className="text-[10px] text-green-600 mb-1 leading-tight">妻要尺</div>
          <div className="text-xl font-bold font-mono text-green-800 leading-none">
            {tsumaC > 0 ? <>{calc.tsumaY.toFixed(2)}<span className="text-sm font-medium"> m</span></> : <span className="text-base text-green-400">—</span>}
          </div>
          {tsumaC > 0 && (
            <div className="text-[9px] text-green-500 mt-1.5 leading-tight">片側 {perTsuma.toFixed(2)}m × {tsumaC}</div>
          )}
        </div>
        {/* 合計要尺 */}
        <div>
          <div className="text-[10px] text-green-600 mb-1 leading-tight">合計要尺</div>
          <div className="text-xl font-bold font-mono text-green-800 leading-none">{calc.totalY.toFixed(2)}<span className="text-sm font-medium"> m</span></div>
          <div className="text-[9px] text-green-500 mt-1.5 leading-tight">主 + 妻</div>
        </div>
        {/* 面積 */}
        <div>
          <div className="text-[10px] text-green-600 mb-1 leading-tight">面積</div>
          <div className="text-xl font-bold font-mono text-green-800 leading-none">{(Math.floor(calc.menseki * 100) / 100).toFixed(2)}<span className="text-sm font-medium"> m²</span></div>
          <div className="text-[9px] text-green-500 mt-1.5 leading-tight">展開面積</div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// MmInput — number input with "mm" suffix badge
// ─────────────────────────────────────────
function MmInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex">
        <input
          type="number"
          className="flex-1 min-w-0 border border-gray-200 border-r-0 rounded-l-lg px-3 py-2 text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30 focus:border-[#1A2F6E]"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <span className="border border-gray-200 rounded-r-lg px-2 py-2 bg-gray-100 text-xs text-gray-400 flex items-center flex-shrink-0">mm</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// ClientPicker — 得意先名のオートコンプリート
// ─────────────────────────────────────────
function sortClientsByFurigana(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => {
    const ka = (a.furigana || a.name || '').trim()
    const kb = (b.furigana || b.name || '').trim()
    if (!ka && kb) return 1
    if (ka && !kb) return -1
    return ka.localeCompare(kb, 'ja')
  })
}

function ClientPicker({ value, onChange, clients, inputCls }: {
  value: string
  onChange: (v: string) => void
  clients: Client[]
  inputCls: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const sorted = sortClientsByFurigana(clients)
  const q = value.trim()
  const filtered = q
    ? sorted.filter(c => c.name.includes(q) || (c.furigana ?? '').includes(q))
    : sorted

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className={inputCls}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="例：山田商店"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(c.name); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-baseline gap-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-gray-800">{c.name}</span>
              {c.furigana && <span className="text-[10px] text-gray-400">{c.furigana}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// EstTab
// ─────────────────────────────────────────
interface EstTabProps {
  master: Master
  fabricId: number; setFabricId: (id: number) => void
  caseName: string; setCaseName: (v: string) => void
  client: string;   setClient: (v: string) => void
  address: string;  setAddress: (v: string) => void
  distKm: number | null; setDistKm: (v: number | null) => void
  maguchi: string;  setMaguchi: (v: string) => void
  debaba: string;   setDebaba: (v: string) => void
  okutaka: string;  setOkutaka: (v: string) => void
  maetaka: string;  setMaetaka: (v: string) => void
  tsumaC: number;   setTsumaC: (v: number) => void
  workers: string;  setWorkers: (v: string) => void
  worktime: string; setWorktime: (v: string) => void
  items: ActiveEstItem[]; setItems: (fn: (prev: ActiveEstItem[]) => ActiveEstItem[]) => void
  lastCalc: CalcResult | null
  editingId: string | null
  saving: boolean
  onSave: () => void; onReset: () => void; onCancelEdit: () => void
}

function EstTab({
  master, fabricId, setFabricId,
  caseName, setCaseName, client, setClient,
  address, setAddress, distKm, setDistKm,
  maguchi, setMaguchi, debaba, setDebaba,
  okutaka, setOkutaka, maetaka, setMaetaka,
  tsumaC, setTsumaC, workers, setWorkers, worktime, setWorktime,
  items, setItems, lastCalc, editingId, saving, onSave, onReset, onCancelEdit,
}: EstTabProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  const kojihi = (parseFloat(workers) || 0) * (parseFloat(worktime) || 0) * master.ninku
  const nagareMm = lastCalc ? Math.round(lastCalc.nagare * 1000) : null

  function addItemFromMaster(masterId: string) {
    const m = master.estItems.find(i => i.id === masterId)
    if (!m) return
    const dims = lastCalc
      ? { totalY: lastCalc.totalY, menseki: lastCalc.menseki, kojihi: lastCalc.kojihi, maguchi: lastCalc.maguchi, debaba: lastCalc.debaba }
      : { totalY: 0, menseki: 0, kojihi: 0, maguchi: 0, debaba: 0 }
    setItems(prev => [...prev, {
      uid: Date.now() + Math.random(),
      masterId: m.id, name: m.name, unit: m.unit,
      ranges: m.ranges, value: lastCalc ? getAutoVal(m, dims) : 0, edited: false,
    }])
    setShowAddMenu(false)
  }

  useEffect(() => {
    if (!showAddMenu) return
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setShowAddMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAddMenu])

  const selCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30'

  return (
    <div className="space-y-4">
      {/* Editing banner */}
      {editingId != null && (
        <div className="bg-amber-400 text-white rounded-lg px-4 py-2.5 flex items-center justify-between text-sm font-semibold">
          <span>✏️ 案件を編集中</span>
          <button onClick={onCancelEdit} className="text-xs bg-black/20 px-3 py-1 rounded">キャンセル</button>
        </div>
      )}

      {/* ① 案件情報 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <CardTitle label="案件情報" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">案件名</label>
            <input className={selCls} value={caseName} onChange={e => setCaseName(e.target.value)} placeholder="例：西岡商店街テント" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">得意先名</label>
            <ClientPicker value={client} onChange={setClient} clients={master.clients ?? []} inputCls={selCls} />
          </div>
        </div>
      </section>

      {/* ② 現場所在地 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <CardTitle label="現場所在地" />
        <div className="mt-3">
          <AddressInput
            address={address} setAddress={setAddress}
            distKm={distKm}   setDistKm={setDistKm}
            master={master}
          />
        </div>
      </section>

      {/* ③ 寸法・生地 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <CardTitle label="寸法・生地" />
        {/* Row 1: 間口, 出幅, 奥高 */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <MmInput label="間口" value={maguchi} onChange={setMaguchi} placeholder="3600" />
          <MmInput label="出幅" value={debaba}  onChange={setDebaba}  placeholder="2400" />
          <MmInput label="奥高" value={okutaka} onChange={setOkutaka} placeholder="2500" />
        </div>
        {/* Row 2: 前高, 妻, 流れ（自動） */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <MmInput label="前高" value={maetaka} onChange={setMaetaka} placeholder="2000" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">妻</label>
            <select className={selCls} value={tsumaC} onChange={e => setTsumaC(parseInt(e.target.value))}>
              <option value={2}>左右あり</option>
              <option value={1}>片側のみ</option>
              <option value={0}>なし</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">流れ（自動）</label>
            <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 h-[38px]">
              {nagareMm != null
                ? <><span className="text-xs text-gray-400 mr-1.5">流れ</span><span className="font-mono text-sky-500 font-semibold text-sm">{nagareMm}</span><span className="text-xs text-gray-400 ml-1">mm</span></>
                : <span className="text-xs text-gray-300">— mm</span>
              }
            </div>
          </div>
        </div>
        {/* 生地 */}
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">生地</label>
          <select className={selCls} value={fabricId} onChange={e => setFabricId(parseInt(e.target.value))}>
            {master.fabrics.map(f => (
              <option key={f.id} value={f.id}>{f.name}（{f.haba / 10}cm巾）</option>
            ))}
          </select>
        </div>
      </section>

      {/* 要尺・面積 — auto shown */}
      {lastCalc && <YojakuBox calc={lastCalc} tsumaC={tsumaC} />}

      {/* ④ 施工 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <CardTitle label="施工" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">人数</label>
            <select className={selCls} value={workers} onChange={e => setWorkers(e.target.value)}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}人</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">日数</label>
            <select className={selCls} value={worktime} onChange={e => setWorktime(e.target.value)}>
              <option value="0.5">半日</option>
              <option value="1">1日</option>
              <option value="2">2日</option>
              <option value="3">3日</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm">
          <span className="text-yellow-700">施工費（人工単価 × 人数 × 日数）</span>
          <span className="font-mono font-bold text-yellow-800">{fmt(kojihi)}</span>
        </div>
      </section>

      {/* ⑤ 見積項目 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <CardTitle label="見積項目" noMargin />
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(v => !v)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-[#1A2F6E] transition-colors"
            >＋ 項目を追加</button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-52 overflow-hidden">
                {master.estItems.map(m => (
                  <button
                    key={m.id}
                    onClick={() => addItemFromMaster(m.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-700">{m.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${UNIT_BADGE[m.unit] ?? 'bg-gray-100 text-gray-500'}`}>
                      {UNIT_LABELS[m.unit]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-center py-8 text-xs text-gray-400">「＋ 項目を追加」から追加してください</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <div key={item.uid} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-700 font-medium">{item.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${UNIT_BADGE[item.unit] ?? 'bg-gray-100 text-gray-500'}`}>
                      {UNIT_LABELS[item.unit]}
                    </span>
                    {item.edited && <span className="text-[10px] text-amber-500">編集済</span>}
                  </div>
                </div>
                <input
                  type="number"
                  value={item.value || 0}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0
                    setItems(prev => prev.map((it, i) => i === idx ? { ...it, value: val, edited: true } : it))
                  }}
                  className="w-28 text-right border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30 bg-gray-50"
                />
                <button
                  onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded transition-colors text-base"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={!lastCalc || saving}
          className="flex-1 py-3 bg-[#1A2F6E] text-white rounded-xl font-bold text-sm hover:bg-[#16295e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '保存中...' : editingId != null ? '✓ 更新して保存' : '💾 案件を保存'}
        </button>
        <button
          onClick={onReset}
          className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-400 transition-colors"
        >リセット</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// CasesTab
// ─────────────────────────────────────────
function CasesTab({ cases, onOpen, onDelete }: {
  cases: SavedCase[]; onOpen: (c: SavedCase) => void; onDelete: (id: string) => void
}) {
  if (cases.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">🗂</div>
        <p className="text-sm">保存済みの案件がありません</p>
        <p className="text-xs mt-1">「見積作成」タブで作成・保存してください</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {cases.map(c => {
        const rColor = c.rieki >= 40 ? '#16a34a' : c.rieki >= 25 ? '#d97706' : '#dc2626'
        return (
          <div
            key={c.id}
            onClick={() => onOpen(c)}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-pointer hover:border-[#1A2F6E] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-800 text-sm truncate">{c.name}</div>
                {c.client && <div className="text-xs text-gray-500 mt-0.5">{c.client}</div>}
                {c.address && <div className="text-xs text-gray-400 mt-0.5">📍 {c.address}{c.distKm != null ? ` (${c.distKm.toFixed(1)}km)` : ''}</div>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-base font-bold font-mono text-[#1A2F6E]">{fmt(c.shokei)}</div>
                <div className="text-xs font-bold" style={{ color: rColor }}>利益率 {c.rieki.toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-400 font-mono">
              {c.fabricName && <span>{c.fabricName}</span>}
              {c.maguchi > 0 && <span>間口 {Math.round(c.maguchi * 1000)}mm</span>}
              {c.debaba > 0  && <span>出幅 {Math.round(c.debaba * 1000)}mm</span>}
              {c.totalY > 0  && <span>要尺 {c.totalY.toFixed(1)}m</span>}
              <span>{c.date}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────
// CaseModal
// ─────────────────────────────────────────
function CaseModal({ c, onClose, onDelete, onEdit }: {
  c: SavedCase; onClose: () => void; onDelete: () => void; onEdit: () => void
}) {
  const tax   = c.shokei * 0.1
  const total = c.shokei + tax
  const rColor = c.rieki >= 40 ? '#16a34a' : c.rieki >= 25 ? '#d97706' : '#dc2626'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">{c.name}</h3>
            {c.client && <p className="text-xs text-gray-500">{c.client}{c.date && ` · ${c.date}`}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-xs text-blue-400 mb-1">合計（税込）</div>
                <div className="text-2xl font-bold font-mono text-[#1A2F6E]">{fmt(total)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-400">利益率</div>
                <div className="text-lg font-bold font-mono" style={{ color: rColor }}>{c.rieki.toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-blue-400">
              <span>小計 <span className="font-mono text-blue-600">{fmt(c.shokei)}</span></span>
              <span>消費税 <span className="font-mono text-blue-600">{fmt(tax)}</span></span>
              <span>原価 <span className="font-mono text-blue-600">{fmt(c.genka ?? 0)}</span></span>
            </div>
          </div>
          {c.address && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <span>📍</span><span>{c.address}</span>
              {c.distKm != null && <span className="text-gray-400">({c.distKm.toFixed(1)}km)</span>}
            </div>
          )}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">寸法・生地</div>
            <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-600">
              {c.fabricName && <span className="font-medium text-gray-800">{c.fabricName}</span>}
              {c.maguchi > 0 && <span>間口 <strong>{Math.round(c.maguchi * 1000)}mm</strong></span>}
              {c.debaba > 0  && <span>出幅 <strong>{Math.round(c.debaba * 1000)}mm</strong></span>}
              {c.okutaka > 0 && <span>奥高 <strong>{Math.round(c.okutaka * 1000)}mm</strong></span>}
              {c.maetaka > 0 && <span>前高 <strong>{Math.round(c.maetaka * 1000)}mm</strong></span>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-500 mt-2">
              {c.totalY > 0  && <span className="text-blue-600 font-bold">要尺 {c.totalY.toFixed(2)}m</span>}
              {c.menseki > 0 && <span>面積 {(Math.floor(c.menseki * 100) / 100).toFixed(2)}m²</span>}
              {c.workers > 0 && <span>施工 {c.workers}人×{c.wtime}日</span>}
            </div>
          </div>
          {c.estItems.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">見積項目</div>
              <div className="space-y-1.5">
                {c.estItems.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{it.name}</span>
                    <span className="font-mono font-medium text-gray-800">{fmt(it.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onEdit} className="flex-1 py-2.5 bg-[#1A2F6E] text-white rounded-xl text-sm font-bold hover:bg-[#16295e] transition-colors">✏️ 編集する</button>
            <button onClick={() => { if (confirm('この案件を削除しますか？')) onDelete() }} className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors">削除</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// MasterTab
// ─────────────────────────────────────────
function MasterTab({ master, onChange, onStartSetup, onEditSample }: {
  master: Master; onChange: (m: Master) => void
  onStartSetup: () => void; onEditSample: (s: Sample) => void
}) {
  const [localM,       setLocalM]       = useState(master)
  const [saved,        setSaved]        = useState(false)
  const [showAddItem,  setShowAddItem]  = useState(false)
  const [newItemName,  setNewItemName]  = useState('')
  const [newItemUnit,  setNewItemUnit]  = useState<string>('menseki')
  const [newItemTanka, setNewItemTanka] = useState('')

  useEffect(() => { setLocalM(master) }, [master])

  function update(partial: Partial<Master>) { setLocalM(prev => ({ ...prev, ...partial })); setSaved(false) }

  function save() { onChange(localM); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  function updateFabric(id: number, field: string, val: string) {
    setLocalM(prev => ({ ...prev, fabrics: prev.fabrics.map(f => f.id === id ? { ...f, [field]: parseFloat(val) || 0 } : f) }))
    setSaved(false)
  }
  function deleteFabric(id: number) {
    if (localM.fabrics.length <= 1) return
    setLocalM(prev => ({ ...prev, fabrics: prev.fabrics.filter(f => f.id !== id) })); setSaved(false)
  }
  function addFabric() {
    const name = prompt('生地名を入力してください'); if (!name) return
    const habaCm = parseFloat(prompt('巾（cm）を入力してください') ?? ''); if (!habaCm) return
    const siire  = parseFloat(prompt('仕入単価（円/m）を入力してください') ?? ''); if (!siire) return
    setLocalM(prev => ({ ...prev, fabrics: [...prev.fabrics, { id: prev.nextFabricId, name, haba: habaCm * 10, siire, kake: 70 }], nextFabricId: prev.nextFabricId + 1 }))
    setSaved(false)
  }
  function addEstItem() {
    if (!newItemName.trim()) return
    const id = 'ei' + localM.nextItemId
    setLocalM(prev => ({
      ...prev,
      estItems: [...prev.estItems, { id, name: newItemName.trim(), unit: newItemUnit as EstItemMaster['unit'], ranges: [{ from: 0, to: 9999, tanka: parseFloat(newItemTanka) || 0 }], template: true }],
      nextItemId: prev.nextItemId + 1,
    }))
    setNewItemName(''); setNewItemTanka(''); setShowAddItem(false); setSaved(false)
  }
  function updateEstItem(id: string, field: keyof EstItemMaster, val: unknown) {
    setLocalM(prev => ({ ...prev, estItems: prev.estItems.map(i => i.id === id ? { ...i, [field]: val } : i) })); setSaved(false)
  }
  function deleteEstItem(id: string) {
    if (localM.estItems.length <= 1) return
    setLocalM(prev => ({ ...prev, estItems: prev.estItems.filter(i => i.id !== id) })); setSaved(false)
  }
  function updateRange(itemId: string, ri: number, field: keyof TankaRange, val: string) {
    setLocalM(prev => ({
      ...prev,
      estItems: prev.estItems.map(i => {
        if (i.id !== itemId) return i
        const ranges = i.ranges.map((r, idx) => {
          if (idx !== ri) return r
          if (field === 'to') { const v = parseFloat(val); return { ...r, to: isNaN(v) || val === '' ? 9999 : v } }
          return { ...r, [field]: parseFloat(val) || 0 }
        })
        return { ...i, ranges }
      })
    })); setSaved(false)
  }
  function addRange(itemId: string) {
    setLocalM(prev => ({
      ...prev,
      estItems: prev.estItems.map(i => {
        if (i.id !== itemId) return i
        const last = i.ranges[i.ranges.length - 1]
        return { ...i, ranges: [...i.ranges, { from: last.to >= 9999 ? last.from + 10 : last.to, to: 9999, tanka: 0 }] }
      })
    })); setSaved(false)
  }
  function deleteRange(itemId: string, ri: number) {
    setLocalM(prev => ({
      ...prev,
      estItems: prev.estItems.map(i => {
        if (i.id !== itemId || i.ranges.length <= 1) return i
        return { ...i, ranges: i.ranges.filter((_, idx) => idx !== ri) }
      })
    })); setSaved(false)
  }
  function deleteSample(id: string) {
    const newSamples = (localM.samples ?? []).filter(s => s.id !== id)
    onChange({ ...localM, samples: newSamples })
  }
  function addClient() {
    const list = localM.clients ?? []
    const nextId = localM.nextClientId ?? (list.length + 1)
    const newClient: Client = { id: 'cl' + nextId, name: '', furigana: '' }
    setLocalM(prev => ({ ...prev, clients: [...(prev.clients ?? []), newClient], nextClientId: nextId + 1 }))
    setSaved(false)
  }
  function updateClient(id: string, field: 'name' | 'furigana', val: string) {
    setLocalM(prev => ({ ...prev, clients: (prev.clients ?? []).map(c => c.id === id ? { ...c, [field]: val } : c) }))
    setSaved(false)
  }
  function deleteClient(id: string) {
    setLocalM(prev => ({ ...prev, clients: (prev.clients ?? []).filter(c => c.id !== id) }))
    setSaved(false)
  }
  function runGenerateRanges() {
    const samples = localM.samples ?? []
    if (samples.length < 3) { alert('サンプルが3件以上必要です'); return }
    const updatedItems = generateRangesFromSamples(samples, localM.estItems)
    onChange({ ...localM, estItems: updatedItems })
    alert('単価を自動設定しました')
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30 bg-gray-50'
  const labelCls = 'block text-xs text-gray-500 mb-1'

  return (
    <div className="space-y-5">
      {/* Company */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4">会社情報</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>会社名</label><input className={inputCls} value={localM.companyName} onChange={e => update({ companyName: e.target.value })} placeholder="例：西岡テント" /></div>
          <div><label className={labelCls}>会社所在地（距離計算用）</label><input className={inputCls} value={localM.company} onChange={e => update({ company: e.target.value })} placeholder="例：大阪府大阪市" /></div>
          <div><label className={labelCls}>人工単価（円/人日）</label><input type="number" className={inputCls} value={localM.ninku} onChange={e => update({ ninku: parseFloat(e.target.value) || 0 })} /></div>
        </div>
      </section>

      {/* Clients */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">得意先マスタ</h3>
          <button onClick={addClient} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-[#1A2F6E] transition-colors">＋ 追加</button>
        </div>
        <p className="text-xs text-gray-400 mb-3">案件を保存すると自動で追加されます。フリガナを入れるとあいうえお順で並びます。</p>
        {(() => {
          const sorted = sortClientsByFurigana(localM.clients ?? [])
          if (sorted.length === 0) {
            return <div className="text-center py-6 text-gray-400 text-sm">得意先がまだありません</div>
          }
          return (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-[10px] text-gray-400">
                <span>得意先名</span>
                <span>フリガナ</span>
                <span></span>
              </div>
              {sorted.map(c => (
                <div key={c.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input className={inputCls} value={c.name} onChange={e => updateClient(c.id, 'name', e.target.value)} placeholder="得意先名" />
                  <input className={inputCls} value={c.furigana} onChange={e => updateClient(c.id, 'furigana', e.target.value)} placeholder="ヤマダショウテン" />
                  <button onClick={() => deleteClient(c.id)} className="text-xs text-red-400 hover:text-red-600 px-2">削除</button>
                </div>
              ))}
            </div>
          )
        })()}
      </section>

      {/* Distance */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4">出張諸経費（距離別）</h3>
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">距離閾値 (km)</div>
          <div className="grid grid-cols-3 gap-2">
            {([0, 1, 2] as const).map(i => (
              <div key={i}><label className="block text-[10px] text-gray-400 mb-1">閾値{i + 1}</label>
                <input type="number" className={inputCls} value={localM.distTh[i]} onChange={e => { const v = parseFloat(e.target.value)||0; const t = [...localM.distTh] as [number,number,number]; t[i]=v; update({distTh:t}) }} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>{localM.distTh[0]}km未満 (円)</label><input type="number" className={inputCls} value={localM.dist[0]} onChange={e => update({dist:[parseFloat(e.target.value)||0,localM.dist[1],localM.dist[2],localM.dist[3]]})} /></div>
          <div><label className={labelCls}>{localM.distTh[0]}〜{localM.distTh[1]}km (円)</label><input type="number" className={inputCls} value={localM.dist[1]} onChange={e => update({dist:[localM.dist[0],parseFloat(e.target.value)||0,localM.dist[2],localM.dist[3]]})} /></div>
          <div><label className={labelCls}>{localM.distTh[1]}〜{localM.distTh[2]}km (円)</label><input type="number" className={inputCls} value={localM.dist[2]} onChange={e => update({dist:[localM.dist[0],localM.dist[1],parseFloat(e.target.value)||0,localM.dist[3]]})} /></div>
          <div><label className={labelCls}>{localM.distTh[2]}km以上 (円)</label><input type="number" className={inputCls} value={localM.dist[3]} onChange={e => update({dist:[localM.dist[0],localM.dist[1],localM.dist[2],parseFloat(e.target.value)||0]})} /></div>
        </div>
      </section>

      {/* Fabrics */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700">生地マスタ</h3>
          <button onClick={addFabric} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-[#1A2F6E] transition-colors">＋ 追加</button>
        </div>
        <div className="space-y-3">
          {localM.fabrics.map(f => (
            <div key={f.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-medium text-sm text-gray-800">{f.name}</div>
                {localM.fabrics.length > 1 && <button onClick={() => deleteFabric(f.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>巾 (mm)</label><input type="number" className={inputCls} value={f.haba} onChange={e => updateFabric(f.id,'haba',e.target.value)} /></div>
                <div><label className={labelCls}>仕入 (円/m)</label><input type="number" className={inputCls} value={f.siire} onChange={e => updateFabric(f.id,'siire',e.target.value)} /></div>
                <div><label className={labelCls}>掛率 (%)</label><input type="number" className={inputCls} value={f.kake} onChange={e => updateFabric(f.id,'kake',e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Est items */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700">見積項目マスタ</h3>
          <button onClick={() => setShowAddItem(v => !v)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-[#1A2F6E] transition-colors">＋ 追加</button>
        </div>
        {showAddItem && (
          <div className="border border-blue-200 rounded-lg p-3 mb-4 bg-blue-50">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div><label className={labelCls}>項目名</label><input className={inputCls+' bg-white'} value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="例：防水処理費" /></div>
              <div><label className={labelCls}>単位</label><select className={inputCls+' bg-white'} value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>{Object.entries(UNIT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            {newItemUnit !== 'ninku' && (<div className="mb-2"><label className={labelCls}>初期単価（円）</label><input type="number" className={inputCls+' bg-white'} value={newItemTanka} onChange={e => setNewItemTanka(e.target.value)} placeholder="0" /></div>)}
            <div className="flex gap-2">
              <button onClick={addEstItem} className="flex-1 py-1.5 bg-[#1A2F6E] text-white rounded-lg text-xs font-bold">追加する</button>
              <button onClick={() => setShowAddItem(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500">キャンセル</button>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {localM.estItems.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <input className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A2F6E]/30" value={item.name} onChange={e => updateEstItem(item.id,'name',e.target.value)} />
                <select className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none" value={item.unit} onChange={e => updateEstItem(item.id,'unit',e.target.value)}>
                  {Object.entries(UNIT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                  <input type="checkbox" checked={item.template} onChange={e => updateEstItem(item.id,'template',e.target.checked)} /> 初期表示
                </label>
                {localM.estItems.length > 1 && <button onClick={() => deleteEstItem(item.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>}
              </div>
              {['yojaku','menseki','maguchi','debaba','shiki'].includes(item.unit) && (
                <div className="bg-gray-50 rounded-lg p-2.5 mt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-500 font-bold">範囲別単価</span>
                    <button onClick={() => addRange(item.id)} className="text-[10px] text-[#1A2F6E] hover:underline">＋追加</button>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 text-[10px] text-gray-400 mb-1 px-1"><span>以上</span><span>未満</span><span>単価(円)</span><span></span></div>
                  {item.ranges.map((r, ri) => (
                    <div key={ri} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 mb-1 items-center">
                      <input type="number" className="border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none" value={r.from} onChange={e => updateRange(item.id,ri,'from',e.target.value)} />
                      <input type="number" className="border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none" placeholder="上限なし" value={r.to>=9999?'':r.to} onChange={e => updateRange(item.id,ri,'to',e.target.value)} />
                      <input type="number" className="border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none" value={r.tanka} onChange={e => updateRange(item.id,ri,'tanka',e.target.value)} />
                      {item.ranges.length > 1 && <button onClick={() => deleteRange(item.id,ri)} className="text-red-300 hover:text-red-500 text-xs">×</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Samples */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700">サンプル見積</h3>
            <p className="text-xs text-gray-400 mt-0.5">実績データから単価を自動設定（3件以上で有効）</p>
          </div>
          <button onClick={onStartSetup} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-[#1A2F6E] transition-colors">＋ 追加</button>
        </div>
        {(localM.samples ?? []).length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">サンプルがありません</p>
            <p className="text-xs mt-1">3件以上登録すると単価を自動設定できます</p>
            <button onClick={onStartSetup} className="mt-3 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors">✨ 初回単価設定ウィザードを開始</button>
          </div>
        ) : (
          <div className="space-y-2">
            {(localM.samples ?? []).map(s => (
              <div key={s.id} className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-700">{s.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{Math.round(s.maguchi*1000)}×{Math.round(s.debaba*1000)}mm · 要尺{s.totalY.toFixed(1)}m · {fmt(s.shokei)}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => onEditSample(s)} className="text-xs text-blue-500 hover:underline">編集</button>
                  <button onClick={() => { if (confirm(`「${s.name}」を削除しますか？`)) deleteSample(s.id) }} className="text-xs text-red-400 hover:text-red-600">削除</button>
                </div>
              </div>
            ))}
            {(localM.samples ?? []).length >= 3 && (
              <button onClick={runGenerateRanges} className="w-full py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition-colors font-medium">
                ✨ サンプルから範囲別単価を自動生成（小・中・大）
              </button>
            )}
          </div>
        )}
      </section>

      <button onClick={save} className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-[#1A2F6E] text-white hover:bg-[#16295e]'}`}>
        {saved ? '✓ 保存しました' : 'マスタを保存'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────
// SetupWizard
// ─────────────────────────────────────────
function SetupWizard({ master, editingSample, onClose, onFinish }: {
  master: Master; editingSample: Sample | null
  onClose: () => void; onFinish: (samples: Sample[], updatedEstItems: EstItemMaster[]) => void
}) {
  const isEdit = editingSample != null
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<SetupAnswer[]>(() => {
    const defaults = SETUP_PRESETS.map(p => ({ ...p, fabricId: master.fabrics[0]?.id ?? 1, items: {} as Record<string,number>, workers: 2, wtime: 1 }))
    if (editingSample) {
      defaults[0] = {
        name: editingSample.name,
        maguchi: Math.round(editingSample.maguchi * 1000), debaba: Math.round(editingSample.debaba * 1000),
        okutaka: Math.round(editingSample.okutaka * 1000), maetaka: Math.round(editingSample.maetaka * 1000),
        tsuma: editingSample.tsumaC,
        fabricId: master.fabrics.find(f => f.name === editingSample.fabricName)?.id ?? master.fabrics[0]?.id ?? 1,
        items: Object.fromEntries(editingSample.items.map(i => [i.masterId, i.value])),
        workers: editingSample.workers, wtime: editingSample.wtime,
      }
    }
    return defaults
  })

  const ans    = answers[step]
  const fabric = master.fabrics.find(f => f.id === ans.fabricId) ?? master.fabrics[0]
  const habaM  = fabric ? fabric.haba / 1000 : 1.2
  const mg = (ans.maguchi||0)/1000, db = (ans.debaba||0)/1000
  const ok = (ans.okutaka||0)/1000, mt = (ans.maetaka||0)/1000
  const dims     = mg > 0 && db > 0 ? calcDims(mg, db, ok, mt, ans.tsuma, habaM) : null
  const koji     = ans.workers * ans.wtime * master.ninku
  const fabCost  = dims && fabric ? fabric.siire * dims.totalY : 0
  const subtotal = Object.values(ans.items).reduce((s,v) => s+v, 0) + koji

  function updateAns(partial: Partial<SetupAnswer>) {
    setAnswers(prev => prev.map((a, i) => i === step ? { ...a, ...partial } : a))
  }

  function buildSample(a: SetupAnswer): Sample | null {
    const f = master.fabrics.find(f => f.id === a.fabricId) ?? master.fabrics[0]
    const hm = f ? f.haba/1000 : 1.2
    const mg2=(a.maguchi||0)/1000, db2=(a.debaba||0)/1000, ok2=(a.okutaka||0)/1000, mt2=(a.maetaka||0)/1000
    if (!mg2||!db2) return null
    if (!Object.values(a.items).some(v => v>0)) return null
    const d2   = calcDims(mg2,db2,ok2,mt2,a.tsuma,hm)
    const koji2 = a.workers*a.wtime*master.ninku
    const genka2 = f ? f.siire*d2.totalY : 0
    const sItems = master.estItems.filter(ei => ei.unit!=='ninku' && (a.items[ei.id]||0)>0).map(ei => {
      const val = a.items[ei.id]||0
      const base = ei.unit==='yojaku'?d2.totalY:ei.unit==='menseki'?d2.menseki:ei.unit==='maguchi'?mg2:ei.unit==='debaba'?db2:0
      return { masterId:ei.id, name:ei.name, unit:ei.unit, value:val, tanka:base>0?val/base:0 }
    })
    return {
      id: editingSample?.id ?? (Date.now().toString()+Math.random().toString(36).slice(2)),
      name:a.name, shokei:Object.values(a.items).reduce((s,v)=>s+v,0)+koji2,
      date:new Date().toLocaleDateString('ja-JP'),
      totalY:d2.totalY, menseki:d2.menseki,
      maguchi:mg2, debaba:db2, okutaka:ok2, maetaka:mt2, tsumaC:a.tsuma,
      kojihi:koji2, genka:genka2, fabricId:f?f.id:0, fabricName:f?f.name:'',
      workers:a.workers, wtime:a.wtime, items:sItems,
    }
  }

  function finishSetup() {
    const existing = (master.samples??[]).filter(s => isEdit ? s.id!==editingSample!.id : true)
    const toProcess = isEdit ? [answers[0]] : answers
    const newSamples = toProcess.map(buildSample).filter(Boolean) as Sample[]
    if (!newSamples.length) { alert('少なくとも1件の金額を入力してください'); return }
    const allSamples   = [...existing, ...newSamples]
    const updatedItems = allSamples.length>=3 ? generateRangesFromSamples(allSamples, master.estItems) : master.estItems
    onFinish(allSamples, updatedItems)
  }

  const selCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30'

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-sm">{isEdit ? `編集: ${editingSample!.name}` : '単価設定ウィザード'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center">×</button>
          </div>
          {!isEdit && (
            <>
              <div className="flex gap-0.5">
                {SETUP_PRESETS.map((_,i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i<step?'bg-green-400':i===step?'bg-[#1A2F6E]':'bg-gray-200'}`} />
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1.5">{step+1} / {SETUP_PRESETS.length}</div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">パターン名</label>
            <input className={selCls} value={ans.name} onChange={e => updateAns({name:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([['間口 (mm)','maguchi'],['出幅 (mm)','debaba'],['奥高 (mm)','okutaka'],['前高 (mm)','maetaka']] as const).map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type="number" className={selCls+' font-mono'} value={ans[key]||''} onChange={e => updateAns({[key]:parseFloat(e.target.value)||0})} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">生地</label>
              <select className={selCls} value={ans.fabricId} onChange={e => updateAns({fabricId:parseInt(e.target.value)})}>
                {master.fabrics.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">妻面</label>
              <select className={selCls} value={ans.tsuma} onChange={e => updateAns({tsuma:parseInt(e.target.value)})}>
                <option value={2}>左右あり</option><option value={1}>片側のみ</option><option value={0}>なし</option>
              </select>
            </div>
          </div>
          {dims && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex flex-wrap gap-3 text-sm">
              <span className="font-mono font-bold text-green-700">要尺 {dims.totalY.toFixed(2)}m</span>
              <span className="font-mono text-green-600">面積 {dims.menseki.toFixed(2)}m²</span>
              <span className="font-mono text-gray-500">生地原価 {fmt(fabCost)}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">施工人数</label>
              <select className={selCls} value={ans.workers} onChange={e => updateAns({workers:parseInt(e.target.value)})}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n}人</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">施工日数</label>
              <select className={selCls} value={ans.wtime} onChange={e => updateAns({wtime:parseFloat(e.target.value)})}>
                <option value="0.5">半日</option><option value="1">1日</option><option value="2">2日</option><option value="3">3日</option>
              </select>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1">見積金額を入力</div>
            <p className="text-xs text-gray-400 mb-3">このサイズの実際の受注金額を参考に入力してください</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-1.5">
                <div className="flex-1 text-sm text-gray-700">施工費（人工・自動）</div>
                <div className="text-sm font-mono bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200 text-yellow-800">{fmt(koji)}</div>
              </div>
              {master.estItems.filter(ei => ei.unit!=='ninku').map(ei => {
                const base = dims ? (ei.unit==='yojaku'?dims.totalY:ei.unit==='menseki'?dims.menseki:ei.unit==='maguchi'?mg:ei.unit==='debaba'?db:null) : null
                return (
                  <div key={ei.id} className="flex items-center gap-3 py-1">
                    <div className="flex-1">
                      <div className="text-sm text-gray-700">{ei.name}</div>
                      {base!=null && <div className="text-[10px] text-gray-400">{ei.unit==='shiki'?'固定金額':`${base.toFixed(2)}${ei.unit==='yojaku'?'m':'m²'} × 単価`}</div>}
                    </div>
                    <input type="number" placeholder="0" value={ans.items[ei.id]||''} onChange={e => updateAns({items:{...ans.items,[ei.id]:parseFloat(e.target.value)||0}})}
                      className="w-28 text-right border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30" />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-2.5 flex justify-between text-sm border border-gray-200">
            <span className="text-gray-500">小計（参考）</span>
            <span className="font-mono font-bold text-[#1A2F6E]">{fmt(subtotal)}</span>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3">
          {!isEdit && step > 0 && (
            <button onClick={() => setStep(s => s-1)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-400">← 前へ</button>
          )}
          {!isEdit && (
            <button onClick={finishSetup} className="px-4 py-2.5 border border-amber-200 text-amber-600 rounded-xl text-sm hover:bg-amber-50">途中で完了</button>
          )}
          <button
            onClick={() => { if (isEdit || step===SETUP_PRESETS.length-1) finishSetup(); else setStep(s => s+1) }}
            className="flex-1 py-2.5 bg-[#1A2F6E] text-white rounded-xl text-sm font-bold hover:bg-[#16295e] transition-colors"
          >
            {isEdit ? '保存する' : step===SETUP_PRESETS.length-1 ? '✓ 完了' : '次へ →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────
function CardTitle({ label, noMargin }: { label: string; noMargin?: boolean }) {
  return (
    <h2 className={`text-sm font-bold text-gray-700 flex items-center gap-2 ${noMargin ? '' : 'mb-1'}`}>
      <span className="w-1 h-4 bg-[#E8342A] rounded-full flex-shrink-0" />
      {label}
    </h2>
  )
}
