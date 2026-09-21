// Server-only: reads a shared design from labs. LABS_API_URL is not a public env var, so this
// never runs (or resolves) in the browser. Labs' route is unauthenticated but the token is the
// secret: 128 random bits, checked here before any request is made.

import { z } from 'zod'
import type { SharedDesign } from '@/lib/sharedDesign'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/
const TIMEOUT_MS = 8000

// Bounds well outside anything labs will share, but inside anything that could hang a
// browser building the geometry. A payload outside them is treated as unavailable.
const inches = z.number().min(1).max(200)
const count = z.number().int().min(1).max(12)
const offset = z.number().min(0).max(60)
const finish = z.enum(['Walnut', 'Oak', 'Birch'])

const flatParams = z.object({
  width: inches, height: inches, depth: inches, length: inches,
  amplitude: z.number().min(0).max(12),
  shelfCount: count, columnCount: count,
  shelfOffset: offset, columnOffset: offset,
  roundLeft: z.boolean(), roundRight: z.boolean(), consoleTop: z.boolean(),
  // Absent on links shared before the middle shelf could move
  middleShelfShift: z.number().min(-100).max(100).optional().default(0),
})

const cornerParams = z.object({
  width: inches, length: inches, depth: inches, height: inches,
  amplitude: z.number().min(0).max(12),
  shelfCount: count, columnCount: count,
  shelfOffset: offset, columnOffset: offset,
  columnAngle: z.number().min(0).max(90), wallAlign: z.number().min(0).max(1),
})

const design = z.discriminatedUnion('variant', [
  z.object({ collection: z.literal('warped'), finish, variant: z.literal('standard'), params: flatParams }),
  z.object({ collection: z.literal('warped'), finish, variant: z.literal('console'), params: flatParams, surfaceHeight: z.number().min(0).max(200).nullable() }),
  z.object({ collection: z.literal('warped'), finish, variant: z.literal('corner'), params: cornerParams }),
])

const cents = z.number().int().min(0).max(100_000_000)

const optionFields = {
  status: z.enum(['open', 'paid']),
  price: z.object({ amountCents: cents, currency: z.literal('USD') }),
  shipping: z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('calculated') }),
    z.object({ mode: z.literal('fixed'), amountCents: cents }),
  ]),
  // Only ever a Shopify checkout: never follow a link to anywhere else
  checkoutUrl: z.url({ protocol: /^https$/ }).nullable(),
  design,
  camera: z.object({
    initialRotationDeg: z.number().min(-360).max(360),
    minAngleDeg: z.number().min(-180).max(180),
    maxAngleDeg: z.number().min(-180).max(180),
    tiltDeg: z.number().min(0).max(90),
  }),
}

const linkFields = {
  token: z.string().regex(TOKEN_PATTERN),
  status: z.enum(['open', 'paid']),
  customerName: z.string().max(255),
  customerEmail: z.string().max(255).nullable().optional(),
  notes: z.string().max(5000),
  updatedAt: z.string(),
}

// Version 2: a link with one or more options
const linkSchemaV2 = z.object({
  version: z.literal(2),
  ...linkFields,
  options: z.array(z.object({
    optionNumber: z.number().int().min(1).max(99),
    ...optionFields,
    // A wireframe is a few KB; anything huge is not one
    svgPreview: z.string().max(200_000).nullable().optional(),
  })).min(1).max(12),
})

// Version 1: a single design at the top level. Labs sent this before links had options; kept
// so a link never breaks while the two sites deploy at different moments.
const linkSchemaV1 = z.object({ version: z.literal(1), ...linkFields, ...optionFields })

const sharedDesignSchema = z.discriminatedUnion('version', [linkSchemaV2, linkSchemaV1])

function normalise(parsed: z.infer<typeof sharedDesignSchema>): SharedDesign {
  if (parsed.version === 2) {
    const { version: _v, ...link } = parsed
    return { ...link, options: [...link.options].sort((a, b) => a.optionNumber - b.optionNumber) }
  }
  const { version: _v, token, status, customerName, customerEmail, notes, updatedAt, ...option } = parsed
  // In version 1 the one status spoke for both the link and its only design
  return { token, status, customerName, customerEmail, notes, updatedAt, options: [{ optionNumber: 1, status, ...option }] }
}

export type SharedDesignResult =
  | { status: 'ok'; share: SharedDesign }
  | { status: 'not_found' }
  /** Labs is unreachable or answered with something unexpected: the page asks the customer to try again. */
  | { status: 'unavailable' }

export async function fetchSharedDesign(token: string): Promise<SharedDesignResult> {
  if (!TOKEN_PATTERN.test(token)) return { status: 'not_found' }
  const base = process.env.LABS_API_URL?.replace(/\/+$/, '')
  if (!base) {
    console.error('LABS_API_URL is not set: shared design pages cannot load')
    return { status: 'unavailable' }
  }
  try {
    const res = await fetch(`${base}/api/public/shares/${token}`, {
      cache: 'no-store', // price, notes and paid status change under the same link
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.status === 404) return { status: 'not_found' }
    if (!res.ok) {
      console.error(`Shared design fetch failed: ${res.status}`)
      return { status: 'unavailable' }
    }
    const parsed = sharedDesignSchema.safeParse(await res.json())
    if (!parsed.success) {
      console.error('Shared design payload did not match the contract:', parsed.error.issues.slice(0, 3))
      return { status: 'unavailable' }
    }
    return { status: 'ok', share: normalise(parsed.data) }
  } catch (error) {
    console.error('Shared design fetch threw:', error)
    return { status: 'unavailable' }
  }
}
