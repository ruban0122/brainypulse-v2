import type { Metadata } from 'next'
import ToolNav from '@/components/ui/ToolNav'
import ReactionTest from '@/components/tools/ReactionTest'
import ToolSEOSection from '@/components/ui/ToolSEOSection'

export const metadata: Metadata = {
  title: 'Reaction Time Test — Free Reflex Speed Test Online (ms)',
  description:
    'Measure your reaction time in milliseconds. Wait for the green signal, click as fast as possible. Multi-trial tracking, best/average/variance stats. Free, no signup.',
  keywords: [
    'reaction time test',
    'reaction speed test',
    'reflex test',
    'reflex speed test',
    'response time test',
    'click speed test',
    'human reaction time',
    'what is my reaction time',
    'test my reflexes',
    'reaction time benchmark',
    'online reflex test',
    'free reaction test',
    'reaction time online',
    'visual reaction time test',
    'human benchmark reaction time',
    'human benchmark alternative',
    'click reaction test',
    'fast reaction test',
    'average reaction time',
    'millisecond reaction test',
  ],
  openGraph: {
    title: 'Free Reaction Time Test — Reflex Speed Benchmark | BrainyPulse',
    description:
      'How fast are your reflexes? Click when the box turns green. Measure reaction time in milliseconds with multi-trial stats. Free, no signup.',
    url: 'https://brainypulse.com/reaction-test',
  },
  twitter: {
    title: 'Free Reaction Time Test | BrainyPulse',
    description:
      'Test your reaction time in milliseconds. Click when it turns green. Instant results, no signup.',
  },
  alternates: { canonical: 'https://brainypulse.com/reaction-test' },
}

const REACTION_FAQ = [
  {
    q: 'What is the average human reaction time?',
    a: "The average human visual reaction time is 200–250 milliseconds (ms). This is the time from a visual stimulus appearing to your finger pressing a button. Audio stimuli produce slightly faster reactions (~150–180 ms). BrainyPulse measures visual reaction time.",
  },
  {
    q: 'What is a good reaction time?',
    a: 'Under 200 ms is exceptional. 200–250 ms is great. 250–300 ms is average. 300–400 ms is below average. Elite athletes and fighter pilots can sustain sub-180 ms reaction times. Caffeine, sleep, and arousal all affect your score.',
  },
  {
    q: 'What affects reaction time?',
    a: 'Key factors include age (peaks in early 20s), sleep quality (fatigue slows reactions by 10–30%), caffeine intake, stress levels, physical fitness, and practice. Alcohol and sleep deprivation are the largest negative factors.',
  },
  {
    q: 'Can you improve your reaction time with practice?',
    a: 'Yes, to a degree. Regular practice narrows the gap between minimum and average reaction times (reduces variance). But hard genetic limits exist for raw neural conduction speed. Sport-specific training improves anticipatory reaction (reading cues early) more than pure reflex speed.',
  },
  {
    q: 'Why does my reaction time vary between clicks?',
    a: "Natural variation of 30–80 ms between trials is normal. Your nervous system doesn't fire identically every time. Factors like attention, micro-fatigue, and random neural timing all contribute. BrainyPulse tracks variance (best vs. worst) so you can see your consistency.",
  },
  {
    q: 'What is a false start in reaction time testing?',
    a: 'A false start occurs when you click before the green signal appears — meaning you anticipated rather than reacted. BrainyPulse records false starts as fouls and shows them in your session results. Eliminating false starts is key to getting an accurate reaction time score.',
  },
]

export default function ReactionTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BrainyPulse Reaction Time Test',
            url: 'https://brainypulse.com/reaction-test',
            description:
              'Free online reaction time test. Measure visual reflex speed in milliseconds with multi-trial tracking and variance analysis.',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'All',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />
      <div className="flex flex-col flex-1">
        <ToolNav active="reaction" />
        <ReactionTest />
        <ToolSEOSection
          title="Free Reaction Time Test — Measure Your Reflex Speed in Milliseconds"
          description="BrainyPulse's reaction time test uses a randomised delay (1.5–5 seconds) before flashing the green signal, preventing anticipation. Click or press Space the instant the box turns green. Your response time is measured using the browser's performance.now() API for sub-millisecond accuracy. Take multiple attempts and track your best time, average, and variance. False starts are recorded as fouls."
          stats={[
            { label: 'Global avg', value: '~250 ms' },
            { label: 'Exceptional', value: '<200 ms' },
            { label: 'Timing accuracy', value: '<1 ms' },
            { label: 'Signup required', value: 'No' },
          ]}
          faqs={REACTION_FAQ}
          related={[
            { label: 'Typing Speed Test', href: '/typing-test', desc: 'WPM & accuracy benchmark' },
            { label: 'Memory Test', href: '/memory-test', desc: 'Pattern recall & working memory' },
            { label: 'Maths Speed Test', href: '/maths-test', desc: 'Mental arithmetic benchmark' },
          ]}
          faqSchemaId="https://brainypulse.com/reaction-test#faq"
        />
      </div>
    </>
  )
}
