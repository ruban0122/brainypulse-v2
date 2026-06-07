import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'BrainyPulse — Free Cognitive Tests'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 100px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'monospace',
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            opacity: 0.3,
            display: 'flex',
          }}
        />

        {/* Glow blob top-right */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: '#00ff88',
            opacity: 0.04,
            filter: 'blur(80px)',
            display: 'flex',
          }}
        />

        {/* Pulse waveform — large, right side */}
        <svg
          style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-50%)' }}
          width="480"
          height="220"
          viewBox="0 0 380 180"
          fill="none"
        >
          <defs>
            <filter id="glow2" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M0 90 L110 90 L130 115 L148 65 L162 148 L190 12 L218 148 L232 65 L250 115 L270 90 L380 90"
            stroke="#00ff88"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow2)"
            opacity="0.9"
          />
        </svg>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: '#111',
                border: '2px solid #1e1e1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="16" viewBox="0 0 380 180" fill="none">
                <path
                  d="M0 90 L110 90 L130 115 L148 65 L162 148 L190 12 L218 148 L232 65 L250 115 L270 90 L380 90"
                  stroke="#00ff88"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={{ color: '#666', fontSize: 18, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              BrainyPulse
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 64,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: 20,
              maxWidth: 580,
            }}
          >
            <span>Free Cognitive</span>
            <span style={{ color: '#00ff88' }}>Tests</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 22,
              color: '#666',
              marginBottom: 44,
              maxWidth: 500,
              lineHeight: 1.5,
            }}
          >
            Typing speed · Reaction time · Memory · Mental maths
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', gap: 12 }}>
            {['Free', 'No signup', 'Instant results', 'Global leaderboard'].map((tag) => (
              <div
                key={tag}
                style={{
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: 100,
                  padding: '8px 18px',
                  color: '#888',
                  fontSize: 14,
                  letterSpacing: '0.05em',
                  display: 'flex',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #00ff88, transparent)',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
