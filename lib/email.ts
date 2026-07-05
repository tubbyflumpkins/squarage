import nodemailer from 'nodemailer'

// A single pooled SMTP transport, reused across warm serverless invocations
// instead of creating (and verifying) a fresh connection on every request.
// Explicit timeouts prevent a hung Zoho socket from holding the function open
// toward the platform timeout.
let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_NOT_CONFIGURED')
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 2,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
  }
  return cachedTransporter
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

interface SendMailInput {
  subject: string
  text: string
  html: string
  replyTo?: string
  fromName?: string
}

// Sends to CONTACT_EMAIL (or the SMTP account) from the authenticated Zoho
// account, with the submitter's address as replyTo — the DMARC-safe pattern
// (we never spoof the user's address in `from`).
export async function sendStudioMail({
  subject,
  text,
  html,
  replyTo,
  fromName = 'Squarage Studio',
}: SendMailInput) {
  const transporter = getTransporter()
  const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER
  return transporter.sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to,
    replyTo,
    subject,
    text,
    html,
  })
}

// Escape user-supplied text before embedding it into an HTML email body.
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Best-effort per-instance fixed-window rate limiter. Vercel keeps instances
// warm, so this catches naive scripted floods hitting a warm instance; enable
// Vercel WAF rate rules for robust cross-instance enforcement.
const windows = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now()

  // Opportunistically prune expired entries so the map can't grow unbounded.
  if (windows.size > 1000) {
    for (const [k, v] of windows) {
      if (now > v.resetAt) windows.delete(k)
    }
  }

  const entry = windows.get(key)
  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip') || 'unknown'
}
