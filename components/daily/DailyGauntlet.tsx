'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  getTodayKey,
  getDayNumber,
  getDailyWords,
  getDailyMathsQuestions,
  getDailyMemorySequence,
  type MathQuestion,
} from '@/lib/daily-seed'
import { calcPoints, compositeScore, scoreRating, scoreColor } from '@/lib/daily-score'
import { SOUNDS } from '@/lib/typing-sounds'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | 'intro'
  | 'reaction' | 'after-reaction'
  | 'typing'   | 'after-typing'
  | 'maths'    | 'after-maths'
  | 'memory'
  | 'saving'
  | 'done'

interface Scores {
  reactionMs: number
  typingWpm: number
  mathsCorrect: number
  memoryRounds: number
}

const TEST_ORDER: Array<{ step: Step; label: string; icon: string }> = [
  { step: 'reaction', label: 'Reaction',  icon: '⚡' },
  { step: 'typing',   label: 'Typing',    icon: '⌨️' },
  { step: 'maths',    label: 'Maths',     icon: '🧮' },
  { step: 'memory',   label: 'Memory',    icon: '🧠' },
]

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const idx = ['reaction', 'after-reaction', 'typing', 'after-typing', 'maths', 'after-maths', 'memory']
  const active = Math.min(
    TEST_ORDER.findIndex(t => step.startsWith(t.step.replace('after-', ''))),
    3
  )
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {TEST_ORDER.map((t, i) => (
        <div key={t.step} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs border transition-all ${
            i < active ? 'bg-[#00ff88] border-[#00ff88] text-black font-bold' :
            i === active ? 'border-[#00ff88] text-[#00ff88] font-bold' :
            'border-[#333] text-[#444]'
          }`}>
            {i < active ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-mono hidden sm:block ${i === active ? 'text-white' : i < active ? 'text-[#00ff88]' : 'text-[#444]'}`}>
            {t.label}
          </span>
          {i < 3 && <span className="text-[#2a2a2a] mx-1">—</span>}
        </div>
      ))}
    </div>
  )
}

// ─── Transition card ─────────────────────────────────────────────────────────

function Transition({
  completedLabel, completedIcon, rawScore, pts,
  nextLabel, nextIcon,
  onContinue,
}: {
  completedLabel: string; completedIcon: string
  rawScore: string; pts: number
  nextLabel: string; nextIcon: string
  onContinue: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onContinue, 3000)
    return () => clearTimeout(t)
  }, [onContinue])

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 animate-results px-6">
      <div className="text-center space-y-2">
        <p className="text-[#555] text-xs uppercase tracking-widest font-mono">{completedIcon} {completedLabel} — done</p>
        <div className="flex items-baseline gap-3 justify-center">
          <span className="text-4xl font-bold font-mono text-white">{rawScore}</span>
          <span className="text-[#00ff88] font-mono font-bold">+{pts} pts</span>
        </div>
      </div>
      <div className="w-px h-12 bg-[#222]" />
      <div className="text-center space-y-2">
        <p className="text-[#555] text-xs uppercase tracking-widest font-mono">Up next</p>
        <p className="text-xl font-semibold">{nextIcon} {nextLabel} Test</p>
      </div>
      <button onClick={onContinue} className="px-8 py-3 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium">
        Continue →
      </button>
    </div>
  )
}

// ─── Daily Reaction ───────────────────────────────────────────────────────────

const REACTION_ATTEMPTS = 3

function DailyReaction({ onComplete }: { onComplete: (avgMs: number) => void }) {
  const [phase, setPhase] = useState<'waiting' | 'ready' | 'result' | 'toosoon' | 'done'>('waiting')
  const [lastMs, setLastMs] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<number[]>([])
  const startRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const arm = useCallback(() => {
    setLastMs(null)
    setPhase('waiting')
    const delay = 1200 + Math.random() * 2800
    timeoutRef.current = setTimeout(() => {
      startRef.current = performance.now()
      setPhase('ready')
    }, delay)
  }, [])

  useEffect(() => { arm(); return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) } }, [arm])

  const handleReact = useCallback(() => {
    if (phase === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setPhase('toosoon'); return
    }
    if (phase === 'ready' && startRef.current !== null) {
      const elapsed = Math.round(performance.now() - startRef.current)
      const next = [...attempts, elapsed]
      setAttempts(next)
      setLastMs(elapsed)
      if (next.length >= REACTION_ATTEMPTS) {
        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length)
        setPhase('done')
        setLastMs(avg)
      } else {
        setPhase('result')
      }
    }
  }, [phase, attempts])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); handleReact() } }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [handleReact])

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <p className="text-[#555] text-xs uppercase tracking-widest font-mono">
        Reaction — best of {REACTION_ATTEMPTS} · attempt {Math.min(attempts.length + 1, REACTION_ATTEMPTS)}/{REACTION_ATTEMPTS}
      </p>

      {/* attempt dots */}
      <div className="flex gap-2">
        {Array.from({ length: REACTION_ATTEMPTS }, (_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${
            i < attempts.length ? 'bg-[#00ff88]' : 'bg-[#2a2a2a]'
          }`} />
        ))}
      </div>

      {phase === 'toosoon' ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-[#ff4444] font-bold text-2xl font-mono">Too soon!</div>
          <button onClick={arm} className="px-6 py-2 rounded-full border border-[#555] text-[#888] hover:text-white hover:border-white transition-colors text-sm">Retry attempt</button>
        </div>
      ) : (
        <button
          onClick={handleReact}
          disabled={phase === 'result' || phase === 'done'}
          className={`w-72 h-52 sm:w-80 sm:h-56 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all select-none ${
            phase === 'ready' ? 'bg-[#00ff88]/15 border-[#00ff88] shadow-[0_0_60px_rgba(0,255,136,0.2)] cursor-pointer' :
            (phase === 'result' || phase === 'done') ? 'bg-[#111] border-[#333] cursor-default' :
            'bg-[#111] border-[#1e1e1e] cursor-not-allowed'
          }`}
        >
          {phase === 'waiting' && <span className="text-[#888] text-lg font-mono">Wait for green…</span>}
          {phase === 'ready'   && <span className="text-[#00ff88] text-3xl font-bold font-mono tracking-wider animate-pulse">CLICK NOW!</span>}
          {phase === 'result' && lastMs !== null && (
            <span className="text-white text-5xl font-bold font-mono">{lastMs}<span className="text-2xl ml-1">ms</span></span>
          )}
          {phase === 'done' && lastMs !== null && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#555] text-xs font-mono uppercase tracking-widest">average</span>
              <span className="text-[#00ff88] text-5xl font-bold font-mono">{lastMs}<span className="text-2xl ml-1">ms</span></span>
            </div>
          )}
        </button>
      )}

      {phase === 'result' && (
        <button onClick={arm} className="px-8 py-3 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium">
          Next attempt →
        </button>
      )}
      {phase === 'done' && lastMs !== null && (
        <button onClick={() => onComplete(lastMs)} className="px-8 py-3 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium">
          Continue →
        </button>
      )}
    </div>
  )
}

// ─── Daily Typing ─────────────────────────────────────────────────────────────

function DailyTyping({ text, onComplete }: { text: string; onComplete: (wpm: number, acc: number) => void }) {
  const [typed, setTyped] = useState('')
  const [errors, setErrors] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(30)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const typedRef = useRef('')
  const errorsRef = useRef(new Set<number>())
  const finishedRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  function playClick(isError: boolean) {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current; if (ctx.state === 'suspended') ctx.resume()
      
      const dayNum = getDayNumber()
      const soundDef = SOUNDS[dayNum % SOUNDS.length]
      soundDef.play(ctx, isError)
    } catch { /* */ }
  }

  const finish = useCallback((t: string, errs: Set<number>) => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    const words = t.trim().split(/\s+/).filter(Boolean).length
    const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 1 / 60
    const wpm = Math.round(words / elapsed)
    const correctChars = t.split('').filter((ch, i) => ch === text[i]).length
    const acc = t.length > 0 ? Math.round((correctChars / t.length) * 100) : 100
    onComplete(wpm, acc)
  }, [text, onComplete])

  useEffect(() => {
    if (!started || finished) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { finish(typedRef.current, errorsRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [started, finished, finish])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (finished || finishedRef.current) return
    if (e.key.length !== 1 && e.key !== 'Backspace') return
    e.preventDefault()
    if (!started) { setStarted(true); startTimeRef.current = Date.now() }

    if (e.key === 'Backspace') {
      const prev = typedRef.current
      const next = prev.slice(0, -1)
      typedRef.current = next; setTyped(next)
      const s = new Set(errorsRef.current); s.delete(prev.length - 1)
      errorsRef.current = s; setErrors(new Set(s)); return
    }

    const prev = typedRef.current
    const next = prev + e.key
    typedRef.current = next; setTyped(next)
    
    const isError = e.key !== text[prev.length]
    playClick(isError)
    
    if (isError) {
      const s = new Set(errorsRef.current).add(prev.length)
      errorsRef.current = s; setErrors(new Set(s))
    }
    if (next.length >= text.length) { finish(next, errorsRef.current) }
  }, [started, finished, text, finish])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 max-w-2xl mx-auto w-full">
      <div className="flex gap-10 font-mono">
        <div className="text-center">
          <div className={`text-4xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-[#ff4444]' : 'text-[#00ff88]'}`}>{timeLeft}</div>
          <div className="text-[#555] text-xs mt-1 uppercase tracking-widest">sec</div>
        </div>
      </div>
      <div className="font-mono text-lg leading-loose cursor-default select-none w-full" style={{ wordBreak: 'break-all' }}>
        {text.split('').map((ch, i) => {
          let cls = 'text-[#444]'
          if (i < typed.length) cls = errors.has(i) ? 'text-[#ff4444]' : 'text-white'
          else if (i === typed.length) cls = 'border-l-2 border-[#00ff88] text-[#666]'
          return <span key={i} className={`${cls} transition-colors duration-75`}>{ch}</span>
        })}
      </div>
      {!started && <p className="text-[#555] text-xs">Start typing to begin the 30-second test</p>}
    </div>
  )
}

// ─── Daily Maths ──────────────────────────────────────────────────────────────

function DailyMaths({ questions, onComplete }: { questions: MathQuestion[]; onComplete: (correct: number) => void }) {
  const [qIdx, setQIdx] = useState(0)
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [correctCount, setCorrectCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const wrongTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  function playErrorSound() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current; if (ctx.state === 'suspended') ctx.resume()
      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator(); const gain = ctx.createGain()
      osc1.type = 'triangle'; osc2.type = 'sine'
      osc1.frequency.setValueAtTime(250, ctx.currentTime); osc1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2)
      osc2.frequency.setValueAtTime(200, ctx.currentTime); osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
      osc1.start(); osc2.start(); osc1.stop(ctx.currentTime + 0.2); osc2.stop(ctx.currentTime + 0.2)
    } catch { /* */ }
  }

  function playCorrectSound() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current; if (ctx.state === 'suspended') ctx.resume()
      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator()
      const gain1 = ctx.createGain(); const gain2 = ctx.createGain()
      osc1.type = 'sine'; osc2.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime)
      gain1.gain.setValueAtTime(0.15, ctx.currentTime); gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08)
      gain2.gain.setValueAtTime(0, ctx.currentTime); gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.08); gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc1.connect(gain1); osc2.connect(gain2); gain1.connect(ctx.destination); gain2.connect(ctx.destination)
      osc1.start(ctx.currentTime); osc2.start(ctx.currentTime + 0.08); osc1.stop(ctx.currentTime + 0.15); osc2.stop(ctx.currentTime + 0.4)
    } catch { /* */ }
  }

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          if (!finishedRef.current) { finishedRef.current = true; if(wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current); onComplete(correctRef.current) }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onComplete])

  const qa = questions[Math.min(qIdx, questions.length - 1)]

  useEffect(() => {
    if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
    if (input !== '' && input !== '-' && flash !== 'correct' && flash !== 'wrong' && timeLeft > 0) {
      const typed = Number(input)
      if (typed !== qa.answer) {
        wrongTimeoutRef.current = setTimeout(() => {
          playErrorSound()
          setFlash('wrong')
          setTimeout(() => { setInput(''); setFlash(null); inputRef.current?.focus() }, 500)
        }, 700)
      }
    }
    return () => { if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current) }
  }, [input, qa.answer, flash, timeLeft])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (flash === 'wrong') return
    const raw = e.target.value.replace(/[^0-9-]/g, '')
    setInput(raw)
    if (raw === '' || raw === '-') return
    
    if (Number(raw) === qa.answer) {
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
      const next = correctRef.current + 1
      correctRef.current = next
      setCorrectCount(next)
      playCorrectSound()
      setFlash('correct')
      setTimeout(() => {
        setQIdx(i => i + 1); setInput(''); setFlash(null)
        setTimeout(() => inputRef.current?.focus(), 10)
      }, 180)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input !== '' && input !== '-') {
      if (Number(input) !== qa.answer) {
        e.preventDefault()
        if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
        playErrorSound()
        setFlash('wrong')
        setTimeout(() => { setInput(''); setFlash(null); inputRef.current?.focus() }, 500)
      }
    }
  }

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6">
      <div className="flex gap-10 font-mono">
        <div className="text-center">
          <div className={`text-4xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-[#ff4444]' : 'text-[#00ff88]'}`}>{timeLeft}</div>
          <div className="text-[#555] text-xs mt-1 uppercase tracking-widest">sec</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold tabular-nums">{correctCount}</div>
          <div className="text-[#555] text-xs mt-1 uppercase tracking-widest">correct</div>
        </div>
      </div>
      <div className={`text-5xl sm:text-6xl font-mono font-bold transition-colors duration-150 ${flash === 'correct' ? 'text-[#00ff88]' : 'text-white'}`}>
        {qa.display} =
      </div>
      <input ref={inputRef} type="text" inputMode="numeric" value={input} onChange={handleChange} onKeyDown={handleKeyDown}
        className={`bg-transparent border-b-2 outline-none text-center text-5xl font-mono w-48 pb-2 transition-colors duration-150 ${
          flash === 'wrong' ? 'border-[#ff4444] text-[#ff4444] animate-shake' :
          flash === 'correct' ? 'border-[#00ff88] text-[#00ff88]' :
          'border-[#333] focus:border-[#00ff88] text-white'
        }`}
        autoComplete="off" spellCheck={false} />
    </div>
  )
}

// ─── Daily Memory ─────────────────────────────────────────────────────────────

const MEMORY_MAX_ROUNDS = 7

const TILE_COLORS = [
  { border: 'border-red-500',   bg: 'bg-red-500/20',   hover: 'hover:bg-red-500/10',   shadow: 'shadow-[0_0_24px_rgba(239,68,68,0.4)]', freq: 261.63 }, // C4
  { border: 'border-orange-500',bg: 'bg-orange-500/20',hover: 'hover:bg-orange-500/10',shadow: 'shadow-[0_0_24px_rgba(249,115,22,0.4)]', freq: 293.66 }, // D4
  { border: 'border-amber-400', bg: 'bg-amber-400/20', hover: 'hover:bg-amber-400/10', shadow: 'shadow-[0_0_24px_rgba(251,191,36,0.4)]', freq: 329.63 }, // E4
  { border: 'border-green-500', bg: 'bg-green-500/20', hover: 'hover:bg-green-500/10', shadow: 'shadow-[0_0_24px_rgba(34,197,94,0.4)]', freq: 349.23 }, // F4
  { border: 'border-cyan-400',  bg: 'bg-cyan-400/20',  hover: 'hover:bg-cyan-400/10',  shadow: 'shadow-[0_0_24px_rgba(34,211,238,0.4)]', freq: 392.00 }, // G4
  { border: 'border-blue-500',  bg: 'bg-blue-500/20',  hover: 'hover:bg-blue-500/10',  shadow: 'shadow-[0_0_24px_rgba(59,130,246,0.4)]', freq: 440.00 }, // A4
  { border: 'border-indigo-500',bg: 'bg-indigo-500/20',hover: 'hover:bg-indigo-500/10',shadow: 'shadow-[0_0_24px_rgba(99,102,241,0.4)]', freq: 493.88 }, // B4
  { border: 'border-purple-500',bg: 'bg-purple-500/20',hover: 'hover:bg-purple-500/10',shadow: 'shadow-[0_0_24px_rgba(168,85,247,0.4)]', freq: 523.25 }, // C5
  { border: 'border-pink-500',  bg: 'bg-pink-500/20',  hover: 'hover:bg-pink-500/10',  shadow: 'shadow-[0_0_24px_rgba(236,72,153,0.4)]', freq: 587.33 }, // D5
]

function DailyMemory({ sequence: fullSeq, onComplete }: { sequence: number[]; onComplete: (rounds: number) => void }) {
  const [level, setLevel] = useState(1) // Level 1 shows 3 tiles
  const [lives, setLives] = useState(3)
  const [phase, setPhase] = useState<'showing' | 'input' | 'success' | 'fail'>('showing')
  const [userInput, setUserInput] = useState<number[]>([])
  const [activeCell, setActiveCell] = useState<number | null>(null)
  
  const finishedRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const seqRef = useRef<number[]>([])
  seqRef.current = fullSeq.slice(0, level + 2) // Start with 3 tiles

  const playNote = useCallback((freq: number, type: OscillatorType = 'sine', duration = 0.3) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current; if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.type = type; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + duration)
    } catch { /* */ }
  }, [])

  useEffect(() => {
    if (phase !== 'showing') return
    const seq = seqRef.current
    let i = 0, cancelled = false
    const baseSpeed = Math.max(200, 500 - level * 30)
    
    const flash = () => {
      if (cancelled) return
      if (i >= seq.length) {
        setActiveCell(null); setPhase('input'); return
      }
      setActiveCell(null)
      setTimeout(() => {
        if (cancelled) return
        setActiveCell(seq[i])
        playNote(TILE_COLORS[seq[i]].freq, 'sine', 0.4)
        i++
        setTimeout(flash, baseSpeed)
      }, 100)
    }
    const t = setTimeout(flash, 600)
    return () => { cancelled = true; clearTimeout(t) }
  }, [phase, level, playNote])

  const finish = useCallback((rounds: number) => {
    if (finishedRef.current) return
    finishedRef.current = true
    onComplete(rounds)
  }, [onComplete])

  const handleCell = (idx: number) => {
    if (phase !== 'input') return
    const seq = seqRef.current
    const next = [...userInput, idx]
    setUserInput(next)
    
    const pos = next.length - 1
    if (next[pos] !== seq[pos]) {
      // Wrong
      playNote(150, 'sawtooth', 0.5)
      setPhase('fail')
      setActiveCell(seq[pos])
      setTimeout(() => {
        const remainingLives = lives - 1
        if (remainingLives <= 0) {
          finish(level - 1)
        } else {
          setLives(remainingLives)
          setUserInput([])
          setPhase('showing')
        }
      }, 1000)
      return
    }
    
    // Correct tap
    setActiveCell(idx)
    playNote(TILE_COLORS[idx].freq, 'triangle', 0.2)
    setTimeout(() => setActiveCell(null), 150)

    if (next.length === seq.length) {
      setPhase('success')
      setUserInput([])
      setTimeout(() => {
        if (level >= MEMORY_MAX_ROUNDS) {
          finish(MEMORY_MAX_ROUNDS)
        } else {
          setLevel(l => l + 1)
          setPhase('showing')
        }
      }, 600)
    }
  }

  const cellClass = (i: number) => {
    const c = TILE_COLORS[i]
    const base = 'w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 transition-all duration-150 relative overflow-hidden'
    
    if (activeCell === i && phase === 'fail') {
      return `${base} bg-red-500/40 border-red-500 animate-shake`
    }
    
    if (activeCell === i) {
      return `${base} ${c.bg} ${c.border} ${c.shadow} scale-105`
    }
    
    if (phase === 'input') {
      return `${base} border-[#333] bg-[#111] ${c.hover} active:scale-95 cursor-pointer`
    }
    
    return `${base} border-[#222] bg-[#111] cursor-default`
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
      <div className="flex items-center justify-between w-full max-w-[300px]">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`text-xl transition-all ${i < lives ? 'text-red-500 scale-100' : 'text-[#333] scale-75'}`}>
              ♥
            </span>
          ))}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums text-[#00ff88]">
            {level}<span className="text-lg text-[#555]">/{MEMORY_MAX_ROUNDS}</span>
          </div>
          <div className="text-[#555] text-[10px] uppercase tracking-widest font-mono">round</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, i) => (
          <button key={i} onClick={() => handleCell(i)} className={cellClass(i)} disabled={phase !== 'input'} />
        ))}
      </div>
      
      <p className="text-sm font-mono h-6 text-[#888] flex items-center justify-center gap-2">
        {phase === 'showing' && <span className="animate-pulse text-[#00ff88]">Watch pattern...</span>}
        {phase === 'input' && <span>Repeat {seqRef.current.length} tiles</span>}
        {phase === 'success' && <span className="text-[#00ff88]">Perfect!</span>}
        {phase === 'fail' && <span className="text-red-500">Wrong tile!</span>}
      </p>
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────

function DailyResults({
  scores, streak, onShare,
}: {
  scores: Scores & { reactionPts: number; typingPts: number; mathsPts: number; memoryPts: number; composite: number }
  streak: number
  onShare: () => void
}) {
  const [displayed, setDisplayed] = useState(0)
  const target = scores.composite
  const color = scoreColor(target)
  const rating = scoreRating(target)

  useEffect(() => {
    let start: number | null = null
    const duration = 1800
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setDisplayed(Math.round(p * p * target))
      if (p < 1) requestAnimationFrame(step)
      else setDisplayed(target)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [target])

  const rows = [
    { label: '⚡ Reaction',  raw: `${scores.reactionMs} ms`,  pts: scores.reactionPts },
    { label: '⌨️ Typing',    raw: `${scores.typingWpm} WPM`,  pts: scores.typingPts },
    { label: '🧮 Maths',     raw: `${scores.mathsCorrect} correct`, pts: scores.mathsPts },
    { label: '🧠 Memory',    raw: `${scores.memoryRounds} rounds`,  pts: scores.memoryPts },
  ]

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 py-10 animate-results max-w-lg mx-auto w-full">
      <div className="text-center space-y-2">
        <p className="text-[#555] text-xs uppercase tracking-[0.2em] font-mono">Daily Pulse #{getDayNumber()}</p>
        <div className="font-mono font-bold tabular-nums leading-none" style={{ fontSize: '5rem', color }}>
          {displayed}
        </div>
        <p className="font-mono text-lg" style={{ color }}>{rating}</p>
        {streak > 0 && (
          <p className="text-[#888] text-sm font-mono">🔥 {streak}-day streak</p>
        )}
      </div>

      <div className="w-full space-y-2">
        {rows.map(({ label, raw, pts }, i) => (
          <div key={i} className="flex items-center justify-between bg-[#161618] border border-[#222] rounded-xl px-4 py-3"
            style={{ animationDelay: `${i * 150}ms` }}>
            <span className="text-sm text-[#888] font-mono">{label}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#555] font-mono">{raw}</span>
              <span className="text-[#00ff88] font-mono font-bold text-sm">{pts} pts</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between bg-[#111213] border border-[#2a2a2a] rounded-xl px-4 py-3 mt-1">
          <span className="text-sm font-semibold">Total</span>
          <span className="font-mono font-bold text-lg" style={{ color }}>{scores.composite} pts</span>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={onShare}
          className="px-6 py-2.5 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium">
          ⇪ Share Result
        </button>
      </div>
    </div>
  )
}

// ─── Main Gauntlet orchestrator ───────────────────────────────────────────────

export default function DailyGauntlet() {
  const router = useRouter()
  const date = getTodayKey()
  const dayNum = getDayNumber()

  const dailyText      = getDailyWords(date, 25)
  const dailyQuestions = getDailyMathsQuestions(date)
  const dailyMemSeq    = getDailyMemorySequence(date)

  const [step, setStep] = useState<Step>('intro')
  const [scores, setScores] = useState<Partial<Scores>>({})
  const [finalData, setFinalData] = useState<(Scores & {
    reactionPts: number; typingPts: number; mathsPts: number; memoryPts: number; composite: number
  }) | null>(null)
  const [streak, setStreak] = useState(0)
  const [copied, setCopied] = useState(false)

  const getStreak = async (userId: string) => {
    const { data } = await supabase
      .from('daily_scores')
      .select('challenge_date')
      .eq('user_id', userId)
      .order('challenge_date', { ascending: false })
      .limit(365)
    if (!data?.length) return 0
    let count = 0
    const expected = new Date(); expected.setUTCHours(0, 0, 0, 0)
    for (const row of data) {
      const d = new Date(row.challenge_date); d.setUTCHours(0, 0, 0, 0)
      if (d.getTime() === expected.getTime()) {
        count++; expected.setUTCDate(expected.getUTCDate() - 1)
      } else break
    }
    return count
  }

  const saveAndFinish = useCallback(async (s: Scores) => {
    setStep('saving')
    const rPts   = calcPoints('reaction', s.reactionMs)
    const tPts   = calcPoints('typing',   s.typingWpm)
    const mPts   = calcPoints('maths',    s.mathsCorrect)
    const memPts = calcPoints('memory',   s.memoryRounds)
    const total  = rPts + tPts + mPts + memPts

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('daily_scores').insert({
        user_id:          user.id,
        challenge_date:   date,
        reaction_ms:      s.reactionMs,
        typing_wpm:       s.typingWpm,
        maths_correct:    s.mathsCorrect,
        memory_rounds:    s.memoryRounds,
        reaction_points:  rPts,
        typing_points:    tPts,
        maths_points:     mPts,
        memory_points:    memPts,
        composite_score:  total,
      })
      const st = await getStreak(user.id)
      setStreak(st)
    }

    setFinalData({ ...s, reactionPts: rPts, typingPts: tPts, mathsPts: mPts, memoryPts: memPts, composite: total })
    setStep('done')
  }, [date])

  const handleShare = async () => {
    if (!finalData) return
    const rating = scoreRating(finalData.composite)
    const text = [
      `BrainyPulse Daily #${dayNum}`,
      `⚡ ${finalData.reactionMs}ms  ⌨️ ${finalData.typingWpm}wpm  🧮 ${finalData.mathsCorrect}  🧠 ${finalData.memoryRounds}`,
      `${finalData.composite}/4000 pts — ${rating}`,
      streak > 0 ? `🔥 ${streak}-day streak` : '',
      'brainypulse.com/daily',
    ].filter(Boolean).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (step === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 py-12 text-center animate-results">
        <div className="space-y-2">
          <p className="text-[#555] text-xs uppercase tracking-[0.2em] font-mono">Daily Pulse #{dayNum} · {date}</p>
          <h1 className="text-4xl font-bold">Today&apos;s Challenge</h1>
          <p className="text-[#888] text-sm max-w-sm">
            4 tests · ~90 seconds · same for every player today · one locked attempt
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {TEST_ORDER.map((t, i) => (
            <div key={t.step} className="flex items-center gap-3 bg-[#161618] border border-[#222] rounded-xl px-4 py-3">
              <span className="text-lg">{t.icon}</span>
              <span className="text-sm font-medium flex-1 text-left">{t.label} Test</span>
              <span className="text-[#555] text-xs font-mono">{i + 1}/4</span>
            </div>
          ))}
        </div>
        <button onClick={() => setStep('reaction')}
          className="px-10 py-3.5 rounded-full bg-[#00ff88] text-black font-bold text-sm hover:bg-[#00cc6a] transition-colors">
          Start Daily Pulse
        </button>
        <button onClick={() => router.push('/')} className="text-[#555] hover:text-[#888] text-xs transition-colors">
          ← Back to practice
        </button>
      </div>
    )
  }

  if (step === 'reaction') {
    return (
      <div className="flex flex-col flex-1 py-8 px-6 max-w-2xl mx-auto w-full">
        <ProgressBar step="reaction" />
        <p className="text-center text-[#555] text-xs uppercase tracking-widest font-mono mb-6">Test 1 of 4</p>
        <DailyReaction onComplete={(ms) => {
          setScores(s => ({ ...s, reactionMs: ms }))
          setStep('after-reaction')
        }} />
      </div>
    )
  }

  if (step === 'after-reaction' && scores.reactionMs !== undefined) {
    return (
      <div className="flex flex-col flex-1 py-8 max-w-2xl mx-auto w-full">
        <ProgressBar step="after-reaction" />
        <Transition
          completedLabel="Reaction" completedIcon="⚡"
          rawScore={`${scores.reactionMs} ms`}
          pts={calcPoints('reaction', scores.reactionMs)}
          nextLabel="Typing" nextIcon="⌨️"
          onContinue={() => setStep('typing')}
        />
      </div>
    )
  }

  if (step === 'typing') {
    return (
      <div className="flex flex-col flex-1 py-8 px-6 max-w-2xl mx-auto w-full">
        <ProgressBar step="typing" />
        <p className="text-center text-[#555] text-xs uppercase tracking-widest font-mono mb-6">Test 2 of 4</p>
        <DailyTyping text={dailyText} onComplete={(wpm, _acc) => {
          setScores(s => ({ ...s, typingWpm: wpm }))
          setStep('after-typing')
        }} />
      </div>
    )
  }

  if (step === 'after-typing' && scores.typingWpm !== undefined) {
    return (
      <div className="flex flex-col flex-1 py-8 max-w-2xl mx-auto w-full">
        <ProgressBar step="after-typing" />
        <Transition
          completedLabel="Typing" completedIcon="⌨️"
          rawScore={`${scores.typingWpm} WPM`}
          pts={calcPoints('typing', scores.typingWpm)}
          nextLabel="Maths" nextIcon="🧮"
          onContinue={() => setStep('maths')}
        />
      </div>
    )
  }

  if (step === 'maths') {
    return (
      <div className="flex flex-col flex-1 py-8 px-6 max-w-2xl mx-auto w-full">
        <ProgressBar step="maths" />
        <p className="text-center text-[#555] text-xs uppercase tracking-widest font-mono mb-6">Test 3 of 4</p>
        <DailyMaths questions={dailyQuestions} onComplete={(correct) => {
          setScores(s => ({ ...s, mathsCorrect: correct }))
          setStep('after-maths')
        }} />
      </div>
    )
  }

  if (step === 'after-maths' && scores.mathsCorrect !== undefined) {
    return (
      <div className="flex flex-col flex-1 py-8 max-w-2xl mx-auto w-full">
        <ProgressBar step="after-maths" />
        <Transition
          completedLabel="Maths" completedIcon="🧮"
          rawScore={`${scores.mathsCorrect} correct`}
          pts={calcPoints('maths', scores.mathsCorrect)}
          nextLabel="Memory" nextIcon="🧠"
          onContinue={() => setStep('memory')}
        />
      </div>
    )
  }

  if (step === 'memory') {
    return (
      <div className="flex flex-col flex-1 py-8 px-6 max-w-2xl mx-auto w-full">
        <ProgressBar step="memory" />
        <p className="text-center text-[#555] text-xs uppercase tracking-widest font-mono mb-6">Test 4 of 4 — Final</p>
        <DailyMemory sequence={dailyMemSeq} onComplete={(rounds) => {
          const finalScores = { ...scores, memoryRounds: rounds } as Scores
          setScores(finalScores)
          saveAndFinish(finalScores)
        }} />
      </div>
    )
  }

  if (step === 'saving') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888] text-sm font-mono">Saving your results…</p>
      </div>
    )
  }

  if (step === 'done' && finalData) {
    return (
      <div className="flex flex-col flex-1 py-8 max-w-2xl mx-auto w-full">
        <DailyResults scores={finalData} streak={streak} onShare={handleShare} />
        {copied && (
          <p className="text-center text-[#00ff88] text-xs font-mono mt-2 animate-fade-in">
            Copied to clipboard!
          </p>
        )}
      </div>
    )
  }

  return null
}
