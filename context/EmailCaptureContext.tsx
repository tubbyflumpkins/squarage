'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { submitEmailSubscription } from '@/lib/emailCapture'

interface EmailCaptureContextType {
  showPopup: boolean
  closePopup: () => void
  submitEmail: (email: string, consent: boolean) => Promise<{ success: boolean; message: string; discountCode?: string }>
  isDismissed: boolean
  hasSubmitted: boolean
  discountCode: string | null
}

const EmailCaptureContext = createContext<EmailCaptureContextType | undefined>(undefined)

const POPUP_DELAY = process.env.NODE_ENV === 'production' ? 30000 : 3000 // 30 seconds in production, 3 seconds in development
const STORAGE_KEY_DISMISSED = 'email_popup_dismissed'
const STORAGE_KEY_SUBMITTED = 'email_popup_submitted'
const STORAGE_KEY_LAST_VISIT = 'email_popup_last_visit'
const STORAGE_KEY_DISCOUNT = 'email_popup_discount_code'

export function EmailCaptureProvider({ children }: { children: ReactNode }) {
  const [showPopup, setShowPopup] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [discountCode, setDiscountCode] = useState<string | null>(null)

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true'
    const submitted = localStorage.getItem(STORAGE_KEY_SUBMITTED) === 'true'
    const lastVisit = localStorage.getItem(STORAGE_KEY_LAST_VISIT)
    const savedDiscountCode = localStorage.getItem(STORAGE_KEY_DISCOUNT)

    setIsDismissed(dismissed)
    setHasSubmitted(submitted)
    if (savedDiscountCode) {
      setDiscountCode(savedDiscountCode)
    }

    // Don't show if already dismissed or submitted
    if (dismissed || submitted) {
      return
    }

    // Store current visit time for future use
    const now = Date.now()
    localStorage.setItem(STORAGE_KEY_LAST_VISIT, now.toString())

    // Note: 24-hour cooldown logic is commented out to allow testing
    // Uncomment below to enforce 24-hour cooldown between showings
    /*
    if (lastVisit) {
      const lastVisitTime = parseInt(lastVisit)
      // If last visit was less than 24 hours ago, don't show
      if (now - lastVisitTime < 24 * 60 * 60 * 1000) {
        return
      }
    }
    */

    // Show popup after delay
    const timer = setTimeout(() => {
      setShowPopup(true)
    }, POPUP_DELAY)

    return () => clearTimeout(timer)
  }, [])

  const closePopup = useCallback(() => {
    setShowPopup(false)
    setIsDismissed(true)
    localStorage.setItem(STORAGE_KEY_DISMISSED, 'true')
  }, [])

  const submitEmail = useCallback(async (email: string, consent: boolean): Promise<{ success: boolean; message: string; discountCode?: string }> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Please enter a valid email address' }
      }

      // Consent is now implicit when submitting the form

      // Submit to API
      const response = await submitEmailSubscription({
        email,
        consentMarketing: consent
      })

      if (response.success) {
        // Store discount code if provided
        if (response.discountCode) {
          setDiscountCode(response.discountCode)
          localStorage.setItem(STORAGE_KEY_DISCOUNT, response.discountCode)
        }

        // For existing subscribers, don't mark as permanently submitted
        // This allows them to see the popup again on future visits if needed
        if (!response.isExisting) {
          // Mark as submitted only for new subscribers
          setHasSubmitted(true)
          localStorage.setItem(STORAGE_KEY_SUBMITTED, 'true')
        } else {
          // For existing subscribers, just dismiss for this session
          setIsDismissed(true)
          localStorage.setItem(STORAGE_KEY_DISMISSED, 'true')
        }

        // Never auto-close popup - user must close manually
        // This ensures they see and can copy their discount code

        return { success: true, message: response.message, discountCode: response.discountCode }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      console.error('Email signup error:', error)
      return { success: false, message: 'Something went wrong. Please try again.' }
    }
  }, [])

  return (
    <EmailCaptureContext.Provider value={{
      showPopup,
      closePopup,
      submitEmail,
      isDismissed,
      hasSubmitted,
      discountCode
    }}>
      {children}
    </EmailCaptureContext.Provider>
  )
}

export function useEmailCapture() {
  const context = useContext(EmailCaptureContext)
  if (context === undefined) {
    throw new Error('useEmailCapture must be used within EmailCaptureProvider')
  }
  return context
}