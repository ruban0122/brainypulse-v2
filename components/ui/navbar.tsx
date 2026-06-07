'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const isPlaying = useGameStore((s) => s.isPlaying)
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
        if (data?.username) setUsername(data.username)
      }
    }
    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
        setUsername(data?.username ?? null)
      } else {
        setUsername(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 border-b border-[#222] transition-opacity duration-500 ${
        isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <Link 
        href="/" 
        onClick={(e) => {
          if (pathname === '/') {
            e.preventDefault()
            window.location.reload()
          }
        }}
        className="text-xl font-bold tracking-tight select-none"
      >
        Brainy<span className="text-[#00ff88]">Pulse</span>
      </Link>

      <nav className="flex items-center gap-6 text-sm">
        <Link
          href="/leaderboard"
          className="text-[#888] hover:text-white transition-colors"
        >
          Leaderboard
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 text-[#555]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <span className="text-[#555] text-xs truncate max-w-[120px]">
                {username || user.email}
              </span>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-[#888] hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-[#888] hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-1.5 rounded-full border border-[#00ff88] text-[#00ff88] text-sm hover:bg-[#00ff88] hover:text-black transition-colors font-medium"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
