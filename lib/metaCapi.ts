// Server-side Meta Conversions API sender. Counterpart to lib/metaPixel.ts:
// browser events arrive here either via the /api/meta-events relay or directly
// from form routes (contact/quote), which pass the customer email so Meta gets
// a high-quality hashed match key.

import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { clientIp } from './email'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from './cookieCategories'

// Graph API version for Conversions API calls. Like SHOPIFY_API_VERSION, bump
// periodically — Meta supports each version for ~2 years. v25.0: Feb 2026.
export const META_GRAPH_API_VERSION = 'v25.0'

export function isMetaCapiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CONVERSIONS_API_ACCESS_TOKEN)
}

// Server-side read of the consent cookie written by CookieConsentContext.
// Any parse failure means "no consent" — never send by default.
export function hasMarketingConsentCookie(request: NextRequest): boolean {
  try {
    const raw = request.cookies.get(CONSENT_STORAGE_KEY)?.value
    if (!raw) return false
    let text = raw
    try {
      text = decodeURIComponent(raw)
    } catch {
      // Value was not URI-encoded; use it as-is
    }
    const parsed = JSON.parse(text)
    return parsed.version === CONSENT_VERSION && parsed.consent?.marketing === true
  } catch {
    return false
  }
}

// SHA-256 with Meta's required normalization (trim + lowercase) for match keys.
function hashUserField(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface MetaServerEventInput {
  request: NextRequest
  eventName: string
  eventId: string
  eventSourceUrl: string
  customData?: Record<string, unknown>
  // Plaintext values — hashed here before sending
  email?: string
  firstName?: string
  lastName?: string
}

// Send one event to the Conversions API. Never throws — tracking must not
// break the request it rides on. Callers are responsible for checking
// hasMarketingConsentCookie() first.
export async function sendMetaCapiEvent({
  request,
  eventName,
  eventId,
  eventSourceUrl,
  customData,
  email,
  firstName,
  lastName,
}: MetaServerEventInput): Promise<void> {
  if (!isMetaCapiConfigured()) return

  const userData: Record<string, unknown> = {
    client_ip_address: clientIp(request.headers),
    client_user_agent: request.headers.get('user-agent') || '',
  }
  // First-party cookies set by the browser pixel — sent unhashed per spec
  const fbp = request.cookies.get('_fbp')?.value
  const fbc = request.cookies.get('_fbc')?.value
  if (fbp) userData.fbp = fbp
  if (fbc) userData.fbc = fbc
  if (email) userData.em = [hashUserField(email)]
  if (firstName) userData.fn = [hashUserField(firstName)]
  if (lastName) userData.ln = [hashUserField(lastName)]

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: 'website',
        user_data: userData,
        ...(customData && Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      },
    ],
    // In the body, not the URL, so the token never lands in request logs
    access_token: process.env.META_CONVERSIONS_API_ACCESS_TOKEN,
  }
  // While set, events appear in Events Manager → Test Events instead of
  // production measurement. Remove the env var after verifying the setup.
  if (process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_TEST_EVENT_CODE
  }

  try {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`Meta CAPI ${eventName} failed (${res.status}):`, errText.slice(0, 500))
    }
  } catch (error) {
    console.error(`Meta CAPI ${eventName} error:`, error)
  }
}
