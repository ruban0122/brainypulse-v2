import type { Metadata } from 'next'
import ToolNav from '@/components/ui/ToolNav'
import TypingTest from '@/components/tools/TypingTest'
import ToolSEOSection from '@/components/ui/ToolSEOSection'

export const metadata: Metadata = {
  title: 'Typing Speed Test — Free WPM Test Online, No Signup',
  description:
    'Take a free typing speed test and measure your WPM instantly. Real-time accuracy tracking, performance tiers, timer options, and keyboard sound effects. No account needed.',
  keywords: [
    'typing test',
    'typing speed test',
    'wpm test',
    'words per minute test',
    'free typing test',
    'online typing test',
    'type test',
    'typing benchmark',
    'keyboard speed test',
    'typing speed checker',
    'how fast can i type',
    'test my typing speed',
    'wpm checker',
    'touch typing test',
    'monkeytype alternative',
    'keybr alternative',
    'typing practice test',
    'typing accuracy test',
    'net wpm test',
    'gross wpm test',
  ],
  openGraph: {
    title: 'Free Typing Speed Test — WPM Benchmark | BrainyPulse',
    description:
      'Measure your typing speed in words per minute. Real-time WPM + accuracy. Timer options: 15s, 30s, 60s, 120s. Free, no signup.',
    url: 'https://brainypulse.com/typing-test',
  },
  twitter: {
    title: 'Free Typing Speed Test — WPM Benchmark | BrainyPulse',
    description:
      'How fast do you type? Free WPM test with real-time accuracy tracking and performance tiers.',
  },
  alternates: { canonical: 'https://brainypulse.com/typing-test' },
}

const TYPING_FAQ = [
  {
    q: 'What is a good typing speed in WPM?',
    a: '60 WPM is considered a good typing speed for most professionals. The average person types around 40 WPM. Above 80 WPM is expert-level, and 100+ WPM puts you in the top 1% worldwide.',
  },
  {
    q: 'What is the average typing speed?',
    a: 'The global average typing speed is approximately 40 words per minute (WPM) with around 92% accuracy. Most office workers type between 38–45 WPM. Professional typists typically reach 65–75 WPM.',
  },
  {
    q: 'How is WPM calculated?',
    a: 'Net WPM = (total characters typed ÷ 5) ÷ minutes elapsed, then subtract errors. Dividing by 5 standardises to an average word length. BrainyPulse uses net WPM (accuracy-penalised) for fair scoring.',
  },
  {
    q: 'How can I improve my typing speed?',
    a: 'Practice daily for 15–20 minutes using a timed typing test. Focus on accuracy first — speed follows naturally. Use all 10 fingers (touch typing), avoid looking at the keyboard, and start slow before building pace.',
  },
  {
    q: 'Is 100 WPM fast?',
    a: 'Yes — 100 WPM is exceptionally fast. At that speed, you type roughly 500 characters per minute with high accuracy. Only around 1–2% of typists reach this benchmark. Professional transcriptionists and competitive typists typically operate at 80–120 WPM.',
  },
  {
    q: 'What is the world record typing speed?',
    a: 'The Guinness World Record for typing speed is 212 WPM, set by Stella Pajunas in 1946 on an IBM electric typewriter. In modern keyboard competitions, top speeds exceed 300 WPM in short bursts.',
  },
]

export default function TypingTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BrainyPulse Typing Speed Test',
            url: 'https://brainypulse.com/typing-test',
            description:
              'Free online typing speed test. Measure WPM and accuracy in real time with timer options and keyboard sound effects.',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'All',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />
      <div className="flex flex-col flex-1">
        <ToolNav active="typing" />
        <TypingTest />
        <ToolSEOSection
          title="Free Typing Speed Test — Measure Your WPM"
          description="BrainyPulse's typing speed test measures your words per minute (WPM) and accuracy in real time. Choose from 15s, 30s, 60s, or 120s timer modes. The test calculates net WPM (penalised for errors) and gives you a performance tier — Beginner, Average, Good, Advanced, Expert, or Master. No account required. Your score is saved if you sign in."
          stats={[
            { label: 'Global avg WPM', value: '40' },
            { label: 'Expert threshold', value: '80+' },
            { label: 'Timer options', value: '4' },
            { label: 'Signup required', value: 'No' },
          ]}
          faqs={TYPING_FAQ}
          related={[
            { label: 'Reaction Time Test', href: '/reaction-test', desc: 'Measure your reflexes in ms' },
            { label: 'Memory Test', href: '/memory-test', desc: 'Pattern recall & working memory' },
            { label: 'Maths Speed Test', href: '/maths-test', desc: 'Mental arithmetic benchmark' },
          ]}
          faqSchemaId="https://brainypulse.com/typing-test#faq"
        />
      </div>
    </>
  )
}
