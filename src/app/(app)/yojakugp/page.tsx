'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────
interface Problem {
  nagare: number    // mm
  maedaka: number   // mm
  maguchi: number   // mm
  kinuhaba: number  // cm
}

function randomStep(min: number, max: number, step: number) {
  const steps = Math.floor((max - min) / step)
  return min + Math.floor(Math.random() * (steps + 1)) * step
}
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function generateProblem(): Problem {
  return {
    nagare:   randomStep(1000, 4000, 50),
    maedaka:  randomStep(200,  1500, 50),
    maguchi:  randomStep(2500, 12000, 50),
    kinuhaba: randomChoice([94, 103, 120, 154]),
  }
}
function calcYojaku(p: Problem): number {
  const tachi   = p.nagare + p.maedaka
  const habaKazu = Math.ceil(p.maguchi / (p.kinuhaba * 10))
  return tachi * habaKazu
}
function fmtTime(sec: number) {
  const m  = Math.floor(sec / 60)
  const s  = Math.floor(sec % 60)
  const ds = Math.floor((sec % 1) * 10)
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${ds}`
}

// ─────────────────────────────────────────
// テント図面（画像＋寸法ラベル）
// ─────────────────────────────────────────
function TentDiagram({ nagare, maedaka, maguchi, kinuhaba, compact = false }: {
  nagare?: number; maedaka?: number; maguchi?: number; kinuhaba?: number; compact?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src="/tent_diagram.jpeg"
        alt="テント図面（流れ・間口・前高）"
        style={{ maxWidth: compact ? 260 : 320, width: '100%', borderRadius: 8 }}
      />
    </div>
  )
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────
type Screen = 'start' | 'problem' | 'result'

const TOTAL_PROBLEMS = 5
const PENALTY_SEC    = 5

export default function YojakuGPPage() {
  const [screen,      setScreen]     = useState<Screen>('start')
  const [problems,    setProblems]   = useState<Problem[]>([])
  const [qIdx,        setQIdx]       = useState(0)
  const [answer,      setAnswer]     = useState('')
  const [errorMsg,    setErrorMsg]   = useState('')
  const [penaltyCount,setPenalty]    = useState(0)
  const [elapsed,     setElapsed]    = useState(0)       // seconds (display)
  const [finalResult, setFinalResult]= useState<{totalTime:number;actualTime:number;penalties:number}|null>(null)
  const [shake,       setShake]      = useState(false)
  const [flash,       setFlash]      = useState<'none'|'correct'|'wrong'>('none')

  const startTimeRef = useRef<number>(0)
  const timerRef     = useRef<ReturnType<typeof setInterval>|null>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  // ── Timer ──
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000)
    }, 50)
  }, [])
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

  // ── Start challenge ──
  function startChallenge() {
    const probs = Array.from({length: TOTAL_PROBLEMS}, () => generateProblem())
    setProblems(probs)
    setQIdx(0)
    setPenalty(0)
    setAnswer('')
    setErrorMsg('')
    setElapsed(0)
    setFlash('none')
    setScreen('problem')
    startTimer()
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ── Submit answer ──
  function submitAnswer() {
    const val = answer.trim()
    if (!val) { setErrorMsg('回答を入力してください'); return }
    const num = parseInt(val, 10)
    if (isNaN(num)) { setErrorMsg('数値を入力してください'); return }

    const correct = calcYojaku(problems[qIdx])

    if (num === correct) {
      // 正解
      setFlash('correct')
      setErrorMsg('')
      setTimeout(() => {
        setFlash('none')
        const next = qIdx + 1
        if (next >= TOTAL_PROBLEMS) {
          finishChallenge()
        } else {
          setQIdx(next)
          setAnswer('')
          setTimeout(() => inputRef.current?.focus(), 50)
        }
      }, 400)
    } else {
      // 不正解
      setFlash('wrong')
      setPenalty(p => p + 1)
      setErrorMsg(`❌ 不正解！ +${PENALTY_SEC}秒ペナルティ`)
      setShake(true)
      setTimeout(() => { setShake(false); setFlash('none') }, 500)
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }

  function finishChallenge() {
    stopTimer()
    const actualTime = (Date.now() - startTimeRef.current) / 1000
    const totalTime  = actualTime + penaltyCount * PENALTY_SEC
    const result = { totalTime, actualTime, penalties: penaltyCount }
    setFinalResult(result)
    localStorage.setItem('gp_latest_result', JSON.stringify({
      timestamp: new Date().toISOString(),
      ...result,
      completed: true,
    }))
    setScreen('result')
  }

  function quit() {
    if (confirm('本当にリタイアしますか？\n記録は残りません。')) {
      stopTimer()
      setScreen('start')
    }
  }

  const cur = problems[qIdx]

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b-4 border-[#1A2F6E] text-center py-5 px-4">
        <h1 className="text-2xl font-bold text-[#1A2F6E]" style={{fontFamily:"'Noto Serif JP',serif"}}>⚡ 要尺GP</h1>
        <p className="text-sm text-[#E8342A] font-medium mt-1">全国のテント屋が速さを競う</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ══ START SCREEN ══ */}
        {screen === 'start' && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="text-xl font-bold text-[#1A2F6E] pb-3 border-b-2 border-[#E8342A]" style={{fontFamily:"'Noto Serif JP',serif"}}>
              要尺GPへようこそ！
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {TOTAL_PROBLEMS}問の要尺計算問題に挑戦して、あなたの計算速度を測定します。<br/>
              制限時間はありません。正確さとスピードの両方が求められます。
            </p>

            {/* Rules */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
              <p className="font-bold text-[#1A2F6E] mb-2">💡 ルール</p>
              <ul className="list-disc ml-5 space-y-1 text-gray-700">
                <li>{TOTAL_PROBLEMS}問の要尺計算問題に挑戦</li>
                <li>不正解の場合、+{PENALTY_SEC}秒ペナルティ</li>
                <li>正解するまで次の問題に進めません</li>
                <li>何度でも挑戦できます</li>
                <li>計算機の使用は可能です</li>
              </ul>
            </div>

            {/* Formula */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
              <p className="font-bold text-[#1A2F6E] mb-2">📐 計算式</p>
              <div className="font-mono text-gray-800 space-y-1">
                <div>裁ち寸 = 流れ + 前高</div>
                <div>巾数　 = ⌈間口 ÷ 生地巾⌉</div>
                <div>要尺　 = 裁ち寸 × 巾数</div>
              </div>
            </div>

            {/* Diagram example */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <TentDiagram nagare={2000} maedaka={500} maguchi={6000} kinuhaba={120} />
            </div>

            {/* Calc example */}
            <div className="bg-blue-50 border-l-4 border-[#1A2F6E] p-4 text-sm">
              <p className="font-bold text-[#1A2F6E] mb-2">📝 計算例</p>
              <div className="leading-relaxed text-gray-700">
                流れ: 2,000mm、前高: 500mm、間口: 6,000mm、生地巾: 120cm（= 1,200mm）<br/>
                <br/>
                ① 裁ち寸 = 2,000 + 500 = <strong>2,500mm</strong><br/>
                ② 巾数 = ⌈6,000 ÷ 1,200⌉ = ⌈5.0⌉ = <strong>5巾</strong><br/>
                ③ 要尺 = 2,500 × 5 = <strong>12,500mm</strong>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={startChallenge}
                className="px-10 py-4 bg-[#E8342A] text-white font-bold text-lg rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
              >
                🏁 挑戦する
              </button>
            </div>
          </div>
        )}

        {/* ══ PROBLEM SCREEN ══ */}
        {screen === 'problem' && cur && (
          <div className={`bg-white rounded-xl shadow-sm p-6 transition-all ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
            style={shake ? {animation:'shake 0.4s ease'} : {}}>

            {/* Progress + timer */}
            <div className="text-center mb-4">
              <div className="text-sm font-bold text-[#1A2F6E] mb-2">
                問題 {qIdx + 1}/{TOTAL_PROBLEMS}
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-[#1A2F6E] h-2 rounded-full transition-all"
                  style={{width: `${((qIdx) / TOTAL_PROBLEMS) * 100}%`}}
                />
              </div>
              <div className={`text-5xl font-mono font-bold ${penaltyCount > 0 ? 'text-[#E8342A]' : 'text-[#E8342A]'}`}>
                {fmtTime(elapsed + penaltyCount * PENALTY_SEC)}
              </div>
              {penaltyCount > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  実時間 {fmtTime(elapsed)} ＋ ペナルティ {penaltyCount}回（+{penaltyCount * PENALTY_SEC}秒）
                </div>
              )}
            </div>

            <h2 className="text-base font-bold text-[#1A2F6E] mb-4 pb-2 border-b-2 border-[#E8342A]">
              このテントの要尺を計算してください
            </h2>

            {/* Spec cards */}
            <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
              {([
                ['流れ寸法', cur.nagare.toLocaleString(), 'mm'],
                ['前高',     cur.maedaka.toLocaleString(), 'mm'],
                ['間口',     cur.maguchi.toLocaleString(), 'mm'],
                ['生地巾',   String(cur.kinuhaba), 'cm'],
              ] as [string, string, string][]).map(([label, val, unit]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 border-l-4 border-[#E8342A]">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-xl font-bold text-[#1A2F6E] font-mono">
                    {val}<span className="text-xs font-normal ml-1">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tent diagram */}
            <div className={`bg-gray-50 rounded-lg p-3 text-center mb-4 transition-colors ${flash === 'correct' ? 'bg-green-50' : flash === 'wrong' ? 'bg-red-50' : ''}`}>
              <TentDiagram
                nagare={cur.nagare}
                maedaka={cur.maedaka}
                maguchi={cur.maguchi}
                kinuhaba={cur.kinuhaba}
                compact
              />
            </div>

            {/* Answer input */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <input
                ref={inputRef}
                type="number"
                value={answer}
                onChange={e => { setAnswer(e.target.value); setErrorMsg('') }}
                onKeyDown={e => { if (e.key === 'Enter') submitAnswer() }}
                placeholder="00000"
                className="w-44 text-right text-2xl font-bold font-mono border-2 border-[#1A2F6E] rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#1A2F6E]/30"
                style={{WebkitAppearance:'none',MozAppearance:'textfield'}}
              />
              <span className="text-xl font-bold text-[#1A2F6E]">mm</span>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="bg-red-50 text-[#E8342A] font-bold text-center py-3 px-4 rounded-lg mb-4 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={submitAnswer}
                className="flex-1 py-3 bg-[#E8342A] text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                回答する
              </button>
              <button
                onClick={quit}
                className="px-5 py-3 border-2 border-[#1A2F6E] text-[#1A2F6E] font-bold rounded-lg hover:bg-[#1A2F6E] hover:text-white transition-colors"
              >
                リタイア
              </button>
            </div>

            {/* Formula reminder */}
            <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-gray-600 font-mono">
              裁ち寸 = 流れ + 前高　｜　巾数 = ⌈間口 ÷ 生地巾⌉　｜　要尺 = 裁ち寸 × 巾数
            </div>
          </div>
        )}

        {/* ══ RESULT SCREEN ══ */}
        {screen === 'result' && finalResult && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold text-[#1A2F6E] mb-6" style={{fontFamily:"'Noto Serif JP',serif"}}>
                🎉 お疲れ様でした！
              </h2>

              {/* Final time (with penalty) */}
              <div className="text-7xl font-mono font-bold text-[#E8342A] mb-2">
                {fmtTime(finalResult.totalTime)}
              </div>
              <div className="text-sm text-gray-500 mb-6">ペナルティ込み総タイム</div>

              {/* Details */}
              <div className="space-y-2 text-base text-gray-700 mb-6">
                <div>正解数：<strong className="text-[#1A2F6E]">{TOTAL_PROBLEMS}</strong>/{TOTAL_PROBLEMS}</div>
                <div>ペナルティ：<strong className="text-[#E8342A]">{finalResult.penalties}</strong>回（+<strong>{finalResult.penalties * PENALTY_SEC}</strong>秒）</div>
                <div className="text-sm text-gray-500">
                  実質タイム：<strong className="text-[#1A2F6E]">{fmtTime(finalResult.actualTime)}</strong>
                </div>
              </div>

              {/* Rank badge */}
              <RankBadge totalTime={finalResult.totalTime} />
            </div>

            {/* Review: all problems */}
            <div className="border-t border-gray-100 pt-5 mt-2">
              <h3 className="text-sm font-bold text-gray-600 mb-3">📋 問題一覧</h3>
              <div className="space-y-2">
                {problems.map((p, i) => {
                  const ans = calcYojaku(p)
                  return (
                    <div key={i} className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2 font-mono">
                      <span className="text-gray-500">問{i+1}</span>
                      <span className="text-gray-700">
                        流れ{p.nagare.toLocaleString()} ＋ 前高{p.maedaka.toLocaleString()} × {Math.ceil(p.maguchi/(p.kinuhaba*10))}巾
                      </span>
                      <span className="font-bold text-[#1A2F6E]">{ans.toLocaleString()}mm</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={startChallenge}
                className="flex-1 py-3 bg-[#E8342A] text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                もう一度挑戦
              </button>
              <button
                onClick={() => setScreen('start')}
                className="flex-1 py-3 bg-[#1A2F6E] text-white font-bold rounded-lg hover:bg-[#16295e] transition-colors"
              >
                終了
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────
// Rank badge
// ─────────────────────────────────────────
function RankBadge({ totalTime }: { totalTime: number }) {
  let rank: string, color: string, comment: string
  if (totalTime < 90) {
    rank = '🏆 SS'; color = '#FFD700'; comment = '伝説のテント職人'
  } else if (totalTime < 120) {
    rank = '🥇 S';  color = '#FFD700'; comment = '達人クラス'
  } else if (totalTime < 180) {
    rank = '🥈 A';  color = '#C0C0C0'; comment = 'ベテランの域'
  } else if (totalTime < 240) {
    rank = '🥉 B';  color = '#CD7F32'; comment = 'なかなか速い'
  } else if (totalTime < 360) {
    rank = '📐 C';  color = '#1A2F6E'; comment = 'もう少し練習'
  } else {
    rank = '🌱 D';  color = '#666';    comment = '諦めずに挑戦'
  }
  return (
    <div className="inline-flex flex-col items-center gap-1 bg-gray-50 rounded-2xl px-8 py-4 border-2" style={{borderColor:color}}>
      <span className="text-3xl font-bold" style={{color}}>{rank}</span>
      <span className="text-sm text-gray-600">{comment}</span>
    </div>
  )
}
