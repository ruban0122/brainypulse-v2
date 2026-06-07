import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/ui/navbar'
import Footer from '@/components/ui/footer'

const ADSENSE_CLIENT = 'ca-pub-9880823545934880'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'BrainyPulse — Free Cognitive Tests: Typing Speed, Reaction Time, Memory & Maths',
    template: '%s | BrainyPulse',
  },
  description:
    'Free online cognitive benchmark tests — typing speed (WPM), reaction time (ms), visual memory, and mental maths. No signup, instant results, global leaderboard.',
  metadataBase: new URL('https://brainypulse.com'),
  keywords: [
    // Brand
    'brainypulse',
    // Hub
    'cognitive test',
    'brain test online',
    'free brain test',
    'cognitive benchmark',
    'brain performance test',
    'human benchmark',
    'human benchmark alternative',
    'brain games online',
    'mental fitness test',
    // Typing
    'typing test',
    'typing speed test',
    'wpm test',
    'words per minute test',
    'free typing test',
    'online typing test',
    // Reaction
    'reaction time test',
    'reaction speed test',
    'reflex test',
    'click speed test',
    // Memory
    'memory test',
    'visual memory test',
    'working memory test',
    'short term memory test',
    // Maths
    'mental math test',
    'math speed test',
    'mental arithmetic test',
    'arithmetic test online',
  ],
  openGraph: {
    title: 'BrainyPulse — Free Cognitive Tests',
    description:
      'Test your typing speed, reaction time, memory, and mental maths for free. Instant results, no signup required.',
    url: 'https://brainypulse.com',
    siteName: 'BrainyPulse',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrainyPulse — Free Cognitive Tests',
    description:
      'Typing speed, reaction time, memory, and mental maths — free benchmark tests with instant results.',
    site: '@brainypulse',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  category: 'education',
  verification: {
    // Replace with the token from Google Search Console > Settings >
    // Ownership verification > HTML tag (the value of the `content` attribute).
    google: 'REPLACE_WITH_SEARCH_CONSOLE_TOKEN',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-screen flex flex-col bg-[#0a0a0a] text-white antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <Script
          id="adsbygoogle-init"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
