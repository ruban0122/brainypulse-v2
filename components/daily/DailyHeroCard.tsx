'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getTodayKey, getDayNumber } from '@/lib/daily-seed'
import { scoreRating, scoreColor } from '@/lib/daily-score'

type Status = 'loading' | 'guest' | 'played' | 'ready'

interface TodayScore {
  composite_score: number
  reaction_ms: number
  typing_wpm: number
  maths_correct: number
  memory_rounds: number
}

function StatItem({ icon, value }: { icon: string; value: string | number }) {
  return (
    <span className="text-[10px] font-mono text-[#aaa] flex items-center gap-1 whitespace-nowrap">
      <span className="opacity-60 text-[9px]">{icon}</span> {value}
    </span>
  )
}

export default function DailyHeroCard() {
  const [status, setStatus] = useState<Status>('loading')
  const [todayScore, setTodayScore] = useState<TodayScore | null>(null)
  const [streak, setStreak] = useState(0)
  const date = getTodayKey()
  const dayNum = getDayNumber()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('guest'); return }

      const { data: row } = await supabase
        .from('daily_scores')
        .select('composite_score, reaction_ms, typing_wpm, maths_correct, memory_rounds')
        .eq('user_id', user.id)
        .eq('challenge_date', date)
        .maybeSingle()

      if (row) {
        setTodayScore(row as TodayScore)
        // compute streak
        const { data: all } = await supabase
          .from('daily_scores')
          .select('challenge_date')
          .eq('user_id', user.id)
          .order('challenge_date', { ascending: false })
          .limit(365)
        if (all?.length) {
          let count = 0
          const expected = new Date(); expected.setUTCHours(0, 0, 0, 0)
          for (const r of all) {
            const d = new Date(r.challenge_date); d.setUTCHours(0, 0, 0, 0)
            if (d.getTime() === expected.getTime()) { count++; expected.setUTCDate(expected.getUTCDate() - 1) }
            else break
          }
          setStreak(count)
        }
        setStatus('played')
      } else {
        setStatus('ready')
      }
    }
    load()
  }, [date])

  if (status === 'loading') {
    return (
      <div className="w-full border border-[#1e1e1e] rounded-xl bg-[#111213] h-[72px] animate-pulse" />
    )
  }

  if (status === 'guest') {
    return (
      <div className="relative w-full rounded-xl border border-[#222] bg-[#111213] px-5 py-3 group transition-all hover:border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-lg opacity-50 shrink-0">
            🔒
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight flex items-center gap-2">
              Daily Pulse <span className="text-[#555] text-[10px] font-mono">#{dayNum}</span>
            </h2>
            <p className="text-[#777] text-xs mt-0.5">
              Sign in to play today's global challenge.
            </p>
          </div>
        </div>
        <Link href="/auth/login" className="relative z-10 flex-shrink-0 px-5 py-2 rounded-full border border-[#444] text-[#ddd] hover:border-white hover:bg-white hover:text-black transition-all text-xs font-medium whitespace-nowrap">
          Sign in
        </Link>
      </div>
    )
  }

  if (status === 'played' && todayScore) {
    const color = scoreColor(todayScore.composite_score)
    const rating = scoreRating(todayScore.composite_score)
    return (
      <div className="relative overflow-hidden w-full rounded-xl border border-[#222] bg-[#111213] px-5 py-3 hover:border-[#333] transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Subtle top accent line matching score color */}
        <div className="absolute top-0 left-0 w-full h-[2px] opacity-70" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        
        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
          {/* Score Display */}
          <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
            <div className="text-2xl font-bold font-mono tracking-tighter leading-none" style={{ color }}>
              {todayScore.composite_score}
            </div>
            <div className="text-[#555] text-[9px] font-mono uppercase tracking-[0.2em] mt-1">Pts</div>
          </div>
          
          <div className="w-px h-8 bg-[#222]" />
          
          {/* Details */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                Daily Pulse <span className="text-[#555] font-normal text-[10px] font-mono">#{dayNum}</span>
              </span>
              <span className="px-1.5 py-[1px] rounded text-[9px] font-mono border tracking-wider uppercase" style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}>
                {rating}
              </span>
              {streak > 1 && (
                <span className="text-orange-500 text-[10px] font-bold tracking-tight">
                  🔥 {streak}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-x-3 gap-y-1">
               <StatItem icon="⚡" value={`${todayScore.reaction_ms}ms`} />
               <StatItem icon="⌨️" value={`${todayScore.typing_wpm}wpm`} />
               <StatItem icon="🧮" value={todayScore.maths_correct} />
               <StatItem icon="🧠" value={todayScore.memory_rounds} />
            </div>
          </div>
        </div>
        
        <Link href="/leaderboard" className="relative z-10 flex-shrink-0 text-xs font-medium text-[#777] hover:text-white transition-colors flex items-center gap-1 w-full sm:w-auto justify-start sm:justify-end">
          Leaderboard <span className="text-sm leading-none">→</span>
        </Link>
      </div>
    )
  }

  // status === 'ready'
  return (
    <div className="relative overflow-hidden w-full rounded-xl border border-[#00ff88]/30 bg-gradient-to-r from-[#111] via-[#0a1510] to-[#111] px-5 py-3 shadow-[0_4px_20px_rgba(0,255,136,0.05)] group transition-all hover:border-[#00ff88]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Background glow effect */}
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#00ff88] rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(0,255,136,0.15)] group-hover:scale-105 transition-transform shrink-0">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-base font-bold text-white leading-tight">Daily Pulse</h2>
            <span className="px-1.5 py-0.5 rounded-sm bg-[#00ff88]/10 text-[#00ff88] text-[9px] font-mono border border-[#00ff88]/20">#{dayNum}</span>
          </div>
          <p className="text-[#888] text-[11px] flex items-center gap-2">
            <span>4 Tests</span>
            <span className="w-1 h-1 rounded-full bg-[#333]" />
            <span>~90s</span>
            <span className="w-1 h-1 rounded-full bg-[#333]" />
            <span>1 Attempt</span>
          </p>
        </div>
      </div>
      
      <Link href="/daily" className="relative z-10 flex-shrink-0 group/btn inline-flex items-center justify-center px-6 py-2 font-bold text-black bg-[#00ff88] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 text-[11px] tracking-wide shadow-[0_0_15px_rgba(0,255,136,0.2)]">
        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-20 bg-gradient-to-b from-transparent via-transparent to-black" />
        <span className="relative flex items-center gap-1.5">
          PLAY NOW
          <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </Link>
    </div>
  )
}
