'use client'

import { useGameStore } from '@/store/useGameStore'
import DailyHeroCard from './DailyHeroCard'

export default function DailyHeroWrapper() {
  const isPlaying = useGameStore((s) => s.isPlaying)
  if (isPlaying) return null
  return (
    <div className="px-4 pt-4">
      <DailyHeroCard />
    </div>
  )
}
