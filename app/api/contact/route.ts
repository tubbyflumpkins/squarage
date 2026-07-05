import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendStudioMail, escapeHtml, isSmtpConfigured, rateLimit, clientIp } from '@/lib/email'

// Contact form validation schema (server-side)
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address').max(255, 'Email is too long'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  // Honeypot — hidden in the UI, must stay empty for real users
  company: z.string().max(0).optional().or(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    // Best-effort rate limit (see lib/email.ts). Complement with Vercel WAF.
    if (!rateLimit(`contact:${clientIp(request.headers)}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validationResult = contactSchema.safeParse(body)

    if (!validationResult.success) {
      // Generic message — don't echo the raw validation issues back.
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const { name, email, subject, message, company } = validationResult.data

    // Honeypot tripped: pretend success so bots don't learn they were caught.
    if (company && company.trim() !== '') {
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    }

    if (!isSmtpConfigured()) {
      console.error('Missing required environment variables: SMTP_USER, SMTP_PASS')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Trimmed values for plain text / headers; escaped values for HTML body.
    const data = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    }
    const safe = {
      name: escapeHtml(data.name),
      email: escapeHtml(data.email),
      subject: escapeHtml(data.subject),
      message: escapeHtml(data.message),
    }

    const emailText = `
New contact form submission from Squarage Studio website:

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from Squarage Studio Contact Form
${new Date().toLocaleString()}
    `

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contact Form Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #4A9B4E; border-bottom: 2px solid #4A9B4E; padding-bottom: 10px;">
      New Contact Form Submission
    </h2>

    <div style="background-color: #fffaf4; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Name:</strong> ${safe.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${safe.email}">${safe.email}</a></p>
      <p><strong>Subject:</strong> ${safe.subject}</p>
    </div>

    <div style="margin: 20px 0;">
      <h3 style="color: #333;">Message:</h3>
      <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${safe.message}</p>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
      <p>Sent from Squarage Studio Contact Form</p>
      <p>Received: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `

    const info = await sendStudioMail({
      subject: `Contact Form: ${data.subject}`,
      text: emailText,
      html: emailHtml,
      replyTo: data.email,
      fromName: 'Squarage Studio Contact Form',
    })
    console.log('Email sent successfully:', info.messageId)

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
