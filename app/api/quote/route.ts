import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { sendStudioMail, sendCustomerMail, isSmtpConfigured, rateLimit, clientIp } from '@/lib/email'
import { buildStudioQuoteEmail, buildCustomerQuoteEmail } from '@/lib/quoteEmails'
import { hasMarketingConsentCookie, sendMetaCapiEvent } from '@/lib/metaCapi'

// Use z.coerce for numeric/boolean fields to handle production builds
// where values may arrive as strings instead of their original types
const coerceBoolean = z.preprocess(
  (v) => (v === 'true' ? true : v === 'false' ? false : v),
  z.boolean(),
)

const quoteSchema = z.object({
  designName: z.string().min(1, 'Design name is required').max(100),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  message: z.string().max(5000).optional().default(''),
  specs: z.object({
    shelfType: z.enum(['flat', 'corner']),
    // The console is a flat shelf; older clients send no variant
    variant: z.enum(['standard', 'corner', 'console']).optional(),
    width: z.coerce.number().min(0).max(1000),
    height: z.coerce.number().min(0).max(1000),
    depth: z.coerce.number().min(0).max(1000),
    length: z.coerce.number().min(0).max(1000),
    shelfCount: z.coerce.number().min(0).max(200),
    columnCount: z.coerce.number().min(0).max(200),
    roundLeft: coerceBoolean.optional(),
    roundRight: coerceBoolean.optional(),
    finish: z.string().max(60),
    amplitude: z.coerce.number(),
    shelfOffset: z.coerce.number(),
    columnOffset: z.coerce.number(),
    columnAngle: z.coerce.number().optional(),
    estimatedPrice: z.coerce.number().min(0).max(1_000_000),
    // What the shelf is for, when the designer set its shelf count from a style (its label, for the email)
    shelfStyle: z.string().max(40).optional(),
  }),
  savedDesignJson: z.string().max(100_000),
  // Browser-generated id for Meta Pixel / Conversions API deduplication
  metaEventId: z.string().regex(/^[\w-]{8,64}$/).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Best-effort rate limit (see lib/email.ts). Complement with Vercel WAF.
    if (!rateLimit(`quote:${clientIp(request.headers)}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validationResult = quoteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const { designName, customerName, email, message, specs, savedDesignJson, metaEventId } = validationResult.data

    if (!isSmtpConfigured()) {
      console.error('Missing required environment variables: SMTP_USER, SMTP_PASS')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const input = {
      designName: designName.trim(),
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      specs,
      savedDesignJson,
      // Labs' origin, for the studio email's "Load into Squarage Labs" button
      labsOrigin: process.env.LABS_API_URL,
    }

    // The studio's copy first: the request fails if this one does
    const studio = buildStudioQuoteEmail(input)
    const info = await sendStudioMail(studio)
    console.log('Quote email sent:', info.messageId)

    // The customer's confirmation, best effort: the request has already done its job
    try {
      const sent = await sendCustomerMail(buildCustomerQuoteEmail(input))
      console.log('Quote confirmation sent:', sent.messageId)
    } catch (err) {
      console.error('Quote confirmation failed:', err)
    }

    // Meta Conversions API "Lead" event — consent-gated, with hashed email
    // as a high-quality match key. sendMetaCapiEvent never throws.
    if (hasMarketingConsentCookie(request)) {
      const [firstName, ...restName] = input.customerName.split(/\s+/)
      await sendMetaCapiEvent({
        request,
        eventName: 'Lead',
        eventId: metaEventId || randomUUID(),
        eventSourceUrl: request.headers.get('referer') || 'https://www.squarage.com/collections/warped/designer',
        email: input.email,
        firstName,
        lastName: restName.join(' ') || undefined,
        customData: {
          value: specs.estimatedPrice,
          currency: 'USD',
          content_name: 'Warped Shelf Quote',
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Quote request sent successfully' })
  } catch (error) {
    console.error('Error sending quote email:', error)
    return NextResponse.json(
      { error: 'Failed to send quote request. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
