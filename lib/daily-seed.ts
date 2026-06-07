// Deterministic seeded RNG using FNV-1a + xorshift32.
// Same date string → same sequence for all players worldwide.

function fnv1a(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function createRng(seed: string) {
  let s = fnv1a(seed) || 1
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    return (s >>> 0) / 0x100000000
  }
}

// Today's date in UTC — used as the daily key everywhere
export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0] // "2026-06-04"
}

// Challenge number since launch (for "Daily Pulse #N" branding)
const LAUNCH_DATE = new Date('2026-06-04').getTime()
export function getDayNumber(): number {
  return Math.max(1, Math.floor((Date.now() - LAUNCH_DATE) / 86_400_000) + 1)
}

// ── Typing ────────────────────────────────────────────────────────────────────

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

export function getDailyWords(date: string, count = 30): string {
  const rng = createRng(date + ':typing')
  const words: string[] = []
  for (let i = 0; i < count; i++) {
    words.push(WORD_LIST[Math.floor(rng() * WORD_LIST.length)])
  }
  return words.join(' ')
}

// ── Maths ─────────────────────────────────────────────────────────────────────

export interface MathQuestion {
  display: string
  answer: number
}

export function getDailyMathsQuestions(date: string, count = 80): MathQuestion[] {
  const rng = createRng(date + ':maths')
  const out: MathQuestion[] = []

  for (let i = 0; i < count; i++) {
    const op = Math.floor(rng() * 3)
    if (op === 0) {
      const a = Math.floor(rng() * 90) + 10
      const b = Math.floor(rng() * 90) + 10
      out.push({ display: `${a} + ${b}`, answer: a + b })
    } else if (op === 1) {
      const a = Math.floor(rng() * 90) + 10
      const b = Math.floor(rng() * (a - 1)) + 1
      out.push({ display: `${a} − ${b}`, answer: a - b })
    } else {
      const a = Math.floor(rng() * 11) + 2
      const b = Math.floor(rng() * 11) + 2
      out.push({ display: `${a} × ${b}`, answer: a * b })
    }
  }
  return out
}

// ── Memory ────────────────────────────────────────────────────────────────────

// Returns a flat array of cell indices. Round N uses indices [0..N-1].
export function getDailyMemorySequence(date: string, maxLength = 30): number[] {
  const rng = createRng(date + ':memory')
  return Array.from({ length: maxLength }, () => Math.floor(rng() * 9))
}
