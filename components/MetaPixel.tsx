'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useHasConsent } from '@/context/CookieConsentContext'
import { META_PIXEL_ID, initMetaPixel, trackMetaEvent } from '@/lib/metaPixel'

// Loads the Meta Pixel once marketing consent is granted and fires a PageView
// (browser + Conversions API, deduplicated) on every route change. The base
// code's automatic PageView is intentionally not used — firing manually lets
// us attach the shared eventID that CAPI deduplication requires.
export default function MetaPixel() {
  const hasMarketingConsent = useHasConsent('marketing')
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (!META_PIXEL_ID) return

    if (!hasMarketingConsent) {
      // Consent revoked mid-session: stop an already-loaded pixel. Queued on
      // the stub this is also Meta's default-deny pattern (revoke before init).
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('consent', 'revoke')
      }
      return
    }

    if (!initMetaPixel()) return
    window.fbq?.('consent', 'grant')

    if (lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname
      trackMetaEvent('PageView')
    }
  }, [hasMarketingConsent, pathname])

  return null
}
