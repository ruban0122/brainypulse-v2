'use client'

import { useEffect, useRef } from 'react'

const ADSENSE_CLIENT = 'ca-pub-9880823545934880'

interface AdBannerProps {
  /** AdSense data-ad-slot value — find this in AdSense > Ads > By ad unit */
  adSlot: string
  /** Ad format: 'auto' for responsive, or a fixed shape */
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  /** Class name for the outer wrapper — controls layout/spacing */
  className?: string
  /** Show a small "Advertisement" label above the unit */
  showLabel?: boolean
}

export default function AdBanner({
  adSlot,
  adFormat = 'auto',
  className = '',
  showLabel = false,
}: AdBannerProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true

    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense loader script
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      // AdSense isn't loaded in some environments (e.g. localhost) — ignore
      console.warn('[AdBanner] AdSense push failed:', err)
    }
  }, [])

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {showLabel && (
        <p className="mb-1 select-none text-center text-[10px] uppercase tracking-widest text-gray-500">
          Advertisement
        </p>
      )}
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  )
}
