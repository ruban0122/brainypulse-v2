import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface GameState {
  isPlaying: boolean
  activeTool: 'typing' | 'memory' | 'maths' | 'reaction'
  score: number
  accuracy: number
  timeLeft: number
  gameDuration: number
  historyLogs: Record<string, unknown>[]
  setTool: (tool: 'typing' | 'memory' | 'maths' | 'reaction') => void
  startGame: (duration?: number) => void
  endGame: (userId?: string) => Promise<void>
  updateScore: (score: number, accuracy?: number) => void
  decrementTimer: () => void
  pushLog: (entry: Record<string, unknown>) => void
  clearLogs: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  isPlaying: false,
  activeTool: 'typing',
  score: 0,
  accuracy: 100,
  timeLeft: 60,
  gameDuration: 60,
  historyLogs: [],

  setTool: (tool) =>
    set((state) => ({
      activeTool: tool,
      isPlaying: false,
      score: 0,
      accuracy: 100,
      timeLeft: state.gameDuration,
      historyLogs: [],
    })),

  startGame: (duration) =>
    set((state) => {
      const dur = duration ?? state.gameDuration
      return { isPlaying: true, score: 0, accuracy: 100, timeLeft: dur, gameDuration: dur, historyLogs: [] }
    }),

  updateScore: (score, accuracy = 100) => set({ score, accuracy }),

  decrementTimer: () =>
    set((state) => {
      if (state.timeLeft <= 1) {
        return { timeLeft: 0, isPlaying: false }
      }
      return { timeLeft: state.timeLeft - 1 }
    }),

  endGame: async (userId) => {
    set({ isPlaying: false })
    const { score, accuracy, activeTool } = get()

    if (userId) {
      await supabase.from('scores').insert({
        user_id: userId,
        tool_type: activeTool,
        score_value: score,
        accuracy: accuracy,
      })
    }
  },

  pushLog: (entry) =>
    set((state) => ({ historyLogs: [...state.historyLogs, entry] })),

  clearLogs: () => set({ historyLogs: [] }),
}))
