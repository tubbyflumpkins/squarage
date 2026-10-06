// The two emails a quote request sends (app/api/quote/route.ts): the studio's copy, with the
// customer's details, the specs and a "Load into Squarage Labs" button, and the customer's
// confirmation, which carries only the design's own numbers.
//
// The button's link is labs' /design?import=<design>: the saved-design object the designer
// posts (the same shape labs' Import button reads from a file), as url-safe base64 of compact
// JSON. Labs decodes it in src/lib/designImport.ts; its verify script and ours must agree.
//
// The quote form is public, so the customer's confirmation never echoes free text typed into
// it (the message) back to the address typed into it: that would make Squarage a way to send
// anyone anything. The design name is the one typed field it carries, escaped and short.
//
// Pure: no env, no mail. Checked by scripts/verifyQuoteEmails.ts.
import { escapeHtml } from '@/lib/email'
import { consoleSurfaceHeight } from '@/lib/warped/shelfLayout'

export interface QuoteSpecs {
  shelfType: 'flat' | 'corner'
  /** The console is a flat shelf; older clients send no variant */
  variant?: 'standard' | 'corner' | 'console'
  width: number
  height: number
  depth: number
  length: number
  shelfCount: number
  columnCount: number
  roundLeft?: boolean
  roundRight?: boolean
  finish: string
  amplitude: number
  shelfOffset: number
  columnOffset: number
  columnAngle?: number
  estimatedPrice: number
  /** What the shelf is for, when the designer set its shelf count from a style (its label) */
  shelfStyle?: string
}

export interface QuoteEmailInput {
  designName: string
  customerName: string
  email: string
  message: string
  specs: QuoteSpecs
  /** The designer's saved-design object, as posted (pretty-printed JSON) */
  savedDesignJson: string
  /** Labs' origin (LABS_API_URL); without it the studio's email keeps the raw design data instead of the button */
  labsOrigin: string | undefined
}

export interface BuiltEmail {
  subject: string
  text: string
  html: string
}

// ---------------------------------------------------------------------------
// The labs link
// ---------------------------------------------------------------------------

/** The "Load into Squarage Labs" link for a design, or null when there is no labs origin or the data is not a design. */
export function labsImportUrl(labsOrigin: string | undefined, savedDesignJson: string): string | null {
  const origin = labsOrigin?.replace(/\/+$/, '')
  if (!origin) return null
  let data: unknown
  try {
    data = JSON.parse(savedDesignJson)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null
  const { name, shelfType, collection, variant, params } = data as Record<string, unknown>
  if (typeof name !== 'string' || name.trim() === '') return null
  if (typeof params !== 'object' || params === null || Array.isArray(params)) return null
  if (shelfType === undefined && collection === undefined) return null
  // Only the fields labs' importer reads travel, in a fixed order, so the link is as short as it can be
  const picked: Record<string, unknown> = { name }
  if (shelfType !== undefined) picked.shelfType = shelfType
  if (collection !== undefined) picked.collection = collection
  if (variant !== undefined) picked.variant = variant
  picked.params = params
  const encoded = Buffer.from(JSON.stringify(picked), 'utf8').toString('base64url')
  return `${origin}/design?import=${encoded}`
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function describe(specs: QuoteSpecs) {
  const isCorner = specs.shelfType === 'corner'
  const isConsole = specs.shelfType === 'flat' && specs.variant === 'console'
  const typeLabel = isCorner ? 'Corner Unit' : isConsole ? 'Console' : 'Standard'
  // A corner is measured along both walls; the flat shelves by width, height and depth
  const dims = isCorner ? [specs.width, specs.length, specs.height] : [specs.width, specs.height, specs.depth]
  // The console's end columns rise past its top: the usable surface sits below the overall height
  const surfaceHeight = isConsole ? consoleSurfaceHeight({ ...specs, consoleTop: true }) : null
  return { isCorner, isConsole, typeLabel, dims, surfaceHeight }
}

function specRowsFor(specs: QuoteSpecs): [string, string][] {
  const { isCorner, isConsole, surfaceHeight } = describe(specs)
  return [
    ['Type', isCorner ? 'Corner Unit' : isConsole ? 'Console' : 'Standard (Flat)'],
    ['Width', `${specs.width}"`],
    ['Height', `${specs.height}"`],
    ...(surfaceHeight !== null ? [['Surface Height', `${surfaceHeight.toFixed(1)}"`] as [string, string]] : []),
    ['Depth', `${specs.depth}"`],
    ...(isCorner ? [['Length', `${specs.length}"`] as [string, string]] : []),
    ...(specs.shelfStyle ? [['Style', specs.shelfStyle] as [string, string]] : []),
    ['Shelves', String(specs.shelfCount)],
    ['Columns', String(specs.columnCount)],
    ['Finish', specs.finish],
    ...(!isCorner ? [['Round Edges', `L: ${specs.roundLeft ? 'Yes' : 'No'} / R: ${specs.roundRight ? 'Yes' : 'No'}`] as [string, string]] : []),
    ['Amplitude', specs.amplitude.toFixed(2)],
    ['Shelf Offset', String(specs.shelfOffset)],
    ['Column Offset', String(specs.columnOffset)],
    ...(specs.columnAngle !== undefined ? [['Column Angle', `${specs.columnAngle.toFixed(1)}°`] as [string, string]] : []),
  ]
}

const STYLE = {
  body: 'margin: 0; padding: 0; background-color: #fffaf4; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Helvetica, Arial, sans-serif; color: #333333;',
  card: 'background-color: #ffffff; margin-top: 12px; padding: 20px 24px; border: 1px solid #e8e4df;',
  label: 'margin: 0 0 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #333333; opacity: 0.4;',
  button: 'display: inline-block; background-color: #4A9B4E; color: #ffffff; padding: 14px 28px; border-radius: 999px; font-size: 15px; font-weight: 600; text-decoration: none; letter-spacing: 0.02em;',
}

function frame(subtitle: string, body: string, when: Date): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Squarage Studio</title></head>
<body style="${STYLE.body}">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <!-- Logo / Brand Header -->
    <div style="text-align: center; padding-bottom: 32px; border-bottom: 2px solid #333333;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.08em; color: #333333;">SQUARAGE STUDIO</h1>
      <p style="margin: 6px 0 0; font-size: 13px; letter-spacing: 0.15em; color: #333333; opacity: 0.5;">${escapeHtml(subtitle)}</p>
    </div>
${body}
    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; margin-top: 8px;">
      <p style="margin: 0; font-size: 11px; color: #333333; opacity: 0.35; letter-spacing: 0.05em;">Squarage Studio &middot; Made in Los Angeles</p>
      <p style="margin: 4px 0 0; font-size: 11px; color: #333333; opacity: 0.25;">${escapeHtml(when.toLocaleString())}</p>
    </div>
  </div>
</body>
</html>
`
}

// ---------------------------------------------------------------------------
// The studio's copy
// ---------------------------------------------------------------------------

export function buildStudioQuoteEmail(input: QuoteEmailInput, when = new Date()): BuiltEmail & { replyTo: string } {
  const { designName, customerName, email, message, specs, savedDesignJson } = input
  const { typeLabel } = describe(specs)
  const specRows = specRowsFor(specs)
  const labsUrl = labsImportUrl(input.labsOrigin, savedDesignJson)
  const safe = {
    designName: escapeHtml(designName),
    customerName: escapeHtml(customerName),
    email: escapeHtml(email),
    message: escapeHtml(message),
    savedDesignJson: escapeHtml(savedDesignJson),
  }

  const subject = `Warped Shelf Quote: "${designName}" - from ${customerName}`

  const text = `
Warped Shelf Quote Request
==========================

Customer: ${customerName}
Email: ${email}
${message ? `Message: ${message}` : ''}

Design: "${designName}"

Specs:
${specRows.map(([k, v]) => `  ${k}: ${v}`).join('\n')}

---
${labsUrl
    ? `Load into Squarage Labs:\n${labsUrl}`
    : `Saved Design JSON (labs' Import button reads this; set LABS_API_URL for a one-click link):\n${savedDesignJson}`}

---
Sent from Squarage Warped Shelf Designer
${when.toLocaleString()}
`

  const specRowsHtml = specRows.map(([k, v]) =>
    `<tr>
        <td style="padding: 6px 0; color: #333333; opacity: 0.6; font-size: 14px; border-bottom: 1px dashed #e0ddd8;">${escapeHtml(k)}</td>
        <td style="padding: 6px 0; color: #333333; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px dashed #e0ddd8;">${escapeHtml(v)}</td>
      </tr>`
  ).join('')

  const designBlock = labsUrl
    ? `
    <!-- Load into labs -->
    <div style="text-align: center; margin-top: 24px; padding: 8px 0;">
      <a href="${labsUrl}" style="${STYLE.button}">Load into Squarage Labs</a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #333333; opacity: 0.5;">Opens this design in the labs editor. Save it there to keep it.</p>
    </div>
`
    : `
    <!-- Design JSON -->
    <div style="${STYLE.card}">
      <p style="${STYLE.label} margin-bottom: 8px;">Saved Design Data</p>
      <p style="margin: 0 0 8px; font-size: 12px; color: #333333; opacity: 0.5;">Save as a .json file and open it with labs&rsquo; Import button (set LABS_API_URL for a one-click link)</p>
      <pre style="background-color: #fffaf4; padding: 14px; overflow-x: auto; font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; color: #333333; border: 1px solid #e8e4df; margin: 0;">${safe.savedDesignJson}</pre>
    </div>
`

  const body = `
    <!-- Receipt Card -->
    <div style="background-color: #ffffff; margin-top: 24px; padding: 28px 24px; border: 1px solid #e8e4df;">

      <!-- Design Name -->
      <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #333333;">${safe.designName}</h2>
      <p style="margin: 0 0 20px; font-size: 13px; color: #333333; opacity: 0.5;">${typeLabel} &middot; ${specs.width}&quot; &times; ${specs.height}&quot; &times; ${specs.depth}&quot;</p>

      <!-- Specs -->
      <table style="width: 100%; border-collapse: collapse;">
        ${specRowsHtml}
      </table>
    </div>

    <!-- Customer Info -->
    <div style="${STYLE.card}">
      <p style="${STYLE.label}">Customer</p>
      <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #333333;">${safe.customerName}</p>
      <p style="margin: 0; font-size: 14px;"><a href="mailto:${safe.email}" style="color: #F04E23; text-decoration: none;">${safe.email}</a></p>
      ${message ? `
      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e0ddd8;">
        <p style="${STYLE.label}">Message</p>
        <p style="margin: 0; font-size: 14px; color: #333333; white-space: pre-wrap; font-style: italic;">${safe.message}</p>
      </div>` : ''}
    </div>
${designBlock}`

  return { subject, text, html: frame('WARPED SHELF QUOTE REQUEST', body, when), replyTo: email }
}

// ---------------------------------------------------------------------------
// The customer's confirmation
// ---------------------------------------------------------------------------

export function buildCustomerQuoteEmail(input: QuoteEmailInput, when = new Date()): BuiltEmail & { to: string } {
  const { designName, customerName, email, specs } = input
  const { typeLabel, dims } = describe(specs)
  const firstName = customerName.trim().split(/\s+/)[0] || customerName.trim()
  const sizeLabel = dims.map((d) => `${d}"`).join(' × ')
  const safe = {
    firstName: escapeHtml(firstName),
    designName: escapeHtml(designName),
    typeLabel: escapeHtml(typeLabel),
    sizeLabel: escapeHtml(sizeLabel),
    finish: escapeHtml(specs.finish),
  }

  const subject = 'We got your Warped shelf quote request'

  const text = `
Hi ${firstName},

Thank you for your request. Here is the design you asked about:

  Design: "${designName}"
  Type: ${typeLabel}
  Size: ${sizeLabel}
  Finish: ${specs.finish}

We'll look it over and be in touch shortly with a quote. Reply to this email if there is anything you'd like to add.

Squarage Studio
Made in Los Angeles
`

  const body = `
    <!-- Greeting -->
    <div style="margin-top: 24px;">
      <p style="margin: 0 0 12px; font-size: 16px; color: #333333;">Hi ${safe.firstName},</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #333333;">Thank you for your request. Here is the design you asked about:</p>
    </div>

    <!-- Design Card -->
    <div style="${STYLE.card}">
      <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #333333;">${safe.designName}</h2>
      <p style="margin: 0 0 16px; font-size: 13px; color: #333333; opacity: 0.5;">${safe.typeLabel} &middot; ${safe.sizeLabel}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #333333; opacity: 0.6; font-size: 14px; border-bottom: 1px dashed #e0ddd8;">Finish</td>
          <td style="padding: 6px 0; color: #333333; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px dashed #e0ddd8;">${safe.finish}</td>
        </tr>
      </table>
    </div>

    <!-- What happens next -->
    <div style="margin-top: 20px;">
      <p style="margin: 0 0 10px; font-size: 15px; line-height: 1.5; color: #333333;">We'll look it over and be in touch shortly with a quote.</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #333333; opacity: 0.7;">Reply to this email if there is anything you'd like to add.</p>
    </div>
`

  return { to: email, subject, text, html: frame('QUOTE REQUEST RECEIVED', body, when) }
}
