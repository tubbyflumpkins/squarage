'use client'

import dynamic from 'next/dynamic'
import { useBoomerangRotation } from '@/hooks/useBoomerangRotation'
import { formatMoney, invoiceSubtotalCents, lineTotalCents, type SharedDesign, type SharedInvoiceOption, type SharedSheet } from '@/lib/sharedDesign'
import { Divider, MobilePayBar, PayAction, SectionLabel, SpecRow, usePayNow, ViewerCaption } from './sharedViewParts'

const RenderedSheetView = dynamic(
  () => import('@/components/shelf/RenderedShelfView/RenderedSheetView'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[16px] uppercase tracking-[0.1em] text-neutral-400 animate-pulse">
          Loading 3D view...
        </span>
      </div>
    ),
  },
)

/** Inches as a shop would say them: 0.5 is 1/2, 0.75 is 3/4, 48 is 48. */
const FRACTIONS: [number, string][] = [[0.125, '1/8'], [0.25, '1/4'], [0.375, '3/8'], [0.5, '1/2'], [0.625, '5/8'], [0.75, '3/4'], [0.875, '7/8']]
export function inchLabel(value: number): string {
  const whole = Math.floor(value)
  const frac = value - whole
  if (frac < 1e-6) return String(whole)
  const named = FRACTIONS.find(([f]) => Math.abs(f - frac) < 1e-6)
  if (!named) return String(+value.toFixed(2))
  return whole > 0 ? `${whole} ${named[1]}` : named[1]
}

/** The stack of sheets, drag to rotate. */
function SheetViewer({ sheet, camera }: { sheet: SharedSheet; camera: SharedInvoiceOption['camera'] }) {
  const { rotation, handlers } = useBoomerangRotation(camera)
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing touch-none" {...handlers}>
      {/* Labs' angle is the opening view itself: no offset, unlike the shelf viewer's */}
      <RenderedSheetView sheet={sheet} rotation={rotation} tilt={camera.tiltDeg} cameraPadding={0.5} />
    </div>
  )
}

/**
 * An invoice Dylan has prepared for one customer: materials bought for them, as a list of lines
 * with one Shopify checkout. The Shelf Builder's grid, as on a shelf link: the lines and their
 * total on the left, the sheets in the middle (drag to rotate), a title bar ("Baltic Birch
 * Plywood prepared for …", the customer's email under it) and Dylan's notes on the right, and
 * Pay Now where the builder has Get Quote. Sales tax is Shopify's, added at checkout.
 */
export default function SharedInvoiceView({ share, option }: { share: SharedDesign; option: SharedInvoiceOption }) {
  const { design, price, shipping } = option
  const { items, sheet } = design
  const subtotal = invoiceSubtotalCents(items)
  const { leaving, payNow } = usePayNow(option.checkoutUrl, price, items.reduce((n, item) => n + item.quantity, 0))

  const title = `${design.title} prepared for ${share.customerName}`

  // One <h1> per page: the desktop bar's. The mobile copy is a <p> styled the same.
  const titleBlock = (Heading: 'h1' | 'p') => (
    <>
      <Heading className="text-[24px] leading-tight font-semibold tracking-[0.01em] text-squarage-black break-words">{title}</Heading>
      {share.customerEmail && (
        <p className="mt-1.5 text-[15px] font-medium tracking-[0.01em] text-squarage-black/60 break-all">{share.customerEmail}</p>
      )}
    </>
  )

  const notes = (
    <p className="text-[16px] leading-relaxed tracking-[0.01em] text-squarage-black/80 whitespace-pre-line break-words">
      {share.notes || 'Pay Now opens a secure checkout. Sales tax is added there.'}
    </p>
  )

  // The lines as on a receipt: what it is, then quantity × unit price and the line's total
  const orderLines = (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1">
          <p className="text-[16px] font-medium tracking-[0.01em] text-squarage-black break-words">{item.description}</p>
          <div className="flex items-center justify-between gap-4 text-[15px] tracking-[0.01em] text-squarage-black/60 tabular-nums">
            <span>{item.quantity} × {formatMoney(item.unitCents)}</span>
            <span className="text-squarage-black">{formatMoney(lineTotalCents(item))}</span>
          </div>
        </div>
      ))}
    </div>
  )

  const priceRows = (
    <div className="flex flex-col gap-2">
      <SpecRow label="Subtotal" value={formatMoney(subtotal)} />
      {shipping.mode !== 'none' && (
        <SpecRow
          label="Delivery"
          value={shipping.mode === 'calculated' ? 'At checkout' : shipping.amountCents === 0 ? 'Free' : formatMoney(shipping.amountCents)}
        />
      )}
      <SpecRow label="Tax" value="At checkout" />
    </div>
  )

  const action = (size: 'desktop' | 'mobile') => (
    <PayAction
      paid={share.status === 'paid'}
      checkoutUrl={option.checkoutUrl}
      leaving={leaving}
      onPay={payNow}
      label="Pay Now"
      mobileLabel={`Pay Now · ${formatMoney(price.amountCents)}`}
      size={size}
      paidNote="We have your payment. Thank you for your order."
    />
  )

  return (
    <div className="h-[100dvh] flex flex-col bg-cream overflow-hidden pt-[60px] md:pt-[90px] lg:pt-[98px]">
      {/* Main grid — mobile: flex column, desktop: 3-col grid (the Shelf Builder's) */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[320px_minmax(0,1fr)_340px] md:grid-rows-[2fr_1fr] min-h-0 border-t border-squarage-black">

        {/* CENTER — the sheets (first on mobile) */}
        <div className="order-first md:order-2 md:row-span-2 flex flex-col min-h-0 h-[45dvh] md:h-auto shrink-0">
          <div className="relative flex-1 flex items-center justify-center min-h-0 p-1 md:p-5 touch-none">
            {sheet ? (
              <>
                <SheetViewer sheet={sheet} camera={option.camera} />
                <ViewerCaption />
              </>
            ) : (
              <p className="text-[16px] font-medium tracking-[0.01em] text-squarage-black/40 select-none">{design.title}</p>
            )}
          </div>
        </div>

        {/* LEFT — the order (scrolls on mobile, where the notes and price join it) */}
        <div className="order-2 md:order-1 md:row-span-2 border-t md:border-t-0 md:border-r border-squarage-black flex flex-col flex-1 md:flex-none overflow-y-auto pb-24 md:pb-0 touch-pan-y md:touch-auto">
          {/* Mobile: the right column's title bar comes first */}
          <div className="md:hidden">
            <div className="px-5 pt-5 pb-5">{titleBlock('p')}</div>
            <Divider />
          </div>

          <div className="px-5 md:px-7 pt-6 pb-5 flex flex-col gap-4">
            <SectionLabel>Order</SectionLabel>
            {orderLines}
          </div>

          {sheet && (
            <>
              <Divider />
              <div className="px-5 md:px-7 pt-5 pb-6 flex flex-col gap-4">
                <SectionLabel>Sheet</SectionLabel>
                <div className="flex flex-col gap-2">
                  <SpecRow label="Size" value={`${inchLabel(sheet.widthIn)} × ${inchLabel(sheet.lengthIn)} in`} />
                  <SpecRow label="Thickness" value={`${inchLabel(sheet.thicknessIn)} in`} />
                  <SpecRow label="Sheets" value={sheet.count} />
                </div>
              </div>
            </>
          )}

          {/* Mobile: the right column's notes and price, under the lines */}
          <div className="md:hidden">
            <Divider />
            <div className="px-5 pt-5 pb-5 flex flex-col gap-3">
              <SectionLabel>Notes</SectionLabel>
              {notes}
            </div>
            <Divider />
            <div className="px-5 pt-5 pb-6 flex flex-col gap-4">
              <SectionLabel>Price</SectionLabel>
              {priceRows}
            </div>
          </div>
        </div>

        {/* RIGHT — title bar (what it is, who it is for), then Dylan's notes */}
        <div className="hidden md:flex md:order-3 border-l border-squarage-black flex-col min-h-0">
          <div className="px-7 pt-6 pb-5 shrink-0">{titleBlock('h1')}</div>
          <Divider />
          <div className="px-7 pt-5 pb-4 shrink-0">
            <SectionLabel>Notes</SectionLabel>
          </div>
          <div className="px-7 pb-6 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
            {notes}
          </div>
        </div>

        {/* BOTTOM RIGHT — the total and Pay Now where the builder has Get Quote */}
        <div className="hidden md:flex md:order-4 border-l border-t border-squarage-black px-7 py-6 flex-col justify-between">
          <div className="flex flex-col gap-4">
            {priceRows}
          </div>
          {action('desktop')}
        </div>
      </div>

      <MobilePayBar>{action('mobile')}</MobilePayBar>
    </div>
  )
}
