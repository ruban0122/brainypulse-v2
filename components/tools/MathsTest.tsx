'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { useGameStore } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'

type Op = '+' | '-' | '×'

function generateQuestion(): { display: string; answer: number } {
  const ops: Op[] = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  switch (op) {
    case '+': {
      const a = Math.floor(Math.random() * 90) + 10
      const b = Math.floor(Math.random() * 90) + 10
      return { display: `${a} + ${b}`, answer: a + b }
    }
    case '-': {
      const a = Math.floor(Math.random() * 90) + 10
      const b = Math.floor(Math.random() * (a - 1)) + 1
      return { display: `${a} − ${b}`, answer: a - b }
    }
    case '×': {
      const a = Math.floor(Math.random() * 11) + 2
      const b = Math.floor(Math.random() * 11) + 2
      return { display: `${a} × ${b}`, answer: a * b }
    }
  }
}

interface QuestionLog {
  idx: number
  display: string
  timeSec: number
}

interface MathsResults {
  questionLog: QuestionLog[]
  totalCorrect: number
  cpm: number
  hardestQuestion: QuestionLog | null
  avgTimeSec: number
}

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
        {unit && <span className="text-sm text-[#555] ml-1.5 font-normal">{unit}</span>}
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
  payload?: Array<{ color: string; name: string; value: number; payload?: QuestionLog }>
  label?: string | number
}) {
  if (active && payload && payload.length) {
    const entry = payload[0]?.payload
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono shadow-2xl max-w-[180px]">
        <p className="text-[#666] mb-1">Q{label}</p>
        {entry?.display && (
          <p className="text-white font-bold mb-1">{entry.display}</p>
        )}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}s</span>
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
          Try Again <span className="text-[#333] text-xs">(Enter)</span>
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

export default function MathsTest() {
  const { isPlaying, startGame, endGame, updateScore, decrementTimer, timeLeft, score } =
    useGameStore()

  const [qa, setQa] = useState(generateQuestion)
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [results, setResults] = useState<MathsResults | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasEndedRef = useRef(false)
  const qStartRef = useRef<number>(0)
  const questionLogRef = useRef<QuestionLog[]>([])
  const qaDisplayRef = useRef(qa.display)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const wrongTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ── Sound helpers ──────────────────────────────────────────────────
  function playErrorSound() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()
      
      // Soft descending dual-tone for error
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc1.type = 'triangle'
      osc2.type = 'sine'
      
      osc1.frequency.setValueAtTime(250, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2)
      
      osc2.frequency.setValueAtTime(200, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      
      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.2)
      osc2.stop(ctx.currentTime + 0.2)
    } catch { /* non-fatal */ }
  }

  function playCorrectSound() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()
      
      // Cheerful ascending chime (major third)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      const gain2 = ctx.createGain()
      
      osc1.type = 'sine'
      osc2.type = 'sine'
      
      // First note
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      
      // Second note
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
      gain2.gain.setValueAtTime(0, ctx.currentTime)
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.08)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

      osc1.connect(gain1)
      osc2.connect(gain2)
      gain1.connect(ctx.destination)
      gain2.connect(ctx.destination)
      
      osc1.start(ctx.currentTime)
      osc2.start(ctx.currentTime + 0.08)
      osc1.stop(ctx.currentTime + 0.15)
      osc2.stop(ctx.currentTime + 0.4)
    } catch { /* non-fatal */ }
  }

  const handleStart = () => {
    const first = generateQuestion()
    setQa(first)
    qaDisplayRef.current = first.display
    setInput('')
    setFlash(null)
    setResults(null)
    hasEndedRef.current = false
    questionLogRef.current = []
    qStartRef.current = performance.now()
    if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
    startGame()
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => decrementTimer(), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, decrementTimer])

  useEffect(() => {
    if (timeLeft === 0 && !isPlaying && !hasEndedRef.current) {
      hasEndedRef.current = true
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
      const log = [...questionLogRef.current]
      const total = log.length
      const avgTime =
        total > 0
          ? parseFloat((log.reduce((s, q) => s + q.timeSec, 0) / total).toFixed(2))
          : 0
      const hardest =
        total > 0 ? log.reduce((max, q) => (q.timeSec > max.timeSec ? q : max)) : null
      setResults({
        questionLog: log,
        totalCorrect: total,
        cpm: total,
        hardestQuestion: hardest,
        avgTimeSec: avgTime,
      })
      supabase.auth.getUser().then(({ data }) => {
        endGame(data.user?.id)
      })
    }
  }, [timeLeft, isPlaying, endGame])

  useEffect(() => {
    if (isPlaying || !results) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Auto-evaluate wrong answers after a short delay of typing inactivity
  useEffect(() => {
    if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
    
    if (input !== '' && input !== '-' && flash !== 'correct' && flash !== 'wrong') {
      const typed = Number(input)
      if (typed !== qa.answer) {
        wrongTimeoutRef.current = setTimeout(() => {
          playErrorSound()
          setFlash('wrong')
          setTimeout(() => {
            setInput('')
            setFlash(null)
            inputRef.current?.focus()
          }, 500)
        }, 700) // 700ms delay after typing stops
      }
    }
    
    return () => {
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
    }
  }, [input, qa.answer, flash])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (flash === 'wrong') return          // block input during shake
    const raw = e.target.value.replace(/[^0-9-]/g, '')
    setInput(raw)
    if (raw === '' || raw === '-') return

    const typed = Number(raw)

    if (typed === qa.answer) {
      // ✅ Correct
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
      const timeSec = parseFloat(
        ((performance.now() - qStartRef.current) / 1000).toFixed(2)
      )
      questionLogRef.current.push({
        idx: questionLogRef.current.length + 1,
        display: qaDisplayRef.current,
        timeSec,
      })
      updateScore(questionLogRef.current.length)
      playCorrectSound()
      setFlash('correct')
      const next = generateQuestion()
      setTimeout(() => {
        setQa(next)
        qaDisplayRef.current = next.display
        setInput('')
        setFlash(null)
        qStartRef.current = performance.now()
        inputRef.current?.focus()
      }, 180)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Also allow Enter key to submit and get wrong feedback immediately
    if (e.key === 'Enter' && input !== '' && input !== '-') {
      const typed = Number(input)
      if (typed !== qa.answer) {
        e.preventDefault()
        playErrorSound()
        setFlash('wrong')
        setTimeout(() => {
          setInput('')
          setFlash(null)
          inputRef.current?.focus()
        }, 500)
      }
    }
  }

  // ─── Results Screen ───────────────────────────────────────────────
  if (results) {
    const chartData = results.questionLog.map((q) => ({
      ...q,
      label: `Q${q.idx}`,
    }))
    const avgLine = results.avgTimeSec
    const maxTime = Math.max(...results.questionLog.map((q) => q.timeSec), 1)

    return (
      <div className="flex-1 px-5 py-8 max-w-7xl mx-auto w-full animate-results">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[#555] text-xs uppercase tracking-[0.2em] font-mono mb-1">
              Maths Test — Results
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-7xl font-bold text-[#00ff88] tabular-nums font-mono leading-none">
                {results.totalCorrect}
              </span>
              <span className="text-2xl text-[#444] font-mono">correct</span>
              <span className="text-lg text-[#555] font-mono">{results.cpm} cpm</span>
            </div>
          </div>
          <ResultsActions
            onRetry={handleStart}
            shareText={`BrainyPulse Maths: ${results.totalCorrect} correct | ${results.cpm} CPM — brainypulse.com`}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* ── Chart 70% ── */}
          <div className="lg:w-[70%]">
            <div className="bg-[#111213] border border-[#222] rounded-xl p-5">
              <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono mb-4">
                Solve velocity — seconds per question
              </p>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 4, right: 16, bottom: 4, left: -10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#1c1c1c"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="idx"
                        tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: 'question',
                          position: 'insideBottom',
                          offset: -2,
                          fill: '#444',
                          fontSize: 10,
                        }}
                      />
                      <YAxis
                        domain={[0, maxTime + 1]}
                        tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        unit="s"
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine
                        y={avgLine}
                        stroke="#f1c40f"
                        strokeDasharray="4 4"
                        strokeOpacity={0.6}
                        label={{
                          value: `avg ${avgLine}s`,
                          fill: '#f1c40f',
                          fontSize: 9,
                          fontFamily: 'monospace',
                          position: 'right',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="timeSec"
                        stroke="#00ff88"
                        strokeWidth={2}
                        dot={{ fill: '#00ff88', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#00ff88' }}
                        isAnimationActive
                        animationDuration={1400}
                        name="Sec"
                      />
                      <Scatter
                        dataKey="timeSec"
                        fill="transparent"
                        shape={() => <g />}
                        name="detail"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#555] text-sm font-mono">
                    No questions solved
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats 30% ── */}
          <div className="lg:w-[30%] flex flex-col gap-3">
            <StatCard label="Total Correct" value={results.totalCorrect} accent large />
            <StatCard label="Calculations / min" value={results.cpm} unit="cpm" />
            <StatCard label="Avg Solve Time" value={`${results.avgTimeSec}`} unit="sec" />
            <div className="bg-[#161618] border border-[#222] rounded-xl p-4 space-y-3">
              <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">
                Hardest Problem
              </p>
              {results.hardestQuestion ? (
                <>
                  <p className="text-white font-mono font-bold text-lg">
                    {results.hardestQuestion.display}
                  </p>
                  <p className="text-[#888] text-xs font-mono">
                    Took{' '}
                    <span className="text-[#ff4444] font-bold">
                      {results.hardestQuestion.timeSec}s
                    </span>{' '}
                    to solve
                  </p>
                  <p className="text-[#555] text-xs font-mono">
                    Q{results.hardestQuestion.idx} of {results.totalCorrect}
                  </p>
                </>
              ) : (
                <p className="text-[#555] text-sm font-mono">—</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Playing / Idle Screen ────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="flex gap-12 font-mono">
        <div className="text-center">
          <div
            className={`text-4xl font-bold tabular-nums transition-colors ${
              timeLeft <= 10 ? 'text-[#ff4444]' : 'text-[#00ff88]'
            }`}
          >
            {timeLeft}
          </div>
          <div className="text-[#555] text-xs mt-1 uppercase tracking-widest">sec</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold tabular-nums">{score}</div>
          <div className="text-[#555] text-xs mt-1 uppercase tracking-widest">correct</div>
        </div>
      </div>

      {isPlaying ? (
        <div className="flex flex-col items-center gap-6">
          <div
            className={`text-5xl sm:text-6xl font-mono font-bold transition-colors duration-150 ${
              flash === 'correct' ? 'text-[#00ff88]' : 'text-white'
            }`}
          >
            {qa.display} =
          </div>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`bg-transparent border-b-2 outline-none text-center text-5xl font-mono w-48 pb-2 transition-colors duration-150 ${
              flash === 'wrong'
                ? 'border-[#ff4444] text-[#ff4444] animate-shake'
                : flash === 'correct'
                ? 'border-[#00ff88] text-[#00ff88]'
                : 'border-[#333] focus:border-[#00ff88] text-white'
            }`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="text-[#555] text-xs">Type answer — advances automatically</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium"
          >
            Start
          </button>
          <p className="text-[#555] text-xs text-center max-w-xs">
            Solve arithmetic problems. Type the answer — it advances the moment you&apos;re
            correct. No submit button needed.
          </p>
        </div>
      )}
    </div>
  )
}
