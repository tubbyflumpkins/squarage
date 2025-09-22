'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { useHasConsent } from '@/context/CookieConsentContext'

const GA_ID = 'G-ZCYJMQJLE1'
const CLARITY_ID = 'sy4kv4wk64'

export default function ConsentAwareAnalytics() {
  const hasAnalyticsConsent = useHasConsent('analytics')

  // Initialize Google Consent Mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.gtag = function() {
        window.dataLayer.push(arguments)
      }
      
      // Set initial consent state
      window.gtag('consent', 'default', {
        'analytics_storage': hasAnalyticsConsent ? 'granted' : 'denied',
        'ad_storage': 'denied',
        'functionality_storage': 'denied',
        'personalization_storage': 'denied',
        'wait_for_update': 2000,
      })
    }
  }, [hasAnalyticsConsent])

  // Update consent when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': hasAnalyticsConsent ? 'granted' : 'denied',
      })
    }
  }, [hasAnalyticsConsent])

  // Initialize Microsoft Clarity when consent is granted
  useEffect(() => {
    if (hasAnalyticsConsent && typeof window !== 'undefined') {
      // Check if Clarity is already initialized
      if ('clarity' in window) return

      // Initialize Clarity
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`
      
      // Add Clarity initialization
      const initScript = document.createElement('script')
      initScript.innerHTML = `
        window.clarity = window.clarity || function(){(window.clarity.q = window.clarity.q || []).push(arguments)};
      `
      
      document.head.appendChild(initScript)
      document.head.appendChild(script)
    }
  }, [hasAnalyticsConsent])

  return (
    <>
      {/* Google Analytics - Always load but respect consent mode */}
      <Script
        id="google-analytics-gtm"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              anonymize_ip: true,
              cookie_flags: 'SameSite=Lax;Secure'
            });
          `,
        }}
      />
      
      {/* Microsoft Clarity - Only loads when consent is granted via useEffect */}
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    clarity: (...args: any[]) => void
  }
}