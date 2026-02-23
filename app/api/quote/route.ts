import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

const quoteSchema = z.object({
  designName: z.string().min(1, 'Design name is required').max(100),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  message: z.string().max(5000).optional().default(''),
  specs: z.object({
    shelfType: z.enum(['flat', 'corner']),
    width: z.number(),
    height: z.number(),
    depth: z.number(),
    length: z.number(),
    shelfCount: z.number(),
    columnCount: z.number(),
    roundLeft: z.boolean().optional(),
    roundRight: z.boolean().optional(),
    finish: z.string(),
    amplitude: z.number(),
    shelfOffset: z.number(),
    columnOffset: z.number(),
    columnAngle: z.number().optional(),
    estimatedPrice: z.number(),
  }),
  savedDesignJson: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = quoteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { designName, customerName, email, message, specs, savedDesignJson } = validationResult.data

    const sanitized = {
      designName: designName.trim(),
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Missing required environment variables: SMTP_USER, SMTP_PASS')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const recipientEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.verify()

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
      ...(specs.columnAngle !== undefined ? [['Column Angle', `${specs.columnAngle.toFixed(1)}\u00B0`]] : []),
    ]

    const emailSubject = `Warped Shelf Quote: "${sanitized.designName}" - from ${sanitized.customerName}`

    const emailText = `
Warped Shelf Quote Request
==========================

Customer: ${sanitized.customerName}
Email: ${sanitized.email}
${sanitized.message ? `Message: ${sanitized.message}` : ''}

Design: "${sanitized.designName}"

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
        <td style="padding: 6px 0; color: #333333; opacity: 0.6; font-size: 14px; border-bottom: 1px dashed #e0ddd8;">${k}</td>
        <td style="padding: 6px 0; color: #333333; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px dashed #e0ddd8;">${v}</td>
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
      <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #333333;">${sanitized.designName}</h2>
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
      <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #333333;">${sanitized.customerName}</p>
      <p style="margin: 0; font-size: 14px;"><a href="mailto:${sanitized.email}" style="color: #F04E23; text-decoration: none;">${sanitized.email}</a></p>
      ${sanitized.message ? `
      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e0ddd8;">
        <p style="margin: 0 0 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #333333; opacity: 0.4;">Message</p>
        <p style="margin: 0; font-size: 14px; color: #333333; white-space: pre-wrap; font-style: italic;">${sanitized.message}</p>
      </div>` : ''}
    </div>

    <!-- Design JSON -->
    <div style="background-color: #ffffff; margin-top: 12px; padding: 20px 24px; border: 1px solid #e8e4df;">
      <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #333333; opacity: 0.4;">Saved Design Data</p>
      <p style="margin: 0 0 8px; font-size: 12px; color: #333333; opacity: 0.5;">Paste into localStorage key &ldquo;squarage-saved-designs&rdquo; to load in designer</p>
      <pre style="background-color: #fffaf4; padding: 14px; overflow-x: auto; font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; color: #333333; border: 1px solid #e8e4df; margin: 0;">${savedDesignJson}</pre>
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

    const mailOptions = {
      from: `"Squarage Shelf Designer" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      replyTo: sanitized.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Quote email sent:', info.messageId)

    return NextResponse.json({ success: true, message: 'Quote request sent successfully' })
  } catch (error) {
    console.error('Error sending quote email:', error)

    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        return NextResponse.json(
          { error: 'Email configuration error' },
          { status: 500 }
        )
      }
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Email service connection error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to send quote request. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
