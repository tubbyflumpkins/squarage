import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

// Contact form validation schema (server-side)
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address').max(255, 'Email is too long'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = contactSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validationResult.data

    // Sanitize input data
    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    }

    // Check for required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Missing required environment variables: SMTP_USER, SMTP_PASS')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Recipient email (defaults to SMTP_USER if CONTACT_EMAIL is not set)
    const recipientEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER

    // Create Nodemailer transporter with Zoho SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Verify transporter configuration
    await transporter.verify()

    // Create email content using sanitized data
    const emailSubject = `Contact Form: ${sanitizedData.subject}`
    const emailText = `
New contact form submission from Squarage Studio website:

Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
Subject: ${sanitizedData.subject}

Message:
${sanitizedData.message}

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
      <p><strong>Name:</strong> ${sanitizedData.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></p>
      <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
    </div>
    
    <div style="margin: 20px 0;">
      <h3 style="color: #333;">Message:</h3>
      <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${sanitizedData.message}</p>
    </div>
    
    <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
      <p>Sent from Squarage Studio Contact Form</p>
      <p>Received: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `

    // Email options
    const mailOptions = {
      from: `"Squarage Studio Contact Form" <${process.env.SMTP_USER}>`,
      to: recipientEmail, // Send to specified contact email
      replyTo: sanitizedData.email, // Allow replying directly to the sender
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    })

  } catch (error) {
    console.error('Error sending email:', error)
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        return NextResponse.json(
          { error: 'Email configuration error - please check credentials' },
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
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}