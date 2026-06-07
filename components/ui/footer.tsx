'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/store/useGameStore'

export default function Footer() {
  const isPlaying = useGameStore((s) => s.isPlaying)
  const pathname = usePathname()

  // The home page is the testing hub — keep it distraction-free, no footer.
  // The daily and leaderboard pages are also standalone, so hide footer there.
  if (pathname === '/' || pathname.startsWith('/daily') || pathname.startsWith('/leaderboard')) return null

  return (
    <footer
      className={`border-t border-[#222] px-6 py-8 transition-opacity duration-500 ${
        isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <p className="text-sm font-bold">
            Brainy<span className="text-[#00ff88]">Pulse</span>
          </p>
          <p className="text-xs text-[#888] mt-1 max-w-xs leading-relaxed">
            Cognitive benchmarking for typing speed, spatial memory, arithmetic
            parsing, and millisecond reaction tracking.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 text-xs text-[#888]">
          <div className="space-y-2">
            <p className="text-[#555] uppercase tracking-widest text-[10px]">Tests</p>
            <Link href="/?tool=typing" className="block hover:text-white transition-colors">
              Typing Speed
            </Link>
            <Link href="/?tool=memory" className="block hover:text-white transition-colors">
              Memory Grid
            </Link>
            <Link href="/?tool=maths" className="block hover:text-white transition-colors">
              Math Sprint
            </Link>
            <Link href="/?tool=reaction" className="block hover:text-white transition-colors">
              Reaction Time
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-[#555] uppercase tracking-widest text-[10px]">Site</p>
            <Link href="/leaderboard" className="block hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/auth/login" className="block hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="block hover:text-white transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-[#333] mt-8 tracking-wide">
        © {new Date().getFullYear()} BrainyPulse · brainypulse.com · Measure what matters.
      </p>
    </footer>
  )
}
