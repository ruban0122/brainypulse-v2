'use client'

import Link from 'next/link'
import { useGameStore } from '@/store/useGameStore'

const TOOLS = [
  { id: 'typing',   label: 'Typing',   href: '/typing-test' },
  { id: 'memory',   label: 'Memory',   href: '/memory-test' },
  { id: 'maths',    label: 'Maths',    href: '/maths-test' },
  { id: 'reaction', label: 'Reaction', href: '/reaction-test' },
] as const

type ToolId = (typeof TOOLS)[number]['id']

export default function ToolNav({ active }: { active: ToolId }) {
  const isPlaying = useGameStore((s) => s.isPlaying)

  return (
    <nav
      className={`flex border-b border-[#222] transition-opacity duration-500 mt-4 ${
        isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {TOOLS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`relative px-6 py-4 text-sm font-medium transition-colors ${
            active === t.id
              ? 'text-[#00ff88]'
              : 'text-[#888] hover:text-white'
          }`}
        >
          {t.label}
          {active === t.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00ff88]" />
          )}
        </Link>
      ))}
    </nav>
  )
}
