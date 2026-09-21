// A custom design shared with a customer: the read-only /custom/[token] page.
//
// Labs (labs.squarage.com) owns the data. Dylan adjusts a quoted shelf there, sets the price,
// optional shipping and notes, and labs creates a Shopify draft order for it. A link can carry
// several OPTIONS (each its own design, price and draft order) under one customer and one set
// of notes. This site only reads labs' public JSON (version 2 of the contract, mirrored from
// labs' src/lib/shares/types.ts) and sends the customer to the chosen option's checkout.
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
  /** Inches the middle of three shelves sits above centre, already held inside labs' limit. 0 = centred. */
  middleShelfShift: number
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

export interface SharedOption {
  /** "Option 2". Permanent on labs' side: removing an option never renumbers the rest. */
  optionNumber: number
  status: 'open' | 'paid'
  price: { amountCents: number; currency: 'USD' }
  shipping: { mode: 'calculated' } | { mode: 'fixed'; amountCents: number }
  /** Shopify checkout for this option's draft order. Null once paid, or if checkout is not set up yet. */
  checkoutUrl: string | null
  design: SharedDesignShape
  camera: { initialRotationDeg: number; minAngleDeg: number; maxAngleDeg: number; tiltDeg: number }
  /** Labs' wireframe of the design. Only ever shown through an <img> data URI, never injected as markup. */
  svgPreview?: string | null
}

export interface SharedDesign {
  token: string
  /** Paid once any option is; labs then sends only the option that was bought. */
  status: 'open' | 'paid'
  customerName: string
  /** The customer's own address, shown under their name. Optional: labs may not have one. */
  customerEmail?: string | null
  /** Plain text from Dylan, shared by every option. Rendered with whitespace preserved, never as HTML. */
  notes: string
  /** At least one, in option order. With exactly one there is no option UI at all. */
  options: SharedOption[]
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

/** The piece's name in the page title: "Warped Console prepared for …". */
export const SHARED_PRODUCT_NAMES: Record<SharedDesignShape['variant'], string> = {
  standard: 'Warped Shelf',
  corner: 'Warped Corner Shelf',
  console: 'Warped Console',
}
