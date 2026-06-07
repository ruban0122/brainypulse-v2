'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { useGameStore } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'

// ─── Word List ────────────────────────────────────────────────────────────────
const WORD_LIST = [
  'the', 'fox', 'dog', 'cat', 'sky', 'sun', 'moon', 'star', 'tree', 'oak',
  'run', 'fly', 'sit', 'go', 'see', 'say', 'get', 'set', 'put', 'cut',
  'big', 'old', 'new', 'hot', 'cold', 'fast', 'slow', 'long', 'hard', 'soft',
  'day', 'way', 'man', 'top', 'end', 'it', 'to', 'of', 'in', 'on',
  'up', 'at', 'so', 'do', 'go', 'by', 'no', 'we', 'if', 'or',
  'box', 'key', 'map', 'cup', 'car', 'red', 'blue', 'gray', 'dark', 'pink',
  'jump', 'drop', 'plan', 'fact', 'code', 'text', 'word', 'line', 'time', 'game',
  'type', 'rate', 'test', 'beat', 'mind', 'work', 'take', 'make', 'turn', 'look',
  'back', 'left', 'down', 'read', 'send', 'find', 'open', 'keep', 'live', 'move',
]

function generateText(wordCount = 40): string {
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)])
  }
  return words.join(' ')
}

// ─── Timer Options ────────────────────────────────────────────────────────────
const TIMER_OPTIONS = [15, 30, 60, 120] as const
type TimerOption = (typeof TIMER_OPTIONS)[number]

import { SOUNDS, type SoundDef } from '@/lib/typing-sounds'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WpmSnapshot {
  sec: number
  wpm: number
  acc: number
  hasError: boolean
}

interface TypingResults {
  wpmHistory: WpmSnapshot[]
  netWpm: number
  finalAcc: number
  totalChars: number
  correctChars: number
  errorCount: number
  duration: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  accent,
  large,
}: {
  label: string
  value: string | number
  unit?: string
  accent?: boolean
  large?: boolean
}) {
  return (
    <div className="bg-[#161618] border border-[#222] rounded-xl p-4">
      <div className="text-[#555] text-[10px] uppercase tracking-[0.15em] mb-1.5 font-mono">
        {label}
      </div>
      <div
        className={`font-bold tabular-nums font-mono ${
          large ? 'text-5xl' : 'text-2xl'
        } ${accent ? 'text-[#00ff88]' : 'text-white'}`}
      >
        {value}
        {unit && (
          <span className="text-sm text-[#555] ml-1.5 font-normal">{unit}</span>
        )}
      </div>
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string | number
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono shadow-2xl">
        <p className="text-[#666] mb-1">t = {label}s</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

function ResultsActions({
  onRetry,
  shareText,
}: {
  onRetry: () => void
  shareText: string
}) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-5 items-center text-sm font-mono">
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-[#888] hover:text-[#00ff88] transition-colors"
      >
        <span>↺</span>
        <span>
          Try Again{' '}
          <span className="text-[#333] text-xs">(Enter)</span>
        </span>
      </button>
      <Link
        href="/leaderboard"
        className="flex items-center gap-2 text-[#888] hover:text-[#00ff88] transition-colors"
      >
        <span>⊞</span>
        <span>Leaderboard</span>
      </Link>
      <button
        onClick={handleShare}
        className={`flex items-center gap-2 transition-colors ${
          copied ? 'text-[#00ff88]' : 'text-[#888] hover:text-[#00ff88]'
        }`}
      >
        <span>{copied ? '✓' : '⇪'}</span>
        <span>{copied ? 'Copied!' : 'Share Result'}</span>
      </button>
    </div>
  )
}

// ─── Sound Toggle & Picker ─────────────────────────────────────────────────
function SoundControls({
  soundOn,
  selectedSound,
  onToggle,
  onSelect,
  onPreview,
}: {
  soundOn: boolean
  selectedSound: string
  onToggle: () => void
  onSelect: (id: string) => void
  onPreview: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Row: toggle label */}
      <div className="flex items-center justify-between">
        <span className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">
          Keyboard Sound
        </span>
        {/* Toggle pill */}
        <button
          id="sound-toggle"
          onClick={onToggle}
          aria-label={soundOn ? 'Disable sound' : 'Enable sound'}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none ${
            soundOn ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
              soundOn ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Sound grid — shown only when sound is on */}
      {soundOn && (
        <div className="grid grid-cols-5 gap-1.5">
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); onPreview(s.id) }}
              title={s.label}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 px-1 text-center transition-all border ${
                selectedSound === s.id
                  ? 'border-[#00ff88] bg-[#00ff8812] text-[#00ff88]'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#666] hover:border-[#444] hover:text-[#888]'
              }`}
            >
              <span className="text-sm leading-none">{s.icon}</span>
              <span className="text-[10px] font-mono leading-tight truncate w-full text-center">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Timer Picker ──────────────────────────────────────────────────────────
function TimerPicker({
  selected,
  disabled,
  onChange,
}: {
  selected: TimerOption
  disabled: boolean
  onChange: (t: TimerOption) => void
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">
        Timer Duration
      </span>
      <div className="flex gap-1.5">
        {TIMER_OPTIONS.map((t) => (
          <button
            key={t}
            disabled={disabled}
            onClick={() => onChange(t)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-mono font-semibold border transition-all ${
              selected === t
                ? 'border-[#00ff88] bg-[#00ff8812] text-[#00ff88]'
                : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#555] hover:border-[#444] hover:text-[#888] disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {t}s
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TypingTest() {
  const { isPlaying, startGame, endGame, updateScore, decrementTimer, timeLeft, score, accuracy } =
    useGameStore()

  // ── Local state ────────────────────────────────────────────────────
  const [text, setText] = useState(() => generateText())
  const [typed, setTyped] = useState('')
  const [errors, setErrors] = useState<Set<number>>(new Set())
  const [results, setResults] = useState<TypingResults | null>(null)

  // Timer
  const [selectedTimer, setSelectedTimer] = useState<TimerOption>(60)

  // Sound
  const [soundOn, setSoundOn] = useState(true)
  const [selectedSound, setSelectedSound] = useState<string>('cherry')
  const audioCtxRef = useRef<AudioContext | null>(null)

  // ── Refs ───────────────────────────────────────────────────────────
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const hasEndedRef = useRef(false)
  const elapsedSecsRef = useRef(0)
  const currentWpmRef = useRef(0)
  const currentAccRef = useRef(100)
  const errorThisSecRef = useRef(false)
  const wpmSnapshotsRef = useRef<WpmSnapshot[]>([])
  const typedRef = useRef('')
  const errorsRef = useRef<Set<number>>(new Set())
  const selectedTimerRef = useRef<TimerOption>(60)
  const soundOnRef = useRef(true)
  const selectedSoundRef = useRef('cherry')

  // Keep sound refs in sync
  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])
  useEffect(() => { selectedSoundRef.current = selectedSound }, [selectedSound])
  useEffect(() => { selectedTimerRef.current = selectedTimer }, [selectedTimer])

  // ── Audio helpers ──────────────────────────────────────────────────
  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  function playSound(isError: boolean) {
    if (!soundOnRef.current) return
    try {
      const ctx = getAudioCtx()
      const def = SOUNDS.find((s) => s.id === selectedSoundRef.current) ?? SOUNDS[0]
      def.play(ctx, isError)
    } catch {
      // audio errors are non-fatal
    }
  }

  function previewSound(id: string) {
    try {
      const ctx = getAudioCtx()
      const def = SOUNDS.find((s) => s.id === id) ?? SOUNDS[0]
      def.play(ctx, false)
    } catch {
      // non-fatal
    }
  }

  // ── Start / Reset ──────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (results !== null) {
      setText(generateText())
    }
    setTyped('')
    setErrors(new Set())
    setResults(null)
    hasEndedRef.current = false
    startTimeRef.current = null
    elapsedSecsRef.current = 0
    currentWpmRef.current = 0
    currentAccRef.current = 100
    errorThisSecRef.current = false
    wpmSnapshotsRef.current = []
    typedRef.current = ''
    errorsRef.current = new Set()
    startGame(selectedTimerRef.current)
  }, [results, startGame])

  // ── Countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        elapsedSecsRef.current++
        wpmSnapshotsRef.current.push({
          sec: elapsedSecsRef.current,
          wpm: currentWpmRef.current,
          acc: currentAccRef.current,
          hasError: errorThisSecRef.current,
        })
        errorThisSecRef.current = false
        decrementTimer()
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, decrementTimer])

  // ── Timer reaches 0 ───────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0 && !isPlaying && !hasEndedRef.current) {
      hasEndedRef.current = true
      const t = typedRef.current
      const correctCount = t.split('').filter((ch, i) => ch === text[i]).length
      setResults({
        wpmHistory: [...wpmSnapshotsRef.current],
        netWpm: score,
        finalAcc: accuracy,
        totalChars: t.length,
        correctChars: correctCount,
        errorCount: errorsRef.current.size,
        duration: selectedTimer,
      })
      supabase.auth.getUser().then(({ data }) => {
        endGame(data.user?.id)
      })
    }
  }, [timeLeft, isPlaying, text, score, accuracy, endGame, selectedTimer])

  // ── Key handler ────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Auto-start: if not playing and no results, start on printable key
      // then fall through so the first character is registered immediately.
      if (!isPlaying && !results) {
        if (
          e.key.length === 1 &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey
        ) {
          e.preventDefault()
          // Reset all tracking refs synchronously
          hasEndedRef.current = false
          startTimeRef.current = Date.now()
          elapsedSecsRef.current = 0
          currentWpmRef.current = 0
          currentAccRef.current = 100
          errorThisSecRef.current = false
          wpmSnapshotsRef.current = []
          typedRef.current = ''
          errorsRef.current = new Set()
          setTyped('')
          setErrors(new Set())
          startGame(selectedTimerRef.current)
          // ↓ fall through — don't return — so the first character is typed now
        } else {
          return
        }
      }

      if (!isPlaying && results) return
      if (e.key.length !== 1 && e.key !== 'Backspace') return
      e.preventDefault()

      if (!startTimeRef.current) startTimeRef.current = Date.now()

      // ── Backspace ────────────────────────────────────────────────────
      if (e.key === 'Backspace') {
        const prev = typedRef.current
        if (!prev.length) return
        const next = prev.slice(0, -1)
        typedRef.current = next
        setTyped(next)
        const s = new Set(errorsRef.current)
        s.delete(prev.length - 1)
        errorsRef.current = s
        setErrors(new Set(s))
        playSound(false)
        return
      }

      // ── Normal key ───────────────────────────────────────────────────
      const prev = typedRef.current
      const idx = prev.length
      const next = prev + e.key
      typedRef.current = next
      setTyped(next)

      const isErr = e.key !== text[idx]
      playSound(isErr)

      if (isErr) {
        errorThisSecRef.current = true
        const s = new Set(errorsRef.current).add(idx)
        errorsRef.current = s
        setErrors(new Set(s))
      }

      // WPM + accuracy
      const wordsTyped = next.trim().split(/\s+/).filter(Boolean).length
      const elapsed = startTimeRef.current
        ? (Date.now() - startTimeRef.current) / 60000
        : 1 / 60
      const liveWpm = Math.round(wordsTyped / elapsed)
      const correctChars = next.split('').filter((ch, i) => ch === text[i]).length
      const acc = Math.round((correctChars / next.length) * 100)
      currentWpmRef.current = liveWpm
      currentAccRef.current = acc
      updateScore(liveWpm, acc)

      // All characters typed — finish immediately
      if (next.length >= text.length && !hasEndedRef.current) {
        hasEndedRef.current = true
        if (timerRef.current) clearInterval(timerRef.current)
        const actualDuration = startTimeRef.current
          ? Math.round((Date.now() - startTimeRef.current) / 1000)
          : selectedTimerRef.current
        setResults({
          wpmHistory: [...wpmSnapshotsRef.current],
          netWpm: liveWpm,
          finalAcc: acc,
          totalChars: next.length,
          correctChars,
          errorCount: errorsRef.current.size,
          duration: actualDuration,
        })
        supabase.auth.getUser().then(({ data }) => {
          endGame(data.user?.id)
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPlaying, results, text, updateScore, endGame, startGame]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Enter to retry
  useEffect(() => {
    if (isPlaying || !results) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, results, handleStart])

  // ─── Performance rating helper ────────────────────────────────────
  function getRating(wpm: number, acc: number): {
    tier: string
    emoji: string
    color: string
    bg: string
    border: string
    description: string
  } {
    // Penalise bad accuracy: effective WPM drops
    const effective = wpm * (acc / 100)
    if (effective >= 100) return {
      tier: 'Master', emoji: '🏆', color: 'text-[#ffd700]', bg: 'bg-[#ffd70012]', border: 'border-[#ffd700]',
      description: 'Top 1% worldwide. Extraordinary speed and precision.',
    }
    if (effective >= 80) return {
      tier: 'Expert', emoji: '⚡', color: 'text-[#00ff88]', bg: 'bg-[#00ff8812]', border: 'border-[#00ff88]',
      description: 'Top 5%. You type faster than most professionals.',
    }
    if (effective >= 60) return {
      tier: 'Advanced', emoji: '🚀', color: 'text-[#4fc3f7]', bg: 'bg-[#4fc3f712]', border: 'border-[#4fc3f7]',
      description: 'Top 15%. Well above average — keep pushing!',
    }
    if (effective >= 40) return {
      tier: 'Good', emoji: '✅', color: 'text-[#81c784]', bg: 'bg-[#81c78412]', border: 'border-[#81c784]',
      description: 'Above average. Most people type around 40 WPM.',
    }
    if (effective >= 25) return {
      tier: 'Average', emoji: '👍', color: 'text-[#ffb74d]', bg: 'bg-[#ffb74d12]', border: 'border-[#ffb74d]',
      description: 'Around the global average. Practice makes perfect.',
    }
    return {
      tier: 'Beginner', emoji: '🌱', color: 'text-[#888]', bg: 'bg-[#88888812]', border: 'border-[#555]',
      description: 'Just starting out — everyone begins here. Keep going!',
    }
  }

  // ─── Results Screen ───────────────────────────────────────────────
  if (results) {
    const chartData = results.wpmHistory
    const maxWpm = Math.max(...chartData.map((d) => d.wpm), 10)
    const minAcc = Math.min(...chartData.map((d) => d.acc), 100)
    const accFloor = Math.max(0, Math.floor(minAcc / 10) * 10 - 10)
    const rating = getRating(results.netWpm, results.finalAcc)

    const customDot = (props: unknown) => {
      const p = props as { cx: number; cy: number; payload: WpmSnapshot }
      if (p.payload.hasError) {
        return (
          <circle
            key={`err-${p.payload.sec}`}
            cx={p.cx}
            cy={p.cy}
            r={5}
            fill="#ff4444"
            opacity={0.85}
          />
        )
      }
      return <g key={`dot-${p.payload.sec}`} />
    }

    return (
      <div className="flex-1 px-5 py-8 max-w-7xl mx-auto w-full animate-results">
        {/* Header row */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[#555] text-xs uppercase tracking-[0.2em] font-mono mb-1">
              Typing Test — Results
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-7xl font-bold text-[#00ff88] tabular-nums font-mono leading-none">
                {results.netWpm}
              </span>
              <span className="text-2xl text-[#444] font-mono">wpm</span>
              <span className="text-lg text-[#555] font-mono">
                {results.finalAcc}
                <span className="text-sm ml-0.5">%</span>
              </span>
              {/* Performance badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border font-mono ${
                  rating.color
                } ${rating.bg} ${rating.border}`}
              >
                <span>{rating.emoji}</span>
                <span>{rating.tier}</span>
              </span>
            </div>
            {/* Description */}
            <p className={`mt-2 text-xs font-mono ${rating.color} opacity-75`}>
              {rating.description}
            </p>
          </div>
          <ResultsActions
            onRetry={handleStart}
            shareText={`BrainyPulse Typing: ${results.netWpm} WPM | ${results.finalAcc}% acc (${rating.tier}) — brainypulse.com`}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* ── Chart panel 70% ── */}
          <div className="lg:w-[70%] space-y-4">
            {/* Combined WPM + Accuracy dual-axis chart */}
            <div className="bg-[#111213] border border-[#222] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">
                  Speed &amp; Accuracy over time
                </p>
                <div className="flex items-center gap-4 text-[10px] font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 bg-[#00ff88]" />
                    <span className="text-[#555]">WPM</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 bg-[#f1c40f]" style={{ borderTop: '2px dashed #f1c40f', background: 'none' }} />
                    <span className="text-[#555]">Accuracy %</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff4444]" />
                    <span className="text-[#555]">Error</span>
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 4, right: 48, bottom: 4, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 6" stroke="#1c1c1c" vertical={false} />
                    <XAxis
                      dataKey="sec"
                      tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: 'seconds', position: 'insideBottomRight', offset: -4, fill: '#333', fontSize: 9, fontFamily: 'monospace' }}
                    />
                    {/* Left Y axis — WPM */}
                    <YAxis
                      yAxisId="wpm"
                      domain={[0, Math.ceil((maxWpm + 15) / 10) * 10]}
                      tick={{ fill: '#00ff8866', fontSize: 9, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    {/* Right Y axis — Accuracy */}
                    <YAxis
                      yAxisId="acc"
                      orientation="right"
                      domain={[accFloor, 100]}
                      tick={{ fill: '#f1c40f66', fontSize: 9, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      width={36}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    {/* 100% accuracy reference line */}
                    <ReferenceLine yAxisId="acc" y={100} stroke="#f1c40f22" strokeDasharray="4 4" />
                    {/* WPM line */}
                    <Line
                      yAxisId="wpm"
                      type="monotone"
                      dataKey="wpm"
                      stroke="#00ff88"
                      strokeWidth={2.5}
                      dot={customDot}
                      activeDot={{ r: 4, fill: '#00ff88' }}
                      isAnimationActive
                      animationDuration={1400}
                      animationEasing="ease-out"
                      name="WPM"
                    />
                    {/* Accuracy line — dashed */}
                    <Line
                      yAxisId="acc"
                      type="monotone"
                      dataKey="acc"
                      stroke="#f1c40f"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      isAnimationActive
                      animationDuration={1600}
                      name="Acc %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[#333] text-[9px] font-mono mt-2">
                🔴 Red dots = seconds where you made at least one error
              </p>
            </div>
          </div>

          {/* ── Stats panel 30% ── */}
          <div className="lg:w-[30%] flex flex-col gap-3">
            {/* Rating card */}
            <div className={`rounded-xl p-4 border ${rating.bg} ${rating.border}`}>
              {/* Header with ⓘ */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">Performance</div>
                {/* Info button + popover */}
                <div className="relative group">
                  <button
                    className="w-4 h-4 rounded-full border border-[#444] text-[#555] text-[9px] font-bold font-mono flex items-center justify-center hover:border-[#00ff88] hover:text-[#00ff88] transition-colors focus:outline-none focus:border-[#00ff88] focus:text-[#00ff88]"
                    aria-label="Show tier breakdown"
                    tabIndex={0}
                  >
                    i
                  </button>
                  {/* Popover — shown on hover or focus-within */}
                  <div className="absolute right-0 bottom-6 z-50 w-64 rounded-xl border border-[#2a2a2a] bg-[#111213] p-3 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-150">
                    <p className="text-[#555] text-[9px] uppercase tracking-[0.15em] font-mono mb-2">Tier Breakdown</p>
                    <p className="text-[#444] text-[8px] font-mono mb-2.5">Based on effective WPM = WPM × accuracy</p>
                    <div className="space-y-1.5">
                      {[
                        { emoji: '🏆', tier: 'Master',   range: '100+',  color: 'text-[#ffd700]' },
                        { emoji: '⚡', tier: 'Expert',   range: '80–99', color: 'text-[#00ff88]' },
                        { emoji: '🚀', tier: 'Advanced', range: '60–79', color: 'text-[#4fc3f7]' },
                        { emoji: '✅', tier: 'Good',     range: '40–59', color: 'text-[#81c784]' },
                        { emoji: '👍', tier: 'Average',  range: '25–39', color: 'text-[#ffb74d]' },
                        { emoji: '🌱', tier: 'Beginner', range: '< 25',  color: 'text-[#888]'   },
                      ].map((t) => (
                        <div key={t.tier} className={`flex items-center justify-between font-mono text-[9px] ${t.tier === rating.tier ? 'opacity-100' : 'opacity-50'}`}>
                          <span className={`flex items-center gap-1.5 font-semibold ${t.color}`}>
                            {t.tier === rating.tier && (
                              <span className="text-[8px]">▶</span>
                            )}
                            <span>{t.emoji}</span>
                            <span>{t.tier}</span>
                          </span>
                          <span className="text-[#555]">{t.range} eff. WPM</span>
                        </div>
                      ))}
                    </div>
                    {/* little arrow */}
                    <div className="absolute -bottom-1.5 right-2 w-3 h-3 rotate-45 bg-[#111213] border-r border-b border-[#2a2a2a]" />
                  </div>
                </div>
              </div>
              <div className={`text-2xl font-bold font-mono flex items-center gap-2 ${rating.color}`}>
                <span className="text-3xl">{rating.emoji}</span>
                <span>{rating.tier}</span>
              </div>
              <p className="text-[#666] text-[10px] font-mono mt-2 leading-relaxed">{rating.description}</p>
              {/* WPM benchmark bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[8px] font-mono text-[#444] mb-1">
                  <span>0</span><span>40</span><span>60</span><span>80</span><span>100+</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (results.netWpm / 100) * 100)}%`,
                      background: `linear-gradient(90deg, #555 0%, ${rating.color.replace('text-[', '').replace(']', '')} 100%)`,
                    }}
                  />
                </div>
                <div className="text-[8px] font-mono text-[#444] mt-1 text-right">
                  Global avg ≈ 40 WPM
                </div>
              </div>
            </div>

            <StatCard label="Net WPM" value={results.netWpm} accent large />
            <StatCard label="Accuracy" value={`${results.finalAcc}%`} />
            <StatCard label="Duration" value={`${results.duration}`} unit="sec" />
            <div className="bg-[#161618] border border-[#222] rounded-xl p-4 space-y-3">
              <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">
                Character Breakdown
              </p>
              {[
                { label: 'Total Typed', value: results.totalChars, color: 'text-white' },
                { label: 'Correct', value: results.correctChars, color: 'text-[#00ff88]' },
                { label: 'Errors', value: results.errorCount, color: 'text-[#ff4444]' },
                {
                  label: 'Error Rate',
                  value:
                    results.totalChars > 0
                      ? `${Math.round((results.errorCount / results.totalChars) * 100)}%`
                      : '0%',
                  color: 'text-[#888]',
                },
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-3xl mx-auto w-full gap-6">

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="flex gap-12 text-sm font-mono">
        <div className="text-center">
          <div
            className={`text-4xl font-bold tabular-nums transition-colors ${
              timeLeft <= 10 && isPlaying ? 'text-[#ff4444]' : 'text-[#00ff88]'
            }`}
          >
            {isPlaying ? timeLeft : selectedTimer}
          </div>
          <div className="text-[#555] text-xs mt-1 uppercase tracking-widest">sec</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold tabular-nums">{score}</div>
          <div className="text-[#555] text-xs mt-1 uppercase tracking-widest">wpm</div>
        </div>
      </div>

      {/* ── Text display ──────────────────────────────────────────── */}
      <div
        className="font-mono text-lg leading-loose tracking-wide cursor-default select-none w-full"
        style={{ wordBreak: 'break-all' }}
      >
        {text.split('').map((char, i) => {
          let cls = 'text-[#444]'
          if (i < typed.length) {
            cls = errors.has(i) ? 'text-[#ff4444]' : 'text-white'
          } else if (i === typed.length) {
            cls = 'border-l-2 border-[#00ff88] text-[#666]'
          }
          return (
            <span key={i} className={`${cls} transition-colors duration-75`}>
              {char}
            </span>
          )
        })}
      </div>

      {/* ── Start / hint ──────────────────────────────────────────── */}
      {!isPlaying && (
        <div className="flex flex-col items-center gap-3">
          <button
            id="start-typing-btn"
            onClick={handleStart}
            className="px-8 py-3 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium"
          >
            Start Typing
          </button>
          <p className="text-[#555] text-xs">
            Or just start typing — it&apos;ll begin automatically
          </p>
        </div>
      )}

      {/* ── Settings row ──────────────────────────────────────────── */}
      <div className="w-full border-t border-[#1e1e1e] pt-5 flex flex-col gap-4">
        {/* Timer */}
        <TimerPicker
          selected={selectedTimer}
          disabled={isPlaying}
          onChange={(t) => setSelectedTimer(t)}
        />

        {/* Sound */}
        <SoundControls
          soundOn={soundOn}
          selectedSound={selectedSound}
          onToggle={() => setSoundOn((p) => !p)}
          onSelect={setSelectedSound}
          onPreview={previewSound}
        />
      </div>
    </div>
  )
}
