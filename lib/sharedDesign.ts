// A custom design shared with a customer: the read-only /custom/[token] page.
//
// Labs (labs.squarage.com) owns the data. Dylan adjusts a quoted shelf there, sets the price,
// optional shipping and notes, and labs creates a Shopify draft order for it. This site only
// reads labs' public JSON (version 1 of the contract below, mirrored from labs'
// src/lib/shares/types.ts) and sends the customer to the draft order's checkout.
// Safe to import from client components: the fetcher lives in lib/sharedDesignServer.ts.

export type WoodFinish = 'Walnut' | 'Oak' | 'Birch'

/** Resolved render params: amplitude and offsets come from labs, never recomputed here. */
export interface SharedFlatParams {
  width: number
  height: number
  depth: number
  length: number
  amplitude: number
  shelfCount: number
  columnCount: number
  shelfOffset: number
  columnOffset: number
  roundLeft: boolean
  roundRight: boolean
  consoleTop: boolean
}

export interface SharedCornerParams {
  width: number
  length: number
  depth: number
  height: number
  amplitude: number
  shelfCount: number
  columnCount: number
  shelfOffset: number
  columnOffset: number
  columnAngle: number
  wallAlign: number
}

export type SharedDesignShape =
  | { collection: 'warped'; finish: WoodFinish; variant: 'standard'; params: SharedFlatParams }
  | { collection: 'warped'; finish: WoodFinish; variant: 'console'; params: SharedFlatParams; surfaceHeight: number | null }
  | { collection: 'warped'; finish: WoodFinish; variant: 'corner'; params: SharedCornerParams }

export interface SharedDesign {
  version: 1
  token: string
  status: 'open' | 'paid'
  customerName: string
  /** Plain text from Dylan. Rendered with whitespace preserved, never as HTML. */
  notes: string
  price: { amountCents: number; currency: 'USD' }
  shipping: { mode: 'calculated' } | { mode: 'fixed'; amountCents: number }
  /** Shopify checkout for this design's draft order. Null once paid, or if checkout is not set up yet. */
  checkoutUrl: string | null
  design: SharedDesignShape
  camera: { initialRotationDeg: number; minAngleDeg: number; maxAngleDeg: number; tiltDeg: number }
  updatedAt: string
}

/** Cents to "$2,400" or "$2,400.50". lib/formatPrice.ts rounds to whole dollars, and a quote must not. */
export function formatMoney(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

export const SHARED_VARIANT_LABELS: Record<SharedDesignShape['variant'], string> = {
  standard: 'Standard',
  corner: 'Corner Unit',
  console: 'Console',
}
