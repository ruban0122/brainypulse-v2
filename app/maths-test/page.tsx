import type { Metadata } from 'next'
import ToolNav from '@/components/ui/ToolNav'
import MathsTest from '@/components/tools/MathsTest'
import ToolSEOSection from '@/components/ui/ToolSEOSection'

export const metadata: Metadata = {
  title: 'Maths Speed Test — Free Mental Arithmetic Test Online',
  description:
    'Test your mental arithmetic speed with timed addition, subtraction, and multiplication problems. Measure calculations per minute (CPM). Free, no signup required.',
  keywords: [
    'maths test',
    'math speed test',
    'mental math test',
    'mental arithmetic test',
    'arithmetic test online',
    'math test online free',
    'math speed challenge',
    'calculations per minute',
    'mental maths test',
    'arithmetic speed test',
    'fast math test',
    'math quiz online',
    'mental calculation test',
    'speed math quiz',
    'brain math test',
    'cognitive maths test',
    'how fast can you do mental math',
    'mental math benchmark',
    'math reaction time',
    'arithmetic benchmark',
  ],
  openGraph: {
    title: 'Free Mental Maths Speed Test — Arithmetic Benchmark | BrainyPulse',
    description:
      'How fast can you solve mental arithmetic? Addition, subtraction, multiplication in 60 seconds. Free, no signup, instant CPM score.',
    url: 'https://brainypulse.com/maths-test',
  },
  twitter: {
    title: 'Mental Maths Speed Test | BrainyPulse',
    description:
      'Timed arithmetic benchmark — addition, subtraction, multiplication. How many can you solve per minute?',
  },
  alternates: { canonical: 'https://brainypulse.com/maths-test' },
}

const MATHS_FAQ = [
  {
    q: 'What does this maths test measure?',
    a: "BrainyPulse's maths test measures mental arithmetic speed — how many correct calculations you can perform per minute (CPM). It uses randomised addition, subtraction, and multiplication problems and auto-advances when you type the correct answer.",
  },
  {
    q: 'How many maths questions per minute is a good score?',
    a: '20+ correct calculations per minute (CPM) is above average. 30+ CPM is strong. 40+ CPM places you in the top tier. Most untrained adults score 15–25 CPM. Regular practice with timed arithmetic can push this significantly higher.',
  },
  {
    q: 'What is mental arithmetic?',
    a: "Mental arithmetic is the ability to perform mathematical calculations entirely in your head, without a calculator or pen and paper. It involves rapid number processing and is closely linked to working memory capacity and numerical fluency.",
  },
  {
    q: 'How can I improve my mental maths speed?',
    a: 'Practice timed arithmetic daily. Learn shortcuts like multiplying by 9 (× 10 then –1×), squaring numbers ending in 5, or breaking additions into round numbers. Consistent 10-minute daily sessions produce measurable gains within 2–3 weeks.',
  },
  {
    q: 'Does mental maths help the brain?',
    a: 'Yes. Research shows that mental arithmetic activates the prefrontal cortex and parietal lobe, areas responsible for working memory and attention. Regular mental maths practice is linked to better numerical fluency, sharper working memory, and slower age-related cognitive decline.',
  },
  {
    q: 'What operations does BrainyPulse maths test include?',
    a: 'The test uses addition (e.g. 43 + 57), subtraction (e.g. 82 − 34), and multiplication (e.g. 7 × 8). Problems are randomly generated each session. The answer advances automatically when correct — no Enter key needed. Wrong answers give a brief shake animation.',
  },
]

export default function MathsTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BrainyPulse Maths Speed Test',
            url: 'https://brainypulse.com/maths-test',
            description:
              'Free online mental arithmetic test. Solve addition, subtraction, and multiplication under time pressure. Measures calculations per minute.',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'All',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />
      <div className="flex flex-col flex-1">
        <ToolNav active="maths" />
        <MathsTest />
        <ToolSEOSection
          title="Free Mental Maths Speed Test — Calculations Per Minute"
          description="BrainyPulse's maths test challenges your mental arithmetic with randomised addition, subtraction, and multiplication problems under a 60-second timer. The test auto-advances the moment you type the correct answer — no submit button. Your score is measured in calculations per minute (CPM). A solve-velocity chart shows where you slowed down and which problem took longest."
          stats={[
            { label: 'Avg score (adult)', value: '~18 CPM' },
            { label: 'Expert threshold', value: '35+ CPM' },
            { label: 'Operations', value: '3 (+−×)' },
            { label: 'Signup required', value: 'No' },
          ]}
          faqs={MATHS_FAQ}
          related={[
            { label: 'Typing Speed Test', href: '/typing-test', desc: 'WPM & accuracy benchmark' },
            { label: 'Reaction Time Test', href: '/reaction-test', desc: 'Measure your reflexes in ms' },
            { label: 'Memory Test', href: '/memory-test', desc: 'Pattern recall & working memory' },
          ]}
          faqSchemaId="https://brainypulse.com/maths-test#faq"
        />
      </div>
    </>
  )
}
