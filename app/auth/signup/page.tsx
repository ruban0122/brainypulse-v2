'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (username.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-semibold text-[#00ff88]">Account created!</h2>
          <p className="text-[#888] text-sm">
            Check your email for a confirmation link, then sign in.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 px-6 py-2.5 rounded-full border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-colors text-sm font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            Brainy<span className="text-[#00ff88]">Pulse</span>
          </Link>
          <p className="text-[#888] text-sm mt-2">Create an account to save your scores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="username" className="text-xs text-[#888] uppercase tracking-widest">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#00ff88] focus:outline-none transition-colors"
              placeholder="speedtyper99"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-xs text-[#888] uppercase tracking-widest">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#00ff88] focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs text-[#888] uppercase tracking-widest">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#00ff88] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[#ff4444] text-xs bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#00ff88] text-black font-semibold text-sm hover:bg-[#00cc6a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[#888] text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#00ff88] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
