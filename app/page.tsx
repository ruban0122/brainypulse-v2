import type { Metadata } from 'next'
import DailyHeroWrapper from '@/components/daily/DailyHeroWrapper'

export const metadata: Metadata = {
  title: 'BrainyPulse — Free Cognitive Tests: Typing Speed, Reaction Time, Memory & Maths',
  description:
    'Free online brain benchmark tests — type fast, react instantly, recall patterns, and solve maths. No signup. Instant results. Daily challenge. Global leaderboard.',
  keywords: [
    'free cognitive test',
    'brain test online',
    'typing speed test',
    'reaction time test',
    'memory test',
    'mental math test',
    'human benchmark alternative',
    'brain benchmark',
    'cognitive performance test',
    'free brain games',
    'no signup brain test',
  ],
  openGraph: {
    title: 'BrainyPulse — Free Cognitive Tests',
    description:
      'Typing speed, reaction time, visual memory, and mental maths. Free, instant, no signup.',
    url: 'https://brainypulse.com',
  },
  alternates: { canonical: 'https://brainypulse.com' },
}
import ToolNav from '@/components/ui/ToolNav'
import TypingTest from '@/components/tools/TypingTest'

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BrainyPulse',
            url: 'https://brainypulse.com',
            description:
              'Minimalist high-performance cognitive evaluation hub featuring typing speed, mathematical parsing, spatial memory, and millisecond reaction tracking.',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'All',
          }),
        }}
      />

      <div className="flex flex-col flex-1">
        <DailyHeroWrapper />
        <ToolNav active="typing" />
        <TypingTest />
      </div>
    </>
  )
}
