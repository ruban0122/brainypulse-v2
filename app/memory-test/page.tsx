import type { Metadata } from 'next'
import ToolNav from '@/components/ui/ToolNav'
import MemoryTest from '@/components/tools/MemoryTest'
import ToolSEOSection from '@/components/ui/ToolSEOSection'

export const metadata: Metadata = {
  title: 'Memory Test — Free Visual Working Memory Test Online',
  description:
    'Test your visual working memory with an escalating tile-pattern challenge. Watch the sequence, repeat it back. Free, no signup, instant results with performance tiers.',
  keywords: [
    'memory test',
    'visual memory test',
    'working memory test',
    'short term memory test',
    'pattern recall test',
    'sequence memory test',
    'brain memory test',
    'online memory test free',
    'memory test online',
    'spatial memory test',
    'cognitive memory test',
    'memory game test',
    'human benchmark memory',
    'human benchmark sequence memory',
    'visual sequence test',
    'tile memory test',
    'memory benchmark',
    'test your memory',
    'how good is my memory',
    'working memory benchmark',
  ],
  openGraph: {
    title: 'Free Visual Memory Test — Pattern Recall | BrainyPulse',
    description:
      'Escalating tile-sequence challenge for working memory. Watch the pattern, repeat it back. How many levels can you reach? Free, no signup.',
    url: 'https://brainypulse.com/memory-test',
  },
  twitter: {
    title: 'Free Visual Memory Test | BrainyPulse',
    description:
      'Test your working memory. Watch the tiles flash, then repeat the pattern. How far can you go?',
  },
  alternates: { canonical: 'https://brainypulse.com/memory-test' },
}

const MEMORY_FAQ = [
  {
    q: 'What does this memory test measure?',
    a: "BrainyPulse's memory test measures your visual-spatial working memory — the ability to temporarily hold and recall sequences of spatial locations. It uses a 3×3 tile grid with escalating sequence length to stress-test short-term memory capacity.",
  },
  {
    q: 'What is working memory?',
    a: "Working memory is a cognitive system that temporarily holds information for active use. It's sometimes called 'short-term memory' and is critical for reasoning, learning, and decision-making. Adults typically hold 5–9 items in working memory at once (Miller's Law: 7 ± 2).",
  },
  {
    q: 'What is a good memory test score?',
    a: "Reaching level 6–8 is above average for most adults. Level 9–11 is advanced. Level 12+ is expert-tier (top 5%). Most people plateau around level 5–7 on a visual sequence test without training.",
  },
  {
    q: 'How many items can the average person remember?',
    a: "According to Miller's Law, the average person can hold 7 ± 2 items (5 to 9) in short-term memory. This varies by item type, age, and cognitive training. BrainyPulse starts at 3 tiles and grows — most adults peak around 7–8.",
  },
  {
    q: 'Can I train and improve my memory?',
    a: 'Yes. Consistent practice with working memory tasks, along with adequate sleep, physical exercise, and reduced stress, can meaningfully improve memory performance. Daily short sessions (10–15 min) show the best results.',
  },
  {
    q: 'How is this different from the Human Benchmark sequence memory test?',
    a: "BrainyPulse uses a 3×3 coloured tile grid (each tile has a unique colour identity), a lives system (3 lives), and an input countdown timer per level — making it more challenging and game-like. Scores are saved to a global leaderboard if you sign in.",
  },
]

export default function MemoryTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BrainyPulse Memory Test',
            url: 'https://brainypulse.com/memory-test',
            description:
              'Free online visual working memory test using escalating tile sequences. Watch, recall, repeat.',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'All',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />
      <div className="flex flex-col flex-1">
        <ToolNav active="memory" />
        <MemoryTest />
        <ToolSEOSection
          title="Free Visual Memory Test — Working Memory Benchmark"
          description="BrainyPulse's memory test challenges your visual working memory with an escalating tile sequence. Watch a 3×3 coloured grid flash a pattern, then tap the tiles in order. Each correct round adds one more tile. You have 3 lives — lose them all and your final level is your score. Input speed matters too, with a per-level countdown. No account required to play. Sign in to save your score to the global leaderboard."
          stats={[
            { label: 'Global avg level', value: '5–6' },
            { label: 'Expert threshold', value: '12+' },
            { label: 'Lives per game', value: '3' },
            { label: 'Signup required', value: 'No' },
          ]}
          faqs={MEMORY_FAQ}
          related={[
            { label: 'Typing Speed Test', href: '/typing-test', desc: 'WPM & accuracy benchmark' },
            { label: 'Reaction Time Test', href: '/reaction-test', desc: 'Measure your reflexes in ms' },
            { label: 'Maths Speed Test', href: '/maths-test', desc: 'Mental arithmetic benchmark' },
          ]}
          faqSchemaId="https://brainypulse.com/memory-test#faq"
        />
      </div>
    </>
  )
}
