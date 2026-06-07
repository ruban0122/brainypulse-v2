import type { Metadata } from 'next'
import DailyGauntlet from '@/components/daily/DailyGauntlet'

export const metadata: Metadata = {
  title: 'Daily Pulse — Daily Cognitive Challenge',
  description:
    'BrainyPulse Daily Pulse: one attempt per day across 4 seeded cognitive tests — typing speed, reaction time, memory, and mental maths. Same challenge for every player. Compete on the daily leaderboard.',
  keywords: [
    'daily brain test',
    'daily cognitive challenge',
    'daily typing test',
    'daily reaction test',
    'daily mental test',
    'daily brain game',
    'cognitive daily challenge',
    'brain benchmark daily',
    'daily mental fitness',
    'wordle for brain',
  ],
  openGraph: {
    title: 'Daily Pulse — Daily Cognitive Challenge | BrainyPulse',
    description:
      'One attempt per day. Four seeded cognitive tests. Same challenge for every player worldwide. Who ranks highest today?',
    url: 'https://brainypulse.com/daily',
  },
  alternates: { canonical: 'https://brainypulse.com/daily' },
}

export default function DailyPage() {
  return <DailyGauntlet />
}
