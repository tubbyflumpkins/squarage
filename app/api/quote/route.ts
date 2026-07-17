import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { sendStudioMail, escapeHtml, isSmtpConfigured, rateLimit, clientIp } from '@/lib/email'
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

    const data = {
      designName: designName.trim(),
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    }
    const safe = {
      designName: escapeHtml(data.designName),
      customerName: escapeHtml(data.customerName),
      email: escapeHtml(data.email),
      message: escapeHtml(data.message),
      savedDesignJson: escapeHtml(savedDesignJson),
    }

    const specRows = [
      ['Type', specs.shelfType === 'corner' ? 'Corner Unit' : 'Standard (Flat)'],
      ['Width', `${specs.width}"`],
      ['Height', `${specs.height}"`],
      ['Depth', `${specs.depth}"`],
      ...(specs.shelfType === 'corner' ? [['Length', `${specs.length}"`]] : []),
      ['Shelves', String(specs.shelfCount)],
      ['Columns', String(specs.columnCount)],
      ['Finish', specs.finish],
      ...(specs.shelfType === 'flat' ? [['Round Edges', `L: ${specs.roundLeft ? 'Yes' : 'No'} / R: ${specs.roundRight ? 'Yes' : 'No'}`]] : []),
      ['Amplitude', specs.amplitude.toFixed(2)],
      ['Shelf Offset', String(specs.shelfOffset)],
      ['Column Offset', String(specs.columnOffset)],
      ...(specs.columnAngle !== undefined ? [['Column Angle', `${specs.columnAngle.toFixed(1)}°`]] : []),
    ]

    const emailSubject = `Warped Shelf Quote: "${data.designName}" - from ${data.customerName}`

    const emailText = `
Warped Shelf Quote Request
==========================

Customer: ${data.customerName}
Email: ${data.email}
${data.message ? `Message: ${data.message}` : ''}

Design: "${data.designName}"

Specs:
${specRows.map(([k, v]) => `  ${k}: ${v}`).join('\n')}
  Estimated Price: $${Math.round(specs.estimatedPrice)}

---
Saved Design JSON (paste into localStorage key "squarage-saved-designs"):
${savedDesignJson}

---
Sent from Squarage Warped Shelf Designer
${new Date().toLocaleString()}
`

    const specRowsHtml = specRows.map(([k, v]) =>
      `<tr>
        <td style="padding: 6px 0; color: #333333; opacity: 0.6; font-size: 14px; border-bottom: 1px dashed #e0ddd8;">${escapeHtml(String(k))}</td>
        <td style="padding: 6px 0; color: #333333; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px dashed #e0ddd8;">${escapeHtml(String(v))}</td>
      </tr>`
    ).join('')

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Warped Shelf Quote</title></head>
<body style="margin: 0; padding: 0; background-color: #fffaf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #333333;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <!-- Logo / Brand Header -->
    <div style="text-align: center; padding-bottom: 32px; border-bottom: 2px solid #333333;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.08em; color: #333333;">SQUARAGE STUDIO</h1>
      <p style="margin: 6px 0 0; font-size: 13px; letter-spacing: 0.15em; color: #333333; opacity: 0.5;">WARPED SHELF QUOTE REQUEST</p>
    </div>

    <!-- Receipt Card -->
    <div style="background-color: #ffffff; margin-top: 24px; padding: 28px 24px; border: 1px solid #e8e4df;">

      <!-- Design Name -->
      <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #333333;">${safe.designName}</h2>
      <p style="margin: 0 0 20px; font-size: 13px; color: #333333; opacity: 0.5;">${specs.shelfType === 'corner' ? 'Corner Unit' : 'Standard'} &middot; ${specs.width}&quot; &times; ${specs.height}&quot; &times; ${specs.depth}&quot;</p>

      <!-- Specs -->
      <table style="width: 100%; border-collapse: collapse;">
        ${specRowsHtml}
      </table>

      <!-- Estimated Total -->
      <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #333333;">
        <table style="width: 100%;">
          <tr>
            <td style="font-size: 16px; font-weight: 700; color: #333333;">Estimated Total</td>
            <td style="font-size: 24px; font-weight: 700; color: #333333; text-align: right;">$${Math.round(specs.estimatedPrice)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Customer Info -->
    <div style="background-color: #ffffff; margin-top: 12px; padding: 20px 24px; border: 1px solid #e8e4df;">
      <p style="margin: 0 0 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #333333; opacity: 0.4;">Customer</p>
      <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #333333;">${safe.customerName}</p>
      <p style="margin: 0; font-size: 14px;"><a href="mailto:${safe.email}" style="color: #F04E23; text-decoration: none;">${safe.email}</a></p>
      ${data.message ? `
      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e0ddd8;">
        <p style="margin: 0 0 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #333333; opacity: 0.4;">Message</p>
        <p style="margin: 0; font-size: 14px; color: #333333; white-space: pre-wrap; font-style: italic;">${safe.message}</p>
      </div>` : ''}
    </div>

    <!-- Design JSON -->
    <div style="background-color: #ffffff; margin-top: 12px; padding: 20px 24px; border: 1px solid #e8e4df;">
      <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #333333; opacity: 0.4;">Saved Design Data</p>
      <p style="margin: 0 0 8px; font-size: 12px; color: #333333; opacity: 0.5;">Paste into localStorage key &ldquo;squarage-saved-designs&rdquo; to load in designer</p>
      <pre style="background-color: #fffaf4; padding: 14px; overflow-x: auto; font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; color: #333333; border: 1px solid #e8e4df; margin: 0;">${safe.savedDesignJson}</pre>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; margin-top: 8px;">
      <p style="margin: 0; font-size: 11px; color: #333333; opacity: 0.35; letter-spacing: 0.05em;">Squarage Studio &middot; Made in Los Angeles</p>
      <p style="margin: 4px 0 0; font-size: 11px; color: #333333; opacity: 0.25;">${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
`

    const info = await sendStudioMail({
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      replyTo: data.email,
    })
    console.log('Quote email sent:', info.messageId)

    // Meta Conversions API "Lead" event — consent-gated, with hashed email
    // as a high-quality match key. sendMetaCapiEvent never throws.
    if (hasMarketingConsentCookie(request)) {
      const [firstName, ...restName] = data.customerName.split(/\s+/)
      await sendMetaCapiEvent({
        request,
        eventName: 'Lead',
        eventId: metaEventId || randomUUID(),
        eventSourceUrl: request.headers.get('referer') || 'https://www.squarage.com/collections/warped/designer',
        email: data.email,
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
