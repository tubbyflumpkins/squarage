// Client-side Meta Pixel helpers. Consent is opt-out: the pixel loads and
// fires by default, and an explicit "marketing" rejection stops both the
// browser pixel and the Conversions API relay at call time.
//
// Every event goes out through BOTH channels (browser fbq + /api/meta-events →
// Conversions API) with a shared eventId so Meta deduplicates the pair. See
// lib/metaCapi.ts for the server half.

import { useEffect, useRef } from 'react'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './cookieCategories'

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

export type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Contact'
  | 'Lead'

export interface MetaCustomData {
  value?: number
  currency?: string
  content_ids?: string[]
  content_name?: string
  content_type?: string
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  num_items?: number
}

export function generateMetaEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

// Read marketing consent straight from the stored consent blob so non-React
// code paths (cart actions, checkout handoff) can check it at call time.
// Opt-out model: only an explicit stored rejection blocks tracking. No blob
// (visitor never touched the banner) means the default applies — granted.
export function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!stored) return true
    const parsed = JSON.parse(stored)
    if (parsed.version !== CONSENT_VERSION) return true
    return parsed.consent?.marketing !== false
  } catch {
    return true
  }
}

// The official base-code IIFE, unrolled: create the fbq command queue stub so
// events can be queued before fbevents.js finishes loading.
function ensureFbqStub(): void {
  if (typeof window === 'undefined' || window.fbq) return
  const fbq: any = function (...args: any[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args)
    } else {
      fbq.queue.push(args)
    }
  }
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  if (!window._fbq) window._fbq = fbq
}

let pixelInitialized = false

// Idempotent: safe to call from any event site. Returns true when the pixel
// is (now) initialized, false when config or consent is missing.
export function initMetaPixel(): boolean {
  if (typeof window === 'undefined' || !META_PIXEL_ID || !hasMarketingConsent()) return false
  if (pixelInitialized) return true
  ensureFbqStub()
  window.fbq?.('init', META_PIXEL_ID)
  if (!document.getElementById('meta-pixel-script')) {
    const script = document.createElement('script')
    script.id = 'meta-pixel-script'
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }
  pixelInitialized = true
  return true
}

// Browser-pixel half only, with a caller-supplied eventId. Used by form flows
// where the API route sends the matching Conversions API event itself (it has
// the email for advanced matching).
export function trackMetaBrowserEvent(
  eventName: MetaEventName,
  customData: MetaCustomData,
  eventId: string
): void {
  if (!initMetaPixel()) return
  window.fbq?.('track', eventName, customData, { eventID: eventId })
}

// Fire an event through both channels: the browser pixel and (via our relay
// route) the Conversions API. The shared eventId lets Meta deduplicate.
export function trackMetaEvent(eventName: MetaEventName, customData: MetaCustomData = {}): void {
  if (!initMetaPixel()) return
  const eventId = generateMetaEventId()
  window.fbq?.('track', eventName, customData, { eventID: eventId })
  try {
    fetch('/api/meta-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        customData,
      }),
      // Survives the navigation away during the checkout handoff
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Tracking must never break the UI
  }
}

// Fire ViewContent once per distinct product viewed on a page. Consent is
// checked at call time inside trackMetaEvent; the Set guards StrictMode
// double-effects and, on the Mateo page (where the product prop switches
// with the style toggle), re-fires only for products not yet seen.
export function useMetaViewContent(product: {
  id: string
  title: string
  handle: string
  variants: Array<{ id: string; price: { amount: string; currencyCode: string } }>
}): void {
  const trackedHandles = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (trackedHandles.current.has(product.handle)) return
    trackedHandles.current.add(product.handle)
    const firstVariant = product.variants?.[0]
    trackMetaEvent('ViewContent', {
      content_ids: [firstVariant?.id || product.id],
      content_name: product.title,
      content_type: 'product',
      value: parseFloat(firstVariant?.price?.amount || '0'),
      currency: firstVariant?.price?.currencyCode || 'USD',
    })
  }, [product])
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: any
  }
}
