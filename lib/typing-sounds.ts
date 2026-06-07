export interface SoundDef {
  id: string
  label: string
  icon: string
  play: (ctx: AudioContext, isError: boolean) => void
}

export function createOsc(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  gain: number,
  duration: number,
  attack = 0.004,
  decay = 0.01
) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  env.gain.setValueAtTime(0, ctx.currentTime)
  env.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack)
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay + duration)
  osc.connect(env)
  env.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + attack + decay + duration)
}

export function createNoise(ctx: AudioContext, gain: number, duration: number, filterFreq = 8000) {
  const bufferSize = Math.ceil(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const env = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq
  env.gain.setValueAtTime(gain, ctx.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  src.connect(filter)
  filter.connect(env)
  env.connect(ctx.destination)
  src.start()
  src.stop(ctx.currentTime + duration)
}

export const SOUNDS: SoundDef[] = [
  {
    id: 'cherry',
    label: 'Cherry MX',
    icon: '🍒',
    play(ctx, err) {
      const f = err ? 180 : 320
      createOsc(ctx, 'square', f, 0.08, 0.04)
      createNoise(ctx, 0.06, 0.05, 4000)
    },
  },
  {
    id: 'blue',
    label: 'Clicky Blue',
    icon: '🔵',
    play(ctx, err) {
      const f = err ? 200 : 420
      createOsc(ctx, 'square', f, 0.1, 0.02)
      createOsc(ctx, 'square', f * 1.5, 0.05, 0.015)
      createNoise(ctx, 0.08, 0.04, 6000)
    },
  },
  {
    id: 'brown',
    label: 'Tactile Brown',
    icon: '🟤',
    play(ctx, err) {
      const f = err ? 160 : 280
      createOsc(ctx, 'sine', f, 0.12, 0.06, 0.002, 0.02)
      createNoise(ctx, 0.04, 0.06, 3000)
    },
  },
  {
    id: 'red',
    label: 'Linear Red',
    icon: '🔴',
    play(ctx, err) {
      const f = err ? 140 : 260
      createOsc(ctx, 'sine', f, 0.1, 0.05, 0.001, 0.03)
      createNoise(ctx, 0.03, 0.05, 2500)
    },
  },
  {
    id: 'typewriter',
    label: 'Typewriter',
    icon: '🖊️',
    play(ctx, err) {
      const f = err ? 120 : 200
      createNoise(ctx, 0.12, 0.08, 2000)
      createOsc(ctx, 'sawtooth', f, 0.07, 0.03)
    },
  },
  {
    id: 'soft',
    label: 'Soft Thud',
    icon: '🧸',
    play(ctx, err) {
      const f = err ? 80 : 140
      createOsc(ctx, 'sine', f, 0.15, 0.1, 0.001, 0.04)
    },
  },
  {
    id: 'space',
    label: 'Space Bar',
    icon: '🚀',
    play(ctx, err) {
      const f = err ? 100 : 180
      createOsc(ctx, 'sine', f, 0.2, 0.12, 0.002, 0.05)
      createNoise(ctx, 0.05, 0.1, 1500)
    },
  },
  {
    id: 'pop',
    label: 'Bubble Pop',
    icon: '🫧',
    play(ctx, err) {
      const start = err ? 300 : 600
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(start, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(err ? 100 : 200, ctx.currentTime + 0.08)
      env.gain.setValueAtTime(0.15, ctx.currentTime)
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
      osc.connect(env)
      env.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    },
  },
  {
    id: 'laser',
    label: 'Laser Tick',
    icon: '⚡',
    play(ctx, err) {
      const start = err ? 800 : 1200
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(start, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(err ? 200 : 400, ctx.currentTime + 0.05)
      env.gain.setValueAtTime(0.07, ctx.currentTime)
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      osc.connect(env)
      env.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.07)
    },
  },
  {
    id: 'piano',
    label: 'Piano Key',
    icon: '🎹',
    play(ctx, err) {
      const freqs = err ? [261, 330] : [523, 659]
      freqs.forEach((f, i) => {
        createOsc(ctx, 'sine', f, 0.12 - i * 0.04, 0.2, 0.001, 0.1)
      })
    },
  },
]
