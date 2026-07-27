'use client'

import { useEffect, useState } from 'react'
import ConsentAwareAnalytics from './ConsentAwareAnalytics'
import ManageCookiesModal from './ManageCookiesModal'
import MetaPixel from './MetaPixel'

export default function CookieConsentWrapper() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render on server
  if (!mounted) {
    return null
  }
  
  // No cookie banner: consent is opt-out (US audience) and the privacy policy
  // plus the footer "Cookie Preferences" button carry disclosure and opt-out.
  // CookieBanner.tsx is kept unmounted in case an EU pivot needs it back.
  return (
    <>
      <ConsentAwareAnalytics />
      <MetaPixel />
      <ManageCookiesModal />
    </>
  )
}