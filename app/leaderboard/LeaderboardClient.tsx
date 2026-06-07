'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type ToolId = 'daily' | 'typing' | 'memory' | 'maths' | 'reaction'

type ProfileJoin = { username: string } | { username: string }[] | null

export interface ScoreRow {
  id: number
  user_id: string
  score_value: number
  accuracy: number | null
  created_at: string
  profiles: ProfileJoin
}

export interface BoardData {
  id: ToolId
  label: string
  unit: string
  hasAccuracy: boolean
  rows: ScoreRow[]
}

const RANK_STYLE: Record<number, string> = {
  0: 'text-[#f1c40f]',   // gold
  1: 'text-[#c0c0c0]',   // silver
  2: 'text-[#cd7f32]',   // bronze
}

const RANK_LABEL: Record<number, string> = {
  0: '🥇',
  1: '🥈',
  2: '🥉',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function guestName(userId: string): string {
  const hash = userId
    .split('')
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0xffff, 0)
  return `Guest_${(hash % 9000 + 1000).toString()}`
}

function getUsername(row: ScoreRow): string {
  const p = row.profiles
  // Supabase returns a single object for many-to-one joins, but can also
  // return an array depending on how the relationship is resolved — handle both.
  const name = Array.isArray(p) ? p[0]?.username : p?.username
  if (name) return name
  return guestName(row.user_id)
}

function EmptyState({ tool }: { tool: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-5xl opacity-30">
        {tool === 'daily' ? '🏆' : tool === 'typing' ? '⌨️' : tool === 'memory' ? '🧠' : tool === 'maths' ? '🧮' : '⚡'}
      </div>
      <p className="text-white font-semibold text-base">No scores posted yet</p>
      <p className="text-[#555] text-sm text-center max-w-xs">
        Take the test to claim{' '}
        <span className="text-[#00ff88] font-bold">Rank #1</span>!
      </p>
    </div>
  )
}

function LeaderboardContent({ boards }: { boards: BoardData[] }) {
  const [activeId, setActiveId] = useState<ToolId>('daily')
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const active = boards.find((b) => b.id === activeId)!

  return (
    <div className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-[#555] mt-1.5 text-sm font-mono">
          Global top 10 · all cognitive benchmarks
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-[#1e1e1e]">
        <div className="flex gap-1">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveId(b.id)}
              className={`px-5 py-3 text-sm font-medium relative transition-colors ${
                activeId === b.id
                  ? 'text-[#00ff88]'
                  : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              {b.label}
              {activeId === b.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00ff88] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
        {activeId === 'daily' && (
          <div className="pb-3 pr-2 sm:pb-2">
            <input 
              type="date"
              value={dateParam}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams)
                if (e.target.value) {
                  params.set('date', e.target.value)
                } else {
                  params.delete('date')
                }
                router.push(`?${params.toString()}`)
              }}
              className="bg-[#111] border border-[#333] text-sm text-white px-3 py-1.5 rounded-md outline-none focus:border-[#00ff88] cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#111213] border border-[#1e1e1e] rounded-2xl overflow-hidden">
        {active.rows.length === 0 ? (
          <EmptyState tool={activeId} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-[0.15em] text-[#444] font-mono w-12">
                  Rank
                </th>
                <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-[0.15em] text-[#444] font-mono">
                  User
                </th>
                <th className="text-right px-4 py-3.5 text-[10px] uppercase tracking-[0.15em] text-[#444] font-mono">
                  Score
                </th>
                {active.hasAccuracy && (
                  <th className="text-right px-4 py-3.5 text-[10px] uppercase tracking-[0.15em] text-[#444] font-mono hidden sm:table-cell">
                    Accuracy
                  </th>
                )}
                <th className="text-right px-5 py-3.5 text-[10px] uppercase tracking-[0.15em] text-[#444] font-mono hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {active.rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#171717] last:border-b-0 transition-colors hover:bg-[#161618] ${
                    i === 0 ? 'bg-[#00ff88]/[0.03]' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="px-5 py-4 w-12">
                    <span
                      className={`text-sm font-bold font-mono tabular-nums ${
                        RANK_STYLE[i] ?? 'text-[#444]'
                      }`}
                    >
                      {RANK_LABEL[i] ?? i + 1}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-[#555]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                      <span
                        className={`text-sm font-medium truncate max-w-[140px] ${
                          i === 0 ? 'text-white' : 'text-[#aaa]'
                        }`}
                      >
                        {getUsername(row)}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`font-mono font-bold tabular-nums text-sm ${
                        i === 0 ? 'text-[#00ff88]' : 'text-white'
                      }`}
                    >
                      {row.score_value}
                    </span>
                    <span className="text-[#444] text-xs font-mono ml-1">
                      {active.unit}
                    </span>
                  </td>

                  {/* Accuracy */}
                  {active.hasAccuracy && (
                    <td className="px-4 py-4 text-right hidden sm:table-cell">
                      <span className="text-[#555] text-xs font-mono tabular-nums">
                        {row.accuracy != null ? `${row.accuracy}%` : '—'}
                      </span>
                    </td>
                  )}

                  {/* Date */}
                  <td className="px-5 py-4 text-right hidden md:table-cell">
                    <span className="text-[#444] text-xs font-mono">
                      {timeAgo(row.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-center text-[#2a2a2a] text-xs font-mono mt-8">
        Scores update in real-time · Sign in to appear on the board
      </p>
    </div>
  )
}

export default function LeaderboardClient({ boards }: { boards: BoardData[] }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <LeaderboardContent boards={boards} />
    </Suspense>
  )
}
