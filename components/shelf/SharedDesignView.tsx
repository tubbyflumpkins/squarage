'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { trackMetaEvent } from '@/lib/metaPixel'
import { useBoomerangRotation } from '@/hooks/useBoomerangRotation'
import { formatMoney, SHARED_PRODUCT_NAMES, SHARED_VARIANT_LABELS, type SharedDesign, type SharedOption } from '@/lib/sharedDesign'
import { shelfSpacings } from '@/lib/warped/shelfLayout'
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types'
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types'

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[24px] font-semibold tracking-[0.01em] text-squarage-black select-none">
      {children}
    </h3>
  )
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[16px] font-medium tracking-[0.01em] text-squarage-black">
      <span>{label}</span>
      <span className="tabular-nums text-right">{value}</span>
    </div>
  )
}

const Divider = () => <div className="h-[1.5px] bg-squarage-black shrink-0" />

/**
 * The shelf itself, drag to rotate. Keyed by option where it is used, so picking another
 * option starts that design from its own opening angle (a corner and a flat shelf face
 * different ways) instead of inheriting the last one's rotation.
 */
function ShelfViewer({ option }: { option: SharedOption }) {
  const { design, camera } = option
  const { rotation, handlers } = useBoomerangRotation(camera)

  // RenderedShelfView takes both param sets and draws one: fill the other from the same numbers
  const { flatParams, cornerParams } = useMemo(() => {
    const p = design.params
    const flat: ShelfParams = {
      width: p.width, height: p.height, depth: p.depth, length: p.length,
      amplitude: p.amplitude, shelfCount: p.shelfCount, columnCount: p.columnCount,
      shelfOffset: p.shelfOffset, columnOffset: p.columnOffset,
      roundLeft: design.variant === 'corner' ? false : design.params.roundLeft,
      roundRight: design.variant === 'corner' ? false : design.params.roundRight,
      consoleTop: design.variant === 'console',
      // The middle of three shelves, moved off centre in labs. The public builder never sets this.
      ...(design.variant !== 'corner' && design.params.middleShelfShift ? { middleShelfShift: design.params.middleShelfShift } : {}),
    }
    const corner: CornerShelfParams = {
      width: p.width, length: p.length, depth: p.depth, height: p.height,
      amplitude: p.amplitude, shelfCount: p.shelfCount, columnCount: p.columnCount,
      shelfOffset: p.shelfOffset, columnOffset: p.columnOffset,
      columnAngle: design.variant === 'corner' ? design.params.columnAngle : 45,
      wallAlign: design.variant === 'corner' ? design.params.wallAlign : 1,
    }
    return { flatParams: flat, cornerParams: corner }
  }, [design])

  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing touch-none" {...handlers}>
      <RenderedShelfView
        isCorner={design.variant === 'corner'}
        flatParams={flatParams}
        cornerParams={cornerParams}
        rotation={rotation + Math.PI / 4}
        tilt={camera.tiltDeg}
        finish={design.finish}
        width={design.params.width}
        height={design.params.height}
        depth={design.params.depth}
        length={design.params.length}
      />
    </div>
  )
}

/**
 * A design Dylan has prepared for one customer: the Shelf Builder's layout with nothing to
 * edit. Dimensions on the left, the shelf in the middle (drag to rotate), and on the right a
 * title bar ("Warped Console prepared for …", their email under it), his notes, and Pay Now
 * where the builder has Get Quote. A link can carry several options: they are buttons over the
 * viewer (labs' wireframe on each), the shelf, the numbers, the title and the price follow the
 * one picked, the notes are shared, and the pay box says which option it is for. The design,
 * prices and notes come from labs (lib/sharedDesign.ts); Pay Now opens the Shopify checkout
 * labs created for that option.
 */
export default function SharedDesignView({ share, initialOption }: { share: SharedDesign; initialOption?: number }) {
  const { options } = share
  const [selectedNumber, setSelectedNumber] = useState(
    options.some((o) => o.optionNumber === initialOption) ? (initialOption as number) : options[0].optionNumber,
  )
  const [dimUnit, setDimUnit] = useState<'in' | 'cm'>('in')
  const [leaving, setLeaving] = useState(false)

  const option = options.find((o) => o.optionNumber === selectedNumber) ?? options[0]
  const hasOptions = options.length > 1
  const optionLabel = `Option ${option.optionNumber}`
  const { design, price, shipping } = option
  const isCorner = design.variant === 'corner'
  const p = design.params

  // Keep the pick in the URL, so a refresh (or the link forwarded to a partner) opens on it
  const selectOption = (n: number) => {
    setSelectedNumber(n)
    window.history.replaceState(null, '', `?option=${n}`)
  }

  const dim = (inches: number) => (dimUnit === 'in' ? `${+inches.toFixed(1)}"` : `${Math.round(inches * 2.54)} cm`)
  const title = `${SHARED_PRODUCT_NAMES[design.variant]} prepared for ${share.customerName}`

  // The openings, as labs' Measurements panel reads them: centre to centre of the shelves, and
  // of the columns. A corner's columns fan across two walls, so it has no single width.
  // The shelf heights are all equal unless labs moved the middle of three shelves: then the
  // top and bottom openings are read out separately.
  const gaps = shelfSpacings(p)
  const evenGaps = gaps.every((g) => Math.abs(g - gaps[0]) < 1e-9)
  const shelfHeight = gaps.length > 0 ? gaps[0] : null
  const shelfWidth = !isCorner && p.columnCount > 1 ? (p.width - 2 * p.columnOffset) / (p.columnCount - 1) : null

  const payNow = () => {
    if (!option.checkoutUrl || leaving) return
    setLeaving(true)
    trackMetaEvent('InitiateCheckout', {
      value: price.amountCents / 100,
      currency: price.currency,
      num_items: 1,
      content_type: 'product',
    })
    window.location.href = option.checkoutUrl
  }

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
      {share.notes || (hasOptions
        ? 'These are the designs we can build for you. Pick an option to see it, and drag the shelf to look around it.'
        : 'This is the design we will build for you. Drag the shelf to look around it.')}
    </p>
  )

  const priceRows = (
    <div className="flex flex-col gap-2">
      <SpecRow label="Price" value={formatMoney(price.amountCents)} />
      <SpecRow
        label="Shipping"
        value={shipping.mode === 'calculated' ? 'At checkout' : shipping.amountCents === 0 ? 'Free' : formatMoney(shipping.amountCents)}
      />
      <SpecRow label="Tax" value="At checkout" />
    </div>
  )

  const payButtonClass = 'w-full bg-squarage-orange text-white font-bold font-neue-haas hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100'
  const action = (size: 'desktop' | 'mobile') => {
    if (share.status === 'paid') {
      return (
        <div className={size === 'desktop' ? 'mt-5' : ''}>
          <p className="text-[20px] md:text-2xl font-bold text-squarage-green">Paid. Thank you.</p>
          <p className="hidden md:block mt-1 text-[15px] text-squarage-black/70">We have your order. We will be in touch about delivery.</p>
        </div>
      )
    }
    if (!option.checkoutUrl) {
      return (
        <p className={`text-[15px] leading-snug text-squarage-black/80 ${size === 'desktop' ? 'mt-5' : ''}`}>
          Checkout is not ready yet. <Link href="/contact" className="underline text-squarage-green">Get in touch</Link> and we will sort it out.
        </p>
      )
    }
    const mobileLabel = hasOptions ? `Pay Now · ${optionLabel} · ${formatMoney(price.amountCents)}` : `Pay Now · ${formatMoney(price.amountCents)}`
    return (
      <button onClick={payNow} disabled={leaving} className={`${payButtonClass} ${size === 'desktop' ? 'mt-5 py-4 text-2xl' : 'py-3 text-xl'}`}>
        {leaving ? 'Opening checkout...' : size === 'desktop' ? 'Pay Now' : mobileLabel}
      </button>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-cream overflow-hidden pt-[60px] md:pt-[90px] lg:pt-[98px]">
      {/* Main grid — mobile: flex column, desktop: 3-col grid (the Shelf Builder's) */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[320px_minmax(0,1fr)_340px] md:grid-rows-[2fr_1fr] min-h-0 border-t border-squarage-black">

        {/* CENTER — the viewer, with the option buttons over its top left (first on mobile) */}
        <div className="order-first md:order-2 md:row-span-2 flex flex-col min-h-0 h-[45dvh] md:h-auto shrink-0">
          <div className="relative flex-1 flex items-center justify-center min-h-0 p-1 md:p-5 touch-none">
            {hasOptions && (
              <div className="absolute top-3 left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-2 max-w-[calc(100%-24px)]" role="group" aria-label="Design options">
                {options.map((o) => {
                  const selected = o.optionNumber === option.optionNumber
                  return (
                    <button
                      key={o.optionNumber}
                      onClick={() => selectOption(o.optionNumber)}
                      aria-pressed={selected}
                      className={`flex flex-col w-[58px] md:w-[92px] bg-cream border transition-colors ${
                        selected ? 'border-squarage-green' : 'border-neutral-300 hover:border-squarage-green'
                      }`}
                    >
                      {o.svgPreview && (
                        // Labs' wireframe through an <img>: an SVG loaded this way cannot run script
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`data:image/svg+xml;utf8,${encodeURIComponent(o.svgPreview)}`}
                          alt=""
                          className="w-full aspect-square object-contain p-1 md:p-2"
                          draggable={false}
                        />
                      )}
                      <span className={`w-full py-0.5 md:py-1 text-[11px] md:text-[14px] font-medium tracking-[0.01em] ${
                        selected ? 'bg-squarage-green text-white' : 'text-neutral-600'
                      }`}>
                        Option {o.optionNumber}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <ShelfViewer key={option.optionNumber} option={option} />

            <span className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 text-[12px] md:text-[14px] font-medium tracking-[0.01em] text-squarage-black/50 select-none pointer-events-none">
              <span className="hidden md:inline">Drag to rotate</span>
              <span className="md:hidden">Swipe to rotate</span>
            </span>
          </div>
        </div>

        {/* LEFT — the design's numbers (scrolls on mobile, where the notes and price join it) */}
        <div className="order-2 md:order-1 md:row-span-2 border-t md:border-t-0 md:border-r border-squarage-black flex flex-col flex-1 md:flex-none overflow-y-auto pb-24 md:pb-0 touch-pan-y md:touch-auto">
          {/* Mobile: the right column's title bar comes first */}
          <div className="md:hidden">
            <div className="px-5 pt-5 pb-5">{titleBlock('p')}</div>
            <Divider />
          </div>

          <div className="px-5 md:px-7 pt-6 pb-5 flex flex-col gap-4">
            <SectionLabel>Design</SectionLabel>
            <div className="flex flex-col gap-2">
              {hasOptions && <SpecRow label="Option" value={option.optionNumber} />}
              <SpecRow label="Type" value={SHARED_VARIANT_LABELS[design.variant]} />
              <SpecRow label="Finish" value={design.finish} />
            </div>
          </div>

          <Divider />

          <div className="px-5 md:px-7 pt-5 pb-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionLabel>Dimensions</SectionLabel>
              <div className="flex">
                {(['in', 'cm'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setDimUnit(u)}
                    className={`px-4 py-1 text-[14px] font-medium tracking-[0.01em] border transition-colors ${
                      dimUnit === u
                        ? 'bg-squarage-green text-white border-squarage-green'
                        : 'bg-cream text-neutral-600 border-neutral-300 hover:border-squarage-green hover:text-squarage-green'
                    } ${u === 'in' ? 'border-r-0' : ''}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            {/* The footprint first, then the heights: a console has two, its surface and its taller end columns */}
            <div className="flex flex-col gap-2">
              <SpecRow label="Width" value={dim(p.width)} />
              {isCorner && <SpecRow label="Length" value={dim(p.length)} />}
              <SpecRow label="Depth" value={dim(p.depth)} />
              {design.variant === 'console' && design.surfaceHeight !== null ? (
                <>
                  <SpecRow label="Surface Height" value={dim(design.surfaceHeight)} />
                  <SpecRow label="Column Height" value={dim(p.height)} />
                </>
              ) : (
                <SpecRow label="Height" value={dim(p.height)} />
              )}
            </div>
            {/* The openings, set apart: what fits on a shelf */}
            {(shelfHeight !== null || shelfWidth !== null) && (
              <div className="flex flex-col gap-2 pt-3">
                {shelfHeight !== null && evenGaps && <SpecRow label="Shelf Height" value={dim(shelfHeight)} />}
                {!evenGaps && (
                  <>
                    <SpecRow label="Top Shelf Height" value={dim(gaps[gaps.length - 1])} />
                    <SpecRow label="Bottom Shelf Height" value={dim(gaps[0])} />
                  </>
                )}
                {shelfWidth !== null && <SpecRow label="Shelf Width" value={dim(shelfWidth)} />}
              </div>
            )}
          </div>

          <Divider />

          <div className="px-5 md:px-7 pt-5 pb-6 flex flex-col gap-4">
            <SectionLabel>Layout</SectionLabel>
            <div className="flex flex-col gap-2">
              <SpecRow label="Shelves" value={p.shelfCount} />
              <SpecRow label="Columns" value={p.columnCount} />
              {design.variant !== 'corner' && (
                <SpecRow
                  label="Round Edges"
                  value={design.params.roundLeft && design.params.roundRight ? 'Both' : design.params.roundLeft ? 'Left' : design.params.roundRight ? 'Right' : 'None'}
                />
              )}
            </div>
          </div>

          {/* Mobile: the right column's notes and price, under the numbers */}
          <div className="md:hidden">
            <Divider />
            <div className="px-5 pt-5 pb-5 flex flex-col gap-3">
              <SectionLabel>Notes</SectionLabel>
              {notes}
            </div>
            <Divider />
            <div className="px-5 pt-5 pb-6 flex flex-col gap-4">
              <SectionLabel>{hasOptions ? `${optionLabel} selected` : 'Price'}</SectionLabel>
              {priceRows}
            </div>
          </div>
        </div>

        {/* RIGHT — title bar (what it is, who it is for), then Dylan's notes, shared by every option */}
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

        {/* BOTTOM RIGHT — what is being paid for, its price, and Pay Now where the builder has Get Quote */}
        <div className="hidden md:flex md:order-4 border-l border-t border-squarage-black px-7 py-6 flex-col justify-between">
          <div className="flex flex-col gap-4">
            {hasOptions && <p className="text-[28px] leading-none font-bold tracking-[0.01em] text-squarage-black">{optionLabel} selected</p>}
            {priceRows}
          </div>
          {action('desktop')}
        </div>
      </div>

      {/* MOBILE: sticky bottom bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-squarage-black bg-cream px-4 pt-3 flex items-center justify-center"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {action('mobile')}
      </div>
    </div>
  )
}
