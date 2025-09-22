'use client'

import { useContext } from 'react'
import { CookieConsentContext } from '@/context/CookieConsentContext'

export default function CookiePreferencesButton() {
  const context = useContext(CookieConsentContext)
  
  // If context is not available, don't render the button
  if (!context) {
    return null
  }
  
  return (
    <button
      onClick={context.openModal}
      className="text-sm opacity-70 hover:opacity-100 underline transition-opacity"
    >
      Cookie Preferences
    </button>
  )
}