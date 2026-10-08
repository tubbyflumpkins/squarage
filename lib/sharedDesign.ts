// A custom design shared with a customer: the read-only /custom/[token] page.
//
// Labs (labs.squarage.com) owns the data. A link is one of two kinds. A SHELF link: Dylan adjusts
// a quoted Warped shelf there, sets the price, optional shipping and notes, and labs creates a
// Shopify draft order for it; the link can carry several OPTIONS (each its own design, price and
// draft order) under one customer and one set of notes. An INVOICE link: materials Dylan bought
// for a customer (sheets of plywood), a list of line items with one draft order, drawn as a
// stack of sheets. This site only reads labs' public JSON (version 2 of the contract, mirrored
// from labs' src/lib/shares/types.ts) and sends the customer to the option's checkout.
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
  /**
   * The centre-to-centre height of every row, bottom to top, as labs resolved it. Only on a shelf
   * whose rows carry their own heights; then it wins and `middleShelfShift` is 0.
   */
  rowHeights?: number[]
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

export type SharedShelfVariant = 'standard' | 'console' | 'corner'

export type SharedShelfShape =
  | { collection: 'warped'; finish: WoodFinish; variant: 'standard'; params: SharedFlatParams }
  | { collection: 'warped'; finish: WoodFinish; variant: 'console'; params: SharedFlatParams; surfaceHeight: number | null }
  | { collection: 'warped'; finish: WoodFinish; variant: 'corner'; params: SharedCornerParams }

/** One line of an invoice, as labs stored it. */
export interface SharedLineItem {
  description: string
  quantity: number
  unitCents: number
}

/** What the invoice page draws: a stack of `count` sheets of this size, in inches. */
export interface SharedSheet {
  widthIn: number
  lengthIn: number
  thicknessIn: number
  count: number
}

/** An invoice of materials: the line items, and the sheet the viewer shows (null draws nothing). */
export interface SharedMaterialsShape {
  collection: 'materials'
  variant: 'materials'
  /** "Baltic Birch Plywood": the page's title and the Shopify note. */
  title: string
  items: SharedLineItem[]
  sheet: SharedSheet | null
}

export type SharedDesignShape = SharedShelfShape | SharedMaterialsShape

export type SharedShipping =
  | { mode: 'calculated' }
  | { mode: 'fixed'; amountCents: number }
  /** Nothing ships: the materials were delivered or picked up. Checkout has no shipping step. */
  | { mode: 'none' }

export interface SharedOption {
  /** "Option 2". Permanent on labs' side: removing an option never renumbers the rest. */
  optionNumber: number
  status: 'open' | 'paid'
  price: { amountCents: number; currency: 'USD' }
  shipping: SharedShipping
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

/** A shelf link's option: a shelf to draw, and shipping that is calculated or fixed. */
export type SharedShelfOption = Omit<SharedOption, 'design' | 'shipping'> & {
  design: SharedShelfShape
  shipping: Exclude<SharedShipping, { mode: 'none' }>
}
/** A shelf link: every option a shelf. What SharedDesignView reads. */
export type SharedShelfLink = Omit<SharedDesign, 'options'> & { options: SharedShelfOption[] }
/** An invoice link's one option. What SharedInvoiceView reads. */
export type SharedInvoiceOption = Omit<SharedOption, 'design'> & { design: SharedMaterialsShape }

export const isMaterialsDesign = (design: SharedDesignShape): design is SharedMaterialsShape => design.variant === 'materials'

/**
 * Which kind of link this is, decided once. The server parser guarantees the shape behind the
 * casts: an invoice link is exactly one materials option, and a shelf link's options are all
 * shelves with calculated or fixed shipping.
 */
export function classifyShare(share: SharedDesign):
  | { kind: 'invoice'; share: SharedDesign; option: SharedInvoiceOption }
  | { kind: 'shelf'; share: SharedShelfLink } {
  const first = share.options[0]
  if (isMaterialsDesign(first.design)) return { kind: 'invoice', share, option: { ...first, design: first.design } }
  return { kind: 'shelf', share: share as SharedShelfLink }
}

/** Whether labs' payload keeps the rule the casts in classifyShare rely on. */
export function shareKindIsConsistent(share: SharedDesign): boolean {
  const invoices = share.options.filter((o) => isMaterialsDesign(o.design))
  if (invoices.length === 0) return share.options.every((o) => o.shipping.mode !== 'none')
  return share.options.length === 1
}

export const lineTotalCents = (item: SharedLineItem): number => item.quantity * item.unitCents
export const invoiceSubtotalCents = (items: SharedLineItem[]): number => items.reduce((sum, item) => sum + lineTotalCents(item), 0)

/** Cents to "$2,400" or "$2,400.50". lib/formatPrice.ts rounds to whole dollars, and a quote must not. */
export function formatMoney(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

export const SHARED_VARIANT_LABELS: Record<SharedShelfVariant, string> = {
  standard: 'Standard',
  corner: 'Corner Unit',
  console: 'Console',
}

/** The piece's name in the page title: "Warped Console prepared for …". */
export const SHARED_PRODUCT_NAMES: Record<SharedShelfVariant, string> = {
  standard: 'Warped Shelf',
  corner: 'Warped Corner Shelf',
  console: 'Warped Console',
}
