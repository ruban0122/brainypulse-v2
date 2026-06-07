'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts'
import { useGameStore } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'

// ─── Tile color palette — each position has a unique identity ─────────────────
const TILE_COLORS = [
  { idle: '#1a1a2e', active: '#e040fb', border: '#7b1fa2', glow: 'rgba(224,64,251,0.45)' }, // purple
  { idle: '#1a2a1a', active: '#00e676', border: '#00897b', glow: 'rgba(0,230,118,0.45)' },  // green
  { idle: '#2a1a1a', active: '#ff5252', border: '#c62828', glow: 'rgba(255,82,82,0.45)' },  // red
  { idle: '#1a1f2a', active: '#40c4ff', border: '#0277bd', glow: 'rgba(64,196,255,0.45)' }, // blue
  { idle: '#2a2a1a', active: '#ffeb3b', border: '#f57f17', glow: 'rgba(255,235,59,0.45)' }, // yellow
  { idle: '#2a1a20', active: '#ff4081', border: '#c51162', glow: 'rgba(255,64,129,0.45)' }, // pink
  { idle: '#1a2a2a', active: '#18ffff', border: '#00838f', glow: 'rgba(24,255,255,0.45)' }, // cyan
  { idle: '#221a2a', active: '#ff6d00', border: '#e65100', glow: 'rgba(255,109,0,0.45)' },  // orange
  { idle: '#1e2a1a', active: '#b2ff59', border: '#558b2f', glow: 'rgba(178,255,89,0.45)' }, // lime
]

const MAX_LIVES = 3

type Phase = 'idle' | 'showing' | 'input' | 'fail' | 'success' | 'lifeLost'

interface LevelTiming {
  level: number
  timeMs: number
  failed: boolean
}

interface MemoryResults {
  levelTimings: LevelTiming[]
  highestLevel: number
  totalTilesCorrect: number
  avgClearMs: number
  fastestMs: number
  slowestMs: number
  streakMax: number
}

// ─── Flash speed scaling: faster as level increases ──────────────────────────
function getFlashMs(level: number): number {
  // Level 1–3: 850ms, 4–6: 700ms, 7–9: 580ms, 10–12: 480ms, 13+: 400ms
  if (level <= 3) return 850
  if (level <= 6) return 700
  if (level <= 9) return 580
  if (level <= 12) return 480
  return 400
}

// ─── Input countdown: shrinks with level ─────────────────────────────────────
function getInputTimeSec(level: number): number {
  // 8s at level 1, shrinks by 0.3s per level, minimum 3s
  return Math.max(3, 8 - (level - 1) * 0.3)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label, value, unit, accent, large,
}: {
  label: string; value: string | number; unit?: string; accent?: boolean; large?: boolean
}) {
  return (
    <div className="bg-[#161618] border border-[#222] rounded-xl p-4">
      <div className="text-[#555] text-[10px] uppercase tracking-[0.15em] mb-1.5 font-mono">{label}</div>
      <div className={`font-bold tabular-nums font-mono ${large ? 'text-5xl' : 'text-2xl'} ${accent ? 'text-[#00ff88]' : 'text-white'}`}>
        {value}
        {unit && <span className="text-sm text-[#555] ml-1.5 font-normal">{unit}</span>}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string | number
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono shadow-2xl">
        <p className="text-[#666] mb-1">Level {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value} ms</span></p>
        ))}
      </div>
    )
  }
  return null
}

function ResultsActions({ onRetry, shareText }: { onRetry: () => void; shareText: string }) {
  const [copied, setCopied] = useState(false)
  const handleShare = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-wrap gap-5 items-center text-sm font-mono">
      <button onClick={onRetry} className="flex items-center gap-2 text-[#888] hover:text-[#00ff88] transition-colors">
        <span>↺</span><span>Try Again <span className="text-[#333] text-xs">(Enter)</span></span>
      </button>
      <Link href="/leaderboard" className="flex items-center gap-2 text-[#888] hover:text-[#00ff88] transition-colors">
        <span>⊞</span><span>Leaderboard</span>
      </Link>
      <button onClick={handleShare} className={`flex items-center gap-2 transition-colors ${copied ? 'text-[#00ff88]' : 'text-[#888] hover:text-[#00ff88]'}`}>
        <span>{copied ? '✓' : '⇪'}</span><span>{copied ? 'Copied!' : 'Share Result'}</span>
      </button>
    </div>
  )
}

// ─── Heart / Lives display ────────────────────────────────────────────────────
function Lives({ lives, max }: { lives: number; max: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`text-xl transition-all duration-300 ${i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-90 grayscale'}`}
          style={{ filter: i < lives ? 'drop-shadow(0 0 6px rgba(255,80,80,0.7))' : undefined }}
        >
          ❤️
        </span>
      ))}
    </div>
  )
}

// ─── Circular countdown ring ──────────────────────────────────────────────────
function CountdownRing({ total, remaining }: { total: number; remaining: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const pct = remaining / total
  const urgent = pct < 0.35
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="rotate-[-90deg]">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#222" strokeWidth="3.5" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={urgent ? '#ff4444' : '#00ff88'}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s' }}
      />
      <text
        x="26" y="26" textAnchor="middle" dominantBaseline="middle"
        fill={urgent ? '#ff4444' : '#fff'}
        fontSize="12" fontFamily="monospace" fontWeight="700"
        transform="rotate(90 26 26)"
      >
        {Math.ceil(remaining)}
      </text>
    </svg>
  )
}

// ─── Performance rating ───────────────────────────────────────────────────────
function getRating(level: number) {
  if (level >= 15) return { tier: 'Genius', emoji: '🧠', color: 'text-[#ffd700]', bg: 'bg-[#ffd70012]', border: 'border-[#ffd700]', desc: 'Top 1%. Exceptional working memory.' }
  if (level >= 12) return { tier: 'Expert', emoji: '⚡', color: 'text-[#00ff88]', bg: 'bg-[#00ff8812]', border: 'border-[#00ff88]', desc: 'Top 5%. Far above average recall.' }
  if (level >= 9)  return { tier: 'Advanced', emoji: '🚀', color: 'text-[#4fc3f7]', bg: 'bg-[#4fc3f712]', border: 'border-[#4fc3f7]', desc: 'Top 15%. Strong working memory.' }
  if (level >= 6)  return { tier: 'Good', emoji: '✅', color: 'text-[#81c784]', bg: 'bg-[#81c78412]', border: 'border-[#81c784]', desc: 'Above average. Most reach level 5–7.' }
  if (level >= 4)  return { tier: 'Average', emoji: '👍', color: 'text-[#ffb74d]', bg: 'bg-[#ffb74d12]', border: 'border-[#ffb74d]', desc: 'Around the global average score.' }
  return { tier: 'Beginner', emoji: '🌱', color: 'text-[#888]', bg: 'bg-[#88888812]', border: 'border-[#555]', desc: 'Just starting out — keep practicing!' }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MemoryTest() {
  const { isPlaying, startGame, endGame, updateScore, score } = useGameStore()

  const [sequence, setSequence] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeCell, setActiveCell] = useState<number | null>(null)
  const [results, setResults] = useState<MemoryResults | null>(null)
  const [lives, setLives] = useState(MAX_LIVES)
  const [streak, setStreak] = useState(0)
  const [showStreakPop, setShowStreakPop] = useState(false)
  const [ripples, setRipples] = useState<Record<number, boolean>>({})
  const [wrongCell, setWrongCell] = useState<number | null>(null)

  // Input countdown
  const [inputTimeLeft, setInputTimeLeft] = useState(8)
  const [inputTimeTotal, setInputTimeTotal] = useState(8)
  const inputTimerRef = useRef<NodeJS.Timeout | null>(null)

  const levelStartRef = useRef<number | null>(null)
  const levelTimingsRef = useRef<LevelTiming[]>([])
  const totalTilesRef = useRef(0)
  const streakRef = useRef(0)
  const streakMaxRef = useRef(0)
  const livesRef = useRef(MAX_LIVES)
  const sequenceRef = useRef<number[]>([])

  // ── Audio (optional soft tones) ───────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null)
  function playTone(freq: number, duration = 0.12, type: OscillatorType = 'sine') {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch { /* non-fatal */ }
  }

  // Play a note per tile index during showing phase
  const tileNotes = [261, 294, 330, 349, 392, 440, 494, 523, 587]

  // ── Input countdown timer ─────────────────────────────────────────
  const clearInputTimer = useCallback(() => {
    if (inputTimerRef.current) clearInterval(inputTimerRef.current)
  }, [])

  const startInputTimer = useCallback((level: number) => {
    clearInputTimer()
    const total = getInputTimeSec(level)
    setInputTimeTotal(total)
    setInputTimeLeft(total)
    const interval = 0.1
    let remaining = total
    inputTimerRef.current = setInterval(() => {
      remaining -= interval
      if (remaining <= 0) {
        clearInterval(inputTimerRef.current!)
        setInputTimeLeft(0)
        // Time's up — treat as wrong
        handleTimeUp()
      } else {
        setInputTimeLeft(remaining)
      }
    }, interval * 1000)
  }, [clearInputTimer]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate next round ───────────────────────────────────────────
  const generateNextRound = useCallback((prev: number[]) => {
    const next = [...prev, Math.floor(Math.random() * 9)]
    setSequence(next)
    sequenceRef.current = next
    setUserInput([])
    setPhase('showing')
    clearInputTimer()
  }, [clearInputTimer])

  // ── Time's up handler ─────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    // Treat as a wrong click without a specific cell
    const newLives = livesRef.current - 1
    livesRef.current = newLives
    setLives(newLives)
    streakRef.current = 0
    setStreak(0)
    clearInputTimer()

    if (newLives <= 0) {
      const seq = sequenceRef.current
      const finalScore = Math.max(0, seq.length - 3)
      updateScore(finalScore)
      levelTimingsRef.current.push({ level: seq.length - 2, timeMs: 0, failed: true })
      finishGame(finalScore)
    } else {
      setPhase('lifeLost')
      setTimeout(() => {
        // Replay same sequence
        setUserInput([])
        setPhase('showing')
      }, 1200)
    }
  }, [clearInputTimer, updateScore]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sequence flash effect ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'showing') return
    let i = 0
    let cancelled = false
    const flashMs = getFlashMs(sequence.length)
    const onMs = Math.round(flashMs * 0.65)
    const offMs = Math.round(flashMs * 0.35)

    const flash = () => {
      if (cancelled) return
      if (i >= sequence.length) {
        setActiveCell(null)
        setPhase('input')
        return
      }
      setActiveCell(null)
      setTimeout(() => {
        if (cancelled) return
        const cellIdx = sequence[i]
        setActiveCell(cellIdx)
        playTone(tileNotes[cellIdx] ?? 440, onMs / 1000)
        i++
        setTimeout(flash, onMs)
      }, offMs)
    }

    const t = setTimeout(flash, 500)
    return () => { cancelled = true; clearTimeout(t) }
  }, [phase, sequence]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start input timer when entering input phase ───────────────────
  useEffect(() => {
    if (phase === 'input') {
      levelStartRef.current = performance.now()
      startInputTimer(sequence.length)
    }
  }, [phase, sequence.length, startInputTimer])

  // ── Finish game helper ────────────────────────────────────────────
  const finishGame = useCallback((finalLevel: number) => {
    clearInputTimer()
    setPhase('fail')
    const timings = [...levelTimingsRef.current]
    const total = totalTilesRef.current
    const successful = timings.filter((t) => !t.failed)
    const avgMs = successful.length > 0 ? Math.round(successful.reduce((s, t) => s + t.timeMs, 0) / successful.length) : 0
    const fastest = successful.length > 0 ? Math.min(...successful.map((t) => t.timeMs)) : 0
    const slowest = successful.length > 0 ? Math.max(...successful.map((t) => t.timeMs)) : 0
    setResults({
      levelTimings: timings,
      highestLevel: finalLevel,
      totalTilesCorrect: total,
      avgClearMs: avgMs,
      fastestMs: fastest,
      slowestMs: slowest,
      streakMax: streakMaxRef.current,
    })
    supabase.auth.getUser().then(({ data }) => { endGame(data.user?.id) })
  }, [clearInputTimer, endGame])

  // ── Cell click handler ────────────────────────────────────────────
  const handleCellClick = (idx: number) => {
    if (phase !== 'input') return

    // Ripple animation
    setRipples((prev) => ({ ...prev, [idx]: true }))
    setTimeout(() => setRipples((prev) => ({ ...prev, [idx]: false })), 400)

    playTone(tileNotes[idx] ?? 440, 0.1)

    const newInput = [...userInput, idx]
    setUserInput(newInput)
    const pos = newInput.length - 1
    const elapsed = levelStartRef.current ? Math.round(performance.now() - levelStartRef.current) : 0

    if (newInput[pos] !== sequence[pos]) {
      // Wrong tap
      clearInputTimer()
      setWrongCell(idx)
      playTone(120, 0.25, 'sawtooth')
      setTimeout(() => setWrongCell(null), 600)

      const newLives = livesRef.current - 1
      livesRef.current = newLives
      setLives(newLives)
      streakRef.current = 0
      setStreak(0)

      // Level shown to user = sequence.length - 2 (we start at 3 tiles = Level 1)
      levelTimingsRef.current.push({ level: sequence.length - 2, timeMs: elapsed, failed: true })

      if (newLives <= 0) {
        const finalScore = Math.max(0, sequence.length - 3)
        updateScore(finalScore)
        setActiveCell(sequence[pos])
        setTimeout(() => finishGame(finalScore), 800)
      } else {
        // Lose a life but continue — replay same sequence
        setPhase('lifeLost')
        setTimeout(() => {
          setUserInput([])
          setActiveCell(null)
          setPhase('showing')
        }, 1200)
      }
      return
    }

    totalTilesRef.current++

    if (newInput.length === sequence.length) {
      // Round complete!
      clearInputTimer()
      const newStreak = streakRef.current + 1
      streakRef.current = newStreak
      streakMaxRef.current = Math.max(streakMaxRef.current, newStreak)
      setStreak(newStreak)

      if (newStreak > 0 && newStreak % 3 === 0) {
        setShowStreakPop(true)
        setTimeout(() => setShowStreakPop(false), 1200)
      }

      levelTimingsRef.current.push({ level: sequence.length - 2, timeMs: elapsed, failed: false })
      updateScore(sequence.length - 2)
      setPhase('success')
      setTimeout(() => generateNextRound(sequence), 700)
    }
  }

  // ── Start / Reset ─────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    clearInputTimer()
    setSequence([])
    sequenceRef.current = []
    setUserInput([])
    setPhase('idle')
    setActiveCell(null)
    setResults(null)
    setLives(MAX_LIVES)
    livesRef.current = MAX_LIVES
    setStreak(0)
    streakRef.current = 0
    streakMaxRef.current = 0
    setShowStreakPop(false)
    setWrongCell(null)
    setRipples({})
    levelStartRef.current = null
    levelTimingsRef.current = []
    totalTilesRef.current = 0
    startGame()
    // Research: start at 3 tiles — 1 is too trivial, kills first-impression engagement
    setTimeout(() => generateNextRound([0, 0, 0].map(() => Math.floor(Math.random() * 9))), 400)
  }, [startGame, generateNextRound, clearInputTimer])

  // Enter to retry
  useEffect(() => {
    if (isPlaying || !results) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') handleStart() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, results, handleStart])

  // ── Cell style ────────────────────────────────────────────────────
  const getCellStyle = (idx: number): React.CSSProperties => {
    const colors = TILE_COLORS[idx]
    const isActive = activeCell === idx && phase === 'showing'
    const isFail = wrongCell === idx
    const isRippling = ripples[idx]

    if (isActive) {
      return {
        background: colors.active,
        borderColor: colors.border,
        boxShadow: `0 0 28px ${colors.glow}, 0 0 8px ${colors.glow}`,
        transform: 'scale(1.06)',
      }
    }
    if (isFail) {
      return {
        background: '#ff444430',
        borderColor: '#ff4444',
        boxShadow: '0 0 24px rgba(255,68,68,0.5)',
      }
    }
    if (isRippling) {
      return {
        background: colors.active + '40',
        borderColor: colors.border,
        boxShadow: `0 0 16px ${colors.glow}`,
        transform: 'scale(0.96)',
      }
    }
    return {
      background: colors.idle,
      borderColor: phase === 'input' ? '#2a2a2a' : '#1e1e1e',
      animation: phase === 'idle' && isPlaying ? 'none' : undefined,
    }
  }

  // ─── Results Screen ───────────────────────────────────────────────
  if (results) {
    const chartData = results.levelTimings.map((t) => ({ level: t.level, timeMs: t.timeMs, failed: t.failed }))
    const avgLine = results.avgClearMs
    const rating = getRating(results.highestLevel)

    return (
      <div className="flex-1 px-5 py-8 max-w-7xl mx-auto w-full animate-results">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[#555] text-xs uppercase tracking-[0.2em] font-mono mb-1">Memory Test — Results</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-7xl font-bold text-[#00ff88] tabular-nums font-mono leading-none">{results.highestLevel}</span>
              <span className="text-2xl text-[#444] font-mono">levels</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border font-mono ${rating.color} ${rating.bg} ${rating.border}`}>
                <span>{rating.emoji}</span><span>{rating.tier}</span>
              </span>
            </div>
            <p className={`mt-2 text-xs font-mono ${rating.color} opacity-75`}>{rating.desc}</p>
          </div>
          <ResultsActions
            onRetry={handleStart}
            shareText={`BrainyPulse Memory: Level ${results.highestLevel} (${rating.tier}) | ${results.totalTilesCorrect} tiles correct — brainypulse.com`}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          <div className="lg:w-[70%]">
            <div className="bg-[#111213] border border-[#222] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">Recall speed per level</p>
                <div className="flex gap-3 text-[9px] font-mono text-[#555]">
                  <span><span className="text-[#00ff88]">■</span> Cleared</span>
                  <span><span className="text-[#ff4444]">■</span> Failed</span>
                  <span><span className="text-[#f1c40f]">---</span> Avg</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="#1c1c1c" vertical={false} />
                    <XAxis dataKey="level" tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} label={{ value: 'level', position: 'insideBottom', offset: -2, fill: '#444', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} unit="ms" />
                    <Tooltip content={<ChartTooltip />} />
                    {avgLine > 0 && (
                      <ReferenceLine y={avgLine} stroke="#f1c40f" strokeDasharray="4 4" strokeOpacity={0.6}
                        label={{ value: `avg ${avgLine}ms`, fill: '#f1c40f', fontSize: 9, fontFamily: 'monospace', position: 'right' }}
                      />
                    )}
                    <Bar dataKey="timeMs" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1200} name="Time">
                      {chartData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.failed ? '#ff4444' : '#00ff88'} opacity={entry.failed ? 0.9 : 0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="lg:w-[30%] flex flex-col gap-3">
            {/* Rating card */}
            <div className={`rounded-xl p-4 border ${rating.bg} ${rating.border}`}>
              <div className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono mb-2">Performance</div>
              <div className={`text-2xl font-bold font-mono flex items-center gap-2 ${rating.color}`}>
                <span className="text-3xl">{rating.emoji}</span><span>{rating.tier}</span>
              </div>
              <p className="text-[#666] text-[10px] font-mono mt-2 leading-relaxed">{rating.desc}</p>
              {/* Level benchmark bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[8px] font-mono text-[#444] mb-1">
                  <span>1</span><span>4</span><span>6</span><span>9</span><span>12</span><span>15+</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (results.highestLevel / 15) * 100)}%`, background: `linear-gradient(90deg, #555 0%, ${rating.color.replace('text-[', '').replace(']', '')} 100%)` }}
                  />
                </div>
                <div className="text-[8px] font-mono text-[#444] mt-1 text-right">Global avg ≈ level 5–6</div>
              </div>
              {/* Tier table */}
              <div className="mt-3 pt-3 border-t border-[#1e1e1e] space-y-1">
                {[
                  { emoji: '🧠', tier: 'Genius',   range: '15+',  color: 'text-[#ffd700]' },
                  { emoji: '⚡', tier: 'Expert',   range: '12–14', color: 'text-[#00ff88]' },
                  { emoji: '🚀', tier: 'Advanced', range: '9–11', color: 'text-[#4fc3f7]' },
                  { emoji: '✅', tier: 'Good',     range: '6–8',  color: 'text-[#81c784]' },
                  { emoji: '👍', tier: 'Average',  range: '4–5',  color: 'text-[#ffb74d]' },
                  { emoji: '🌱', tier: 'Beginner', range: '1–3',  color: 'text-[#888]'   },
                ].map((t) => (
                  <div key={t.tier} className={`flex items-center justify-between font-mono text-[9px] ${t.tier === rating.tier ? 'opacity-100' : 'opacity-40'}`}>
                    <span className={`flex items-center gap-1.5 font-semibold ${t.color}`}>
                      {t.tier === rating.tier && <span>▶</span>}
                      <span>{t.emoji} {t.tier}</span>
                    </span>
                    <span className="text-[#555]">Lv {t.range}</span>
                  </div>
                ))}
              </div>
            </div>

            <StatCard label="Highest Level" value={results.highestLevel} accent large />
            <StatCard label="Tiles Correct" value={results.totalTilesCorrect} />
            <StatCard label="Best Streak" value={`${results.streakMax}×`} />
            <div className="bg-[#161618] border border-[#222] rounded-xl p-4 space-y-3">
              <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">Speed Breakdown</p>
              {[
                { label: 'Fastest Round', value: results.fastestMs > 0 ? `${results.fastestMs} ms` : '—', color: 'text-[#00ff88]' },
                { label: 'Slowest Round', value: results.slowestMs > 0 ? `${results.slowestMs} ms` : '—', color: 'text-[#ff4444]' },
                { label: 'Avg Clear Time', value: results.avgClearMs > 0 ? `${results.avgClearMs} ms` : '—', color: 'text-white' },
                { label: 'Levels Cleared', value: results.levelTimings.filter((t) => !t.failed).length, color: 'text-[#888]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#666]">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Playing / Idle Screen ────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8 select-none">

      {/* ── Top bar: score | lives | streak ───────────────────── */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-3xl font-bold tabular-nums text-[#00ff88] font-mono">{score}</div>
          <div className="text-[#555] text-[9px] uppercase tracking-widest font-mono">level</div>
        </div>
        <Lives lives={lives} max={MAX_LIVES} />
        <div className="text-center min-w-[48px]">
          <div className={`text-3xl font-bold tabular-nums font-mono transition-colors ${streak >= 3 ? 'text-[#ffb74d]' : 'text-white'}`}>
            {streak > 0 ? `${streak}×` : '—'}
          </div>
          <div className="text-[#555] text-[9px] uppercase tracking-widest font-mono">streak</div>
        </div>
      </div>

      {/* ── Streak popup ──────────────────────────────────────── */}
      <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${showStreakPop ? 'opacity-100 -translate-y-2' : 'opacity-0 translate-y-0'}`}>
        <div className="bg-[#ffb74d] text-black font-bold font-mono text-sm px-4 py-1.5 rounded-full shadow-2xl">
          🔥 {streak}× Streak!
        </div>
      </div>

      {/* ── Phase status + countdown ──────────────────────────── */}
      <div className="flex items-center gap-4 h-14">
        {phase === 'showing' && (
          <div className="flex flex-col items-center gap-1 animate-pulse">
            <span className="text-sm font-mono text-[#888]">Watch the sequence…</span>
            <span className="text-[#555] text-[10px] font-mono uppercase tracking-widest">Level {sequence.length - 2} · {sequence.length} {sequence.length === 1 ? 'tile' : 'tiles'}</span>
          </div>
        )}
        {phase === 'input' && (
          <div className="flex items-center gap-3">
            <CountdownRing total={inputTimeTotal} remaining={inputTimeLeft} />
            <div>
              <span className="text-white font-mono text-sm">
                Repeat <span className="text-[#00ff88] font-bold">{sequence.length}</span> tiles · <span className="text-[#555]">Level {sequence.length - 2}</span>
              </span>
              <div className="text-[#555] text-[10px] font-mono mt-0.5">
                {userInput.length}/{sequence.length} entered
              </div>
            </div>
          </div>
        )}
        {phase === 'lifeLost' && (
          <span className="text-[#ff4444] font-medium font-mono text-sm animate-pulse">
            ❌ Wrong! −1 life · Replaying…
          </span>
        )}
        {phase === 'success' && (
          <span className="text-[#00ff88] font-medium font-mono text-sm">
            ✓ Level {sequence.length - 2} cleared! Next…
          </span>
        )}
        {phase === 'fail' && (
          <span className="text-[#ff4444] font-medium font-mono text-sm">
            Game over — reached level {Math.max(0, sequence.length - 2)}
          </span>
        )}
        {phase === 'idle' && !isPlaying && (
          <span className="text-[#555] font-mono text-xs">Ready when you are</span>
        )}
      </div>

      {/* ── 3×3 Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={phase !== 'input'}
            aria-label={`Tile ${i + 1}`}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 transition-all duration-150"
            style={getCellStyle(i)}
          />
        ))}
      </div>

      {/* ── Progress dots (how far into sequence user has entered) */}
      {phase === 'input' && sequence.length > 0 && (
        <div className="flex gap-1.5 flex-wrap justify-center max-w-[220px]">
          {sequence.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-150 ${
                i < userInput.length
                  ? 'bg-[#00ff88] scale-110'
                  : 'bg-[#2a2a2a]'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Start button ──────────────────────────────────────── */}
      {!isPlaying && phase === 'idle' && (
        <div className="flex flex-col items-center gap-3 mt-2">
          <button
            id="memory-start-btn"
            onClick={handleStart}
            className="px-8 py-3 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-all text-sm font-medium"
          >
            Start Game
          </button>
          <div className="text-center space-y-1">
            <p className="text-[#555] text-xs font-mono">Watch the tiles flash, then repeat the pattern.</p>
            <p className="text-[#444] text-xs font-mono">You have ❤️ ❤️ ❤️ 3 lives — wrong taps cost a life.</p>
            <p className="text-[#333] text-xs font-mono">Speed increases every 3 levels.</p>
          </div>
        </div>
      )}
    </div>
  )
}
