// Storage key + version for the persisted consent blob. Written by
// CookieConsentContext (localStorage + mirror cookie); read client-side by
// lib/metaPixel.ts and server-side by lib/metaCapi.ts.
export const CONSENT_STORAGE_KEY = 'squarage_cookie_consent'
export const CONSENT_VERSION = '1.0'

export interface CookieCategory {
  id: string
  name: string
  description: string
  required: boolean
}

export const cookieCategories: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Necessary Cookies',
    description: 'These cookies are essential for the website to function properly. They enable basic functions like page navigation, secure areas access, and shopping cart functionality.',
    required: true
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'These cookies enhance your experience by remembering your preferences, such as language settings, recently viewed products, and login details.',
    required: false
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'We use these cookies to understand how visitors interact with our website. This helps us improve our site and provide better products and services.',
    required: false
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'These cookies track your online activity to help us deliver more relevant advertising or limit how many times you see an ad.',
    required: false
  }
]

export type ConsentState = {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

// Opt-out model: everything on by default. We're a US company not selling
// into the EU; the banner and preferences modal let visitors turn categories
// off, and a stored rejection is always respected. Revisit if we ever target
// EU customers (GDPR requires opt-in defaults).
export const defaultConsentState: ConsentState = {
  necessary: true, // Always true
  functional: true,
  analytics: true,
  marketing: true
}