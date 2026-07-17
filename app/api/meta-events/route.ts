import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, clientIp } from '@/lib/email'
import { hasMarketingConsentCookie, isMetaCapiConfigured, sendMetaCapiEvent } from '@/lib/metaCapi'

// Relay for browser-initiated Conversions API events. The browser fires the
// pixel event directly (lib/metaPixel.ts) and posts the same payload here with
// a shared eventId so Meta deduplicates the two channels. Requests without the
// marketing-consent cookie are dropped, never forwarded.

const eventSchema = z.object({
  eventName: z.enum(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Contact', 'Lead']),
  eventId: z.string().regex(/^[\w-]{8,64}$/),
  eventSourceUrl: z.url().max(2048),
  customData: z
    .object({
      value: z.number().min(0).max(10_000_000).optional(),
      currency: z.string().length(3).optional(),
      content_ids: z.array(z.string().max(128)).max(50).optional(),
      content_name: z.string().max(256).optional(),
      content_type: z.string().max(64).optional(),
      contents: z
        .array(
          z.object({
            id: z.string().max(128),
            quantity: z.number().int().min(0).max(10_000),
            item_price: z.number().min(0).max(10_000_000).optional(),
          })
        )
        .max(50)
        .optional(),
      num_items: z.number().int().min(0).max(10_000).optional(),
    })
    .strict()
    .optional(),
})

export async function POST(request: NextRequest) {
  if (!isMetaCapiConfigured()) {
    return NextResponse.json({ success: true })
  }

  // Generous limit — PageViews arrive on every route change.
  if (!rateLimit(`meta:${clientIp(request.headers)}`, 60)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // No marketing consent: acknowledge and drop rather than error.
  if (!hasMarketingConsentCookie(request)) {
    return NextResponse.json({ success: true })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { eventName, eventId, eventSourceUrl, customData } = parsed.data
  await sendMetaCapiEvent({ request, eventName, eventId, eventSourceUrl, customData })

  return NextResponse.json({ success: true })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
