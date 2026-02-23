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

    const specRowsHtml = specRows.map(([k, v], i) =>
      `<tr style="background-color: ${i % 2 === 0 ? '#fff5f5' : '#ffffff'};">
        <td style="padding: 8px 12px; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${k}</td>
        <td style="padding: 8px 12px; color: #555; border-bottom: 1px solid #eee;">${v}</td>
      </tr>`
    ).join('')

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Warped Shelf Quote</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 640px; margin: 0 auto;">
    <!-- Header -->
    <div style="background-color: #c0392b; padding: 24px 32px;">
      <h1 style="margin: 0; color: white; font-size: 24px; letter-spacing: 0.05em;">Warped Shelf Quote Request</h1>
    </div>

    <div style="padding: 32px;">
      <!-- Customer Info -->
      <div style="background-color: #fffaf4; padding: 20px; margin-bottom: 24px; border-left: 4px solid #c0392b;">
        <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${sanitized.customerName}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> <a href="mailto:${sanitized.email}" style="color: #c0392b;">${sanitized.email}</a></p>
        ${sanitized.message ? `<p style="margin: 8px 0 0;"><strong>Message:</strong></p><p style="margin: 4px 0 0; white-space: pre-wrap; color: #555;">${sanitized.message}</p>` : ''}
      </div>

      <!-- Design Name -->
      <h2 style="color: #333; margin: 0 0 16px; font-size: 20px;">Design: &ldquo;${sanitized.designName}&rdquo;</h2>

      <!-- Specs Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        ${specRowsHtml}
      </table>

      <!-- Price -->
      <div style="background-color: #FFF8E1; padding: 16px 20px; border-left: 4px solid #F5B74C; margin-bottom: 24px;">
        <span style="font-size: 14px; color: #666;">Estimated Price</span>
        <div style="font-size: 32px; font-weight: bold; color: #333;">$${Math.round(specs.estimatedPrice)}</div>
      </div>

      <!-- Saved Design JSON -->
      <details style="margin-top: 24px;">
        <summary style="cursor: pointer; color: #c0392b; font-weight: bold; margin-bottom: 8px;">Saved Design Data (click to expand)</summary>
        <pre style="background-color: #f5f5f5; padding: 16px; overflow-x: auto; font-size: 12px; line-height: 1.4; white-space: pre-wrap; word-break: break-all;">${savedDesignJson}</pre>
      </details>

      <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #999;">
        <p>Sent from Squarage Warped Shelf Designer</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
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
