import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import LeaderboardClient, { type BoardData, type ScoreRow } from './LeaderboardClient'

export const metadata: Metadata = {
  title: 'Leaderboard — Global High Scores for Typing, Memory, Maths & Reaction',
  description:
    'BrainyPulse global leaderboard — top WPM typing scores, fastest reaction times, highest memory levels, and most maths correct. See how you rank worldwide.',
  keywords: [
    'typing speed leaderboard',
    'reaction time leaderboard',
    'memory test scores',
    'cognitive test ranking',
    'brain test high scores',
    'wpm world ranking',
    'typing score comparison',
    'global brain benchmark',
  ],
  openGraph: {
    title: 'BrainyPulse Leaderboard — Global Cognitive Rankings',
    description:
      'Top typing speeds, fastest reaction times, and highest memory scores worldwide. Where do you rank?',
    url: 'https://brainypulse.com/leaderboard',
  },
  alternates: { canonical: 'https://brainypulse.com/leaderboard' },
}

type ToolId = 'daily' | 'typing' | 'memory' | 'maths' | 'reaction'

const TOOLS: {
  id: ToolId
  label: string
  unit: string
  hasAccuracy: boolean
  order: 'asc' | 'desc'
}[] = [
  { id: 'daily', label: 'Daily Pulse', unit: 'pts', hasAccuracy: false, order: 'desc' },
  { id: 'typing', label: 'Typing', unit: 'WPM', hasAccuracy: true, order: 'desc' },
  { id: 'memory', label: 'Memory', unit: 'rounds', hasAccuracy: false, order: 'desc' },
  { id: 'maths', label: 'Maths', unit: 'correct', hasAccuracy: false, order: 'desc' },
  { id: 'reaction', label: 'Reaction', unit: 'ms', hasAccuracy: false, order: 'asc' },
]

async function getBoard(toolId: ToolId, order: 'asc' | 'desc'): Promise<ScoreRow[]> {
  const supabase = await createSupabaseServerClient()
  // Fetch a wide ordered window, then keep only each user's personal best.
  const { data, error } = await supabase
    .from('scores')
    .select('id, user_id, score_value, accuracy, created_at, profiles(username)')
    .eq('tool_type', toolId)
    .order('score_value', { ascending: order === 'asc' })
    .order('created_at', { ascending: true })
    .limit(500)

  if (error || !data) return []

  const rows = data as unknown as ScoreRow[]

  // Rows are already sorted best-first, so the first time we see a user_id
  // is their best score for this tool. Keep that, drop the rest.
  const seen = new Set<string>()
  const best: ScoreRow[] = []
  for (const row of rows) {
    if (seen.has(row.user_id)) continue
    seen.add(row.user_id)
    best.push(row)
    if (best.length === 10) break
  }

  return best
}

import { getTodayKey } from '@/lib/daily-seed'

async function getDailyBoard(date: string): Promise<ScoreRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('daily_scores')
    .select('id, user_id, composite_score, created_at, profiles(username)')
    .eq('challenge_date', date)
    .order('composite_score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(500)

  if (error || !data) return []

  const rows = data as any[]
  const seen = new Set<string>()
  const best: ScoreRow[] = []
  
  for (const r of rows) {
    if (seen.has(r.user_id)) continue
    seen.add(r.user_id)
    best.push({
      id: r.id,
      user_id: r.user_id,
      score_value: r.composite_score,
      accuracy: null,
      created_at: r.created_at,
      profiles: r.profiles
    })
    if (best.length === 10) break
  }

  return best
}

export default async function LeaderboardPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {}
  const dateStr = typeof searchParams.date === 'string' ? searchParams.date : getTodayKey()

  const boards: BoardData[] = await Promise.all(
    TOOLS.map(async (t) => {
      if (t.id === 'daily') {
        return {
          id: t.id,
          label: t.label,
          unit: t.unit,
          hasAccuracy: t.hasAccuracy,
          rows: await getDailyBoard(dateStr),
        }
      }
      return {
        id: t.id,
        label: t.label,
        unit: t.unit,
        hasAccuracy: t.hasAccuracy,
        rows: await getBoard(t.id as 'typing' | 'memory' | 'maths' | 'reaction', t.order),
      }
    })
  )

  return <LeaderboardClient boards={boards} />
}
