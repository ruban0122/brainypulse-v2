// Normalise each raw test result to a 0–1000 point scale, then sum for composite.

function clamp(v: number) {
  return Math.max(0, Math.min(1000, Math.round(v)))
}

export function calcPoints(
  tool: 'reaction' | 'typing' | 'maths' | 'memory',
  value: number
): number {
  switch (tool) {
    case 'reaction': return clamp((500 - value) / 350 * 1000) // 150ms=1000, 500ms=0
    case 'typing':   return clamp(value / 120 * 1000)          // 120 WPM=1000
    case 'maths':    return clamp(value / 25 * 1000)           // 25 correct (in 30s)=1000
    case 'memory':   return clamp(value / 7 * 1000)            // 7 rounds (max)=1000
  }
}

export function compositeScore(r: number, t: number, m: number, mem: number): number {
  return r + t + m + mem
}

export function scoreRating(composite: number): string {
  if (composite >= 3500) return 'Legendary'
  if (composite >= 3000) return 'Elite'
  if (composite >= 2500) return 'Advanced'
  if (composite >= 2000) return 'Skilled'
  if (composite >= 1500) return 'Developing'
  return 'Beginner'
}

export function scoreColor(composite: number): string {
  if (composite >= 3500) return '#f1c40f'
  if (composite >= 3000) return '#00ff88'
  if (composite >= 2500) return '#2ecc71'
  if (composite >= 2000) return '#3498db'
  if (composite >= 1500) return '#9b59b6'
  return '#888'
}
