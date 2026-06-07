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

type Phase = 'idle' | 'waiting' | 'ready' | 'done' | 'toosoon'

interface Attempt {
  trial: number
  ms: number
  isFalseStart: boolean
}

interface ReactionResults {
  attempts: Attempt[]
  falseStarts: number
  best: number
  worst: number
  avg: number
  variance: number
}

function getRating(ms: number): string {
  if (ms < 150) return 'Superhuman'
  if (ms < 200) return 'Exceptional'
  if (ms < 270) return 'Great'
  if (ms < 350) return 'Average'
  if (ms < 500) return 'Slow'
  return 'Very slow'
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
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string | number
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono shadow-2xl">
        <p className="text-[#666] mb-1">Trial {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value} ms</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

function ResultsActions({
  onRetry,
  onNextAttempt,
  shareText,
}: {
  onRetry: () => void
  onNextAttempt: () => void
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
        onClick={onNextAttempt}
        className="flex items-center gap-2 text-[#00ff88] border border-[#00ff88] rounded-full px-4 py-1.5 hover:bg-[#00ff88] hover:text-black transition-colors"
      >
        + Next Attempt
      </button>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-[#888] hover:text-[#00ff88] transition-colors"
      >
        <span>↺</span>
        <span>
          Reset <span className="text-[#333] text-xs">(Enter)</span>
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

function buildResults(attempts: Attempt[], falseStarts: number): ReactionResults {
  const valid = attempts.filter((a) => !a.isFalseStart)
  const best = valid.length > 0 ? Math.min(...valid.map((a) => a.ms)) : 0
  const worst = valid.length > 0 ? Math.max(...valid.map((a) => a.ms)) : 0
  const avg =
    valid.length > 0
      ? Math.round(valid.reduce((s, a) => s + a.ms, 0) / valid.length)
      : 0
  const variance = worst - best
  return { attempts, falseStarts, best, worst, avg, variance }
}

export default function ReactionTest() {
  const { isPlaying, startGame, endGame, updateScore } = useGameStore()

  const [phase, setPhase] = useState<Phase>('idle')
  const [lastMs, setLastMs] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [falseStarts, setFalseStarts] = useState(0)
  const [results, setResults] = useState<ReactionResults | null>(null)

  const startRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const trialCountRef = useRef(0)
  const attemptsRef = useRef<Attempt[]>([])
  const falseStartsRef = useRef(0)

  const beginWait = useCallback(() => {
    setPhase('waiting')
    const delay = 1500 + Math.random() * 3500
    timeoutRef.current = setTimeout(() => {
      startRef.current = performance.now()
      setPhase('ready')
    }, delay)
  }, [])

  const handleStart = useCallback(() => {
    setLastMs(null)
    setAttempts([])
    setFalseStarts(0)
    setResults(null)
    attemptsRef.current = []
    falseStartsRef.current = 0
    trialCountRef.current = 0
    startGame()
    beginWait()
  }, [startGame, beginWait])

  const handleFinishSession = useCallback(() => {
    const r = buildResults([...attemptsRef.current], falseStartsRef.current)
    setResults(r)
    const best = r.best
    if (best > 0) updateScore(best)
    supabase.auth.getUser().then(({ data }) => {
      endGame(data.user?.id)
    })
  }, [updateScore, endGame])

  const handleNextAttempt = useCallback(() => {
    startGame()
    beginWait()
  }, [startGame, beginWait])

  const handleReact = useCallback(() => {
    if (phase === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      trialCountRef.current++
      falseStartsRef.current++
      const attempt: Attempt = {
        trial: trialCountRef.current,
        ms: 0,
        isFalseStart: true,
      }
      attemptsRef.current = [...attemptsRef.current, attempt]
      setFalseStarts(falseStartsRef.current)
      setAttempts([...attemptsRef.current])
      setPhase('toosoon')
      endGame()
      // Show results with the false start
      const r = buildResults([...attemptsRef.current], falseStartsRef.current)
      setResults(r)
      return
    }

    if (phase === 'ready' && startRef.current !== null) {
      const elapsed = Math.round(performance.now() - startRef.current)
      trialCountRef.current++
      const attempt: Attempt = {
        trial: trialCountRef.current,
        ms: elapsed,
        isFalseStart: false,
      }
      attemptsRef.current = [...attemptsRef.current, attempt]
      setLastMs(elapsed)
      setAttempts([...attemptsRef.current])
      setPhase('done')
      // Show results immediately
      const r = buildResults([...attemptsRef.current], falseStartsRef.current)
      setResults(r)
      updateScore(elapsed)
      supabase.auth.getUser().then(({ data }) => {
        endGame(data.user?.id)
      })
    }
  }, [phase, endGame, updateScore])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (phase === 'waiting' || phase === 'ready') handleReact()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleReact])

  useEffect(() => {
    if (isPlaying || !results) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, results, handleStart])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // ─── Reaction box (mid-attempt) ───────────────────────────────────
  const reactionBox = (phase === 'waiting' || phase === 'ready') && (
    <button
      onClick={handleReact}
      className={`w-72 h-52 sm:w-96 sm:h-60 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-100 select-none ${
        phase === 'ready'
          ? 'bg-[#00ff88]/15 border-[#00ff88] shadow-[0_0_60px_rgba(0,255,136,0.2)]'
          : 'bg-[#111] border-[#222] cursor-not-allowed'
      }`}
      disabled={phase === 'waiting'}
    >
      {phase === 'waiting' && (
        <span className="text-[#888] text-lg font-mono">Wait for green…</span>
      )}
      {phase === 'ready' && (
        <span className="text-[#00ff88] text-3xl font-bold font-mono tracking-wider animate-pulse">
          CLICK NOW!
        </span>
      )}
    </button>
  )

  // ─── Results Screen ───────────────────────────────────────────────
  if (results) {
    const validAttempts = results.attempts.filter((a) => !a.isFalseStart)
    const chartData = results.attempts.map((a) => ({
      trial: a.trial,
      ms: a.isFalseStart ? 0 : a.ms,
      isFalseStart: a.isFalseStart,
    }))
    const avgMs = results.avg

    return (
      <div className="flex-1 px-5 py-8 max-w-7xl mx-auto w-full animate-results">
        {/* Mid-attempt reaction box (if still playing) */}
        {(phase === 'waiting' || phase === 'ready') && (
          <div className="flex justify-center mb-8">{reactionBox}</div>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[#555] text-xs uppercase tracking-[0.2em] font-mono mb-1">
              Reaction Time — Results
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-7xl font-bold text-[#00ff88] tabular-nums font-mono leading-none">
                {results.best > 0 ? results.best : lastMs ?? '—'}
              </span>
              <span className="text-2xl text-[#444] font-mono">ms</span>
              {results.best > 0 && (
                <span className="text-base text-[#555] font-mono">
                  {getRating(results.best)}
                </span>
              )}
            </div>
          </div>
          <ResultsActions
            onRetry={handleStart}
            onNextAttempt={handleNextAttempt}
            shareText={`BrainyPulse Reaction: ${results.best} ms best | ${results.avg} ms avg — brainypulse.com`}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* ── Chart 70% ── */}
          <div className="lg:w-[70%]">
            <div className="bg-[#111213] border border-[#222] rounded-xl p-5">
              <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono mb-4">
                Reaction time per attempt (ms)
              </p>
              <div className="h-64">
                {validAttempts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.filter((d) => !d.isFalseStart)}
                      margin={{ top: 4, right: 16, bottom: 4, left: -10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 6"
                        stroke="#1c1c1c"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="trial"
                        tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: 'trial',
                          position: 'insideBottom',
                          offset: -2,
                          fill: '#444',
                          fontSize: 10,
                        }}
                      />
                      <YAxis
                        tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        unit="ms"
                      />
                      <Tooltip content={<ChartTooltip />} />
                      {avgMs > 0 && (
                        <ReferenceLine
                          y={avgMs}
                          stroke="#f1c40f"
                          strokeDasharray="5 3"
                          strokeOpacity={0.7}
                          label={{
                            value: `avg ${avgMs}ms`,
                            fill: '#f1c40f',
                            fontSize: 9,
                            fontFamily: 'monospace',
                            position: 'right',
                          }}
                        />
                      )}
                      <Bar
                        dataKey="ms"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive
                        animationDuration={1200}
                        name="Time"
                      >
                        {chartData
                          .filter((d) => !d.isFalseStart)
                          .map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={entry.ms === results.best ? '#00ff88' : '#2ecc71'}
                              opacity={entry.ms === results.best ? 1 : 0.55}
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#555] text-sm font-mono">
                    {results.falseStarts > 0
                      ? 'All attempts were false starts'
                      : 'No attempts recorded'}
                  </div>
                )}
              </div>
              <p className="text-[#444] text-[10px] font-mono mt-3">
                <span className="text-[#00ff88]">■</span> best &nbsp;
                <span className="text-[#2ecc71] opacity-55">■</span> other attempts &nbsp;
                <span className="text-[#f1c40f]">- - -</span> average
              </p>
            </div>
          </div>

          {/* ── Stats 30% ── */}
          <div className="lg:w-[30%] flex flex-col gap-3">
            <StatCard
              label="Best Reaction"
              value={results.best > 0 ? results.best : '—'}
              unit={results.best > 0 ? 'ms' : undefined}
              accent
              large
            />
            <StatCard
              label="Average Speed"
              value={results.avg > 0 ? results.avg : '—'}
              unit={results.avg > 0 ? 'ms' : undefined}
            />
            <StatCard label="Total Attempts" value={validAttempts.length} />
            <div className="bg-[#161618] border border-[#222] rounded-xl p-4 space-y-3">
              <p className="text-[#555] text-[10px] uppercase tracking-[0.15em] font-mono">
                Consistency
              </p>
              {[
                {
                  label: 'Slowest',
                  value: results.worst > 0 ? `${results.worst} ms` : '—',
                  color: 'text-[#ff4444]',
                },
                {
                  label: 'Variance (best↔worst)',
                  value: results.variance > 0 ? `${results.variance} ms` : '—',
                  color: 'text-[#888]',
                },
                {
                  label: 'False-Start Fouls',
                  value: results.falseStarts,
                  color: results.falseStarts > 0 ? 'text-[#ff4444]' : 'text-[#888]',
                },
                {
                  label: 'Rating',
                  value: results.best > 0 ? getRating(results.best) : '—',
                  color: 'text-[#00ff88]',
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

  // ─── Idle / Active Screen (before first result) ───────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12">
      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Reaction Time</h2>
            <p className="text-[#888] text-sm max-w-xs">
              Wait for the box to turn green, then click or press{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-[#333] text-xs font-mono text-[#888]">
                Space
              </kbd>{' '}
              as fast as possible.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium"
          >
            Start
          </button>
        </div>
      )}

      {reactionBox}
    </div>
  )
}
