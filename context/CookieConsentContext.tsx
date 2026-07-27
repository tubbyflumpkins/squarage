'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ConsentState, defaultConsentState, CONSENT_STORAGE_KEY, CONSENT_VERSION } from '@/lib/cookieCategories'

interface CookieConsentContextType {
  consent: ConsentState
  hasInteracted: boolean
  showBanner: boolean
  showModal: boolean
  updateConsent: (category: keyof ConsentState, value: boolean) => void
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (newConsent: ConsentState) => void
  openModal: () => void
  closeModal: () => void
  closeBanner: () => void
}

export const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

const CONSENT_COOKIE_NAME = CONSENT_STORAGE_KEY
const CONSENT_EXPIRY_DAYS = 365

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(defaultConsentState)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Load consent from localStorage/cookie
  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_COOKIE_NAME)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.version === CONSENT_VERSION) {
            setConsent(parsed.consent)
            setHasInteracted(true)
            setShowBanner(false)
            
            // Update Google Consent Mode
            updateGoogleConsent(parsed.consent)
          } else {
            // Version mismatch, show banner again
            setShowBanner(true)
          }
        } else {
          // No stored consent, show banner
          setShowBanner(true)
        }
      } catch (error) {
        console.error('Error loading consent:', error)
        setShowBanner(true)
      }
    }

    loadConsent()
  }, [])

  // Update Google Consent Mode
  const updateGoogleConsent = useCallback((consentState: ConsentState) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': consentState.analytics ? 'granted' : 'denied',
        'ad_storage': consentState.marketing ? 'granted' : 'denied',
        'functionality_storage': consentState.functional ? 'granted' : 'denied',
        'personalization_storage': consentState.marketing ? 'granted' : 'denied',
      })
    }
  }, [])

  // Save consent to localStorage and cookie
  const saveConsent = useCallback((newConsent: ConsentState) => {
    const data = {
      consent: newConsent,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    }
    
    // Save to localStorage
    localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(data))
    
    // Also set as a cookie for server-side access
    const expires = new Date()
    expires.setDate(expires.getDate() + CONSENT_EXPIRY_DAYS)
    document.cookie = `${CONSENT_COOKIE_NAME}=${JSON.stringify(data)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    
    // Update Google Consent Mode
    updateGoogleConsent(newConsent)
    
    setConsent(newConsent)
    setHasInteracted(true)
    setShowBanner(false)
    setShowModal(false)
  }, [updateGoogleConsent])

  const updateConsent = useCallback((category: keyof ConsentState, value: boolean) => {
    if (category === 'necessary') return // Can't change necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [category]: value
    }))
  }, [])

  const acceptAll = useCallback(() => {
    const allAccepted: ConsentState = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    saveConsent(allAccepted)
  }, [saveConsent])

  const rejectAll = useCallback(() => {
    const allRejected: ConsentState = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    saveConsent(allRejected)
  }, [saveConsent])

  const savePreferences = useCallback((newConsent: ConsentState) => {
    saveConsent({
      ...newConsent,
      necessary: true // Ensure necessary is always true
    })
  }, [saveConsent])

  const openModal = useCallback(() => {
    setShowModal(true)
    setShowBanner(false)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const closeBanner = useCallback(() => {
    setShowBanner(false)
  }, [])

  // Initialize Google Consent Mode with default state
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.gtag) {
      window.dataLayer = window.dataLayer || []
      window.gtag = function() {
        window.dataLayer.push(arguments)
      }
      
      // Set default consent state (opt-out model: granted until rejected)
      window.gtag('consent', 'default', {
        'analytics_storage': defaultConsentState.analytics ? 'granted' : 'denied',
        'ad_storage': defaultConsentState.marketing ? 'granted' : 'denied',
        'functionality_storage': defaultConsentState.functional ? 'granted' : 'denied',
        'personalization_storage': defaultConsentState.marketing ? 'granted' : 'denied',
        'wait_for_update': 2000, // Wait up to 2 seconds for consent update
      })
    }
  }, [])

  // Always render the Provider. An early `return <>{children}</>` while
  // consent loads swaps the tree's structure once loading finishes, which
  // makes React unmount and remount the ENTIRE app on every page load
  // (double-firing mount effects like analytics events). Children just see
  // defaultConsentState until the load effect runs.
  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasInteracted,
        showBanner,
        showModal,
        updateConsent,
        acceptAll,
        rejectAll,
        savePreferences,
        openModal,
        closeModal,
        closeBanner,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}

// Helper hook to check if a specific category is consented
export function useHasConsent(category: keyof ConsentState) {
  const { consent } = useCookieConsent()
  return consent[category]
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}