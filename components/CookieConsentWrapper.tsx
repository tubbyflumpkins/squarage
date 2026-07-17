'use client'

import { useEffect, useState } from 'react'
import ConsentAwareAnalytics from './ConsentAwareAnalytics'
import CookieBanner from './CookieBanner'
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
  
  return (
    <>
      <ConsentAwareAnalytics />
      <MetaPixel />
      <CookieBanner />
      <ManageCookiesModal />
    </>
  )
}