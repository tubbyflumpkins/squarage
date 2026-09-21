'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { trackMetaEvent } from '@/lib/metaPixel'
import { useBoomerangRotation } from '@/hooks/useBoomerangRotation'
import { formatMoney, SHARED_VARIANT_LABELS, type SharedDesign } from '@/lib/sharedDesign'
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
 * A design Dylan has prepared for one customer: the Shelf Builder's layout with nothing to
 * edit. Dimensions on the left, the shelf in the middle (drag to rotate), his notes on the
 * right, and Pay Now where the builder has Get Quote. The design, price and notes come from
 * labs (lib/sharedDesign.ts); Pay Now opens the Shopify checkout labs created for it.
 */
export default function SharedDesignView({ share }: { share: SharedDesign }) {
  const { design, camera, price, shipping } = share
  const { rotation, handlers } = useBoomerangRotation(camera)
  const [dimUnit, setDimUnit] = useState<'in' | 'cm'>('in')
  const [leaving, setLeaving] = useState(false)

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

  const isCorner = design.variant === 'corner'
  const p = design.params
  const dim = (inches: number) => (dimUnit === 'in' ? `${+inches.toFixed(1)}"` : `${Math.round(inches * 2.54)} cm`)
  const title = design.variant === 'console' ? 'Your Custom Console' : 'Your Custom Shelf'

  const payNow = () => {
    if (!share.checkoutUrl || leaving) return
    setLeaving(true)
    trackMetaEvent('InitiateCheckout', {
      value: price.amountCents / 100,
      currency: price.currency,
      num_items: 1,
      content_type: 'product',
    })
    window.location.href = share.checkoutUrl
  }

  const notes = (
    <>
      <p className="text-[16px] font-medium tracking-[0.01em] text-squarage-black">Prepared for {share.customerName}</p>
      <p className="text-[16px] leading-relaxed tracking-[0.01em] text-squarage-black/80 whitespace-pre-line break-words">
        {share.notes || 'This is the design we will build for you. Drag the shelf to look around it.'}
      </p>
    </>
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
    if (!share.checkoutUrl) {
      return (
        <p className={`text-[15px] leading-snug text-squarage-black/80 ${size === 'desktop' ? 'mt-5' : ''}`}>
          Checkout is not ready yet. <Link href="/contact" className="underline text-squarage-green">Get in touch</Link> and we will sort it out.
        </p>
      )
    }
    return (
      <button onClick={payNow} disabled={leaving} className={`${payButtonClass} ${size === 'desktop' ? 'mt-5 py-4 text-2xl' : 'py-3 text-xl'}`}>
        {leaving ? 'Opening checkout...' : size === 'desktop' ? 'Pay Now' : `Pay Now · ${formatMoney(price.amountCents)}`}
      </button>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-cream overflow-hidden pt-[60px] md:pt-[90px] lg:pt-[98px]">
      {/* Main grid — mobile: flex column, desktop: 3-col grid (the Shelf Builder's) */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[320px_minmax(0,1fr)_340px] md:grid-rows-[2fr_1fr] min-h-0 border-t border-squarage-black">

        {/* CENTER — title + viewer (first on mobile) */}
        <div className="order-first md:order-2 md:row-span-2 flex flex-col min-h-0 h-[45dvh] md:h-auto shrink-0">
          <div className="px-4 md:px-8 py-1 flex items-center justify-center shrink-0">
            <h1 className="text-[24px] md:text-[42px] font-bold tracking-[0.02em] text-squarage-black">{title}</h1>
          </div>
          <div className="h-px bg-squarage-black" />
          <div className="relative flex-1 flex items-center justify-center min-h-0 p-1 md:p-5 touch-none">
            <div className="w-full h-full cursor-grab active:cursor-grabbing touch-none" {...handlers}>
              <RenderedShelfView
                isCorner={isCorner}
                flatParams={flatParams}
                cornerParams={cornerParams}
                rotation={rotation + Math.PI / 4}
                tilt={camera.tiltDeg}
                finish={design.finish}
                width={p.width}
                height={p.height}
                depth={p.depth}
                length={p.length}
              />
            </div>
            <span className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 text-[12px] md:text-[14px] font-medium tracking-[0.01em] text-squarage-black/50 select-none pointer-events-none">
              <span className="hidden md:inline">Drag to rotate</span>
              <span className="md:hidden">Swipe to rotate</span>
            </span>
          </div>
        </div>

        {/* LEFT — the design's numbers (scrolls on mobile, where the notes and price join it) */}
        <div className="order-2 md:order-1 md:row-span-2 border-t md:border-t-0 md:border-r border-squarage-black flex flex-col flex-1 md:flex-none overflow-y-auto pb-24 md:pb-0 touch-pan-y md:touch-auto">
          <div className="px-5 md:px-7 pt-6 pb-5 flex flex-col gap-4">
            <SectionLabel>Design</SectionLabel>
            <div className="flex flex-col gap-2">
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
            <div className="flex flex-col gap-2">
              <SpecRow label="Width" value={dim(p.width)} />
              {isCorner && <SpecRow label="Length" value={dim(p.length)} />}
              <SpecRow label="Height" value={dim(p.height)} />
              {design.variant === 'console' && design.surfaceHeight !== null && (
                <SpecRow label="Surface Height" value={dim(design.surfaceHeight)} />
              )}
              <SpecRow label="Depth" value={dim(p.depth)} />
            </div>
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
              <SectionLabel>Price</SectionLabel>
              {priceRows}
            </div>
          </div>
        </div>

        {/* RIGHT — Dylan's notes */}
        <div className="hidden md:flex md:order-3 border-l border-squarage-black flex-col min-h-0">
          <div className="px-7 pt-6 pb-4 shrink-0">
            <SectionLabel>Notes</SectionLabel>
          </div>
          <div className="px-7 pb-6 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
            {notes}
          </div>
        </div>

        {/* BOTTOM RIGHT — price and Pay Now, where the builder has Get Quote */}
        <div className="hidden md:flex md:order-4 border-l border-t border-squarage-black px-7 py-6 flex-col justify-between">
          {priceRows}
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
