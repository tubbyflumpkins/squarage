'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trackMetaEvent } from '@/lib/metaPixel'

// The pieces the two kinds of customer link page share: a shelf link (SharedDesignView) and an
// invoice link (SharedInvoiceView) use the Shelf Builder's grid, the same section headings and
// rows, and the same pay box with Shopify's checkout behind its button.

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[24px] font-semibold tracking-[0.01em] text-squarage-black select-none">
      {children}
    </h3>
  )
}

export function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[16px] font-medium tracking-[0.01em] text-squarage-black">
      <span>{label}</span>
      <span className="tabular-nums text-right">{value}</span>
    </div>
  )
}

export const Divider = () => <div className="h-[1.5px] bg-squarage-black shrink-0" />

/** Under the viewer: how to turn the thing. */
export function ViewerCaption() {
  return (
    <span className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 text-[12px] md:text-[14px] font-medium tracking-[0.01em] text-squarage-black/50 select-none pointer-events-none">
      <span className="hidden md:inline">Drag to rotate</span>
      <span className="md:hidden">Swipe to rotate</span>
    </span>
  )
}

/**
 * The button's work: one InitiateCheckout, then the customer goes to the option's Shopify
 * checkout. `leaving` keeps a second click from firing a second event.
 */
export function usePayNow(checkoutUrl: string | null, price: { amountCents: number; currency: string }, numItems = 1) {
  const [leaving, setLeaving] = useState(false)
  const payNow = () => {
    if (!checkoutUrl || leaving) return
    setLeaving(true)
    trackMetaEvent('InitiateCheckout', {
      value: price.amountCents / 100,
      currency: price.currency,
      num_items: numItems,
      content_type: 'product',
    })
    window.location.href = checkoutUrl
  }
  return { leaving, payNow }
}

const PAY_BUTTON_CLASS = 'w-full bg-squarage-orange text-white font-bold font-neue-haas hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100'

interface PayActionProps {
  paid: boolean
  checkoutUrl: string | null
  leaving: boolean
  onPay: () => void
  /** The desktop button's text, and the mobile bar's (which carries the price). */
  label: string
  mobileLabel: string
  size: 'desktop' | 'mobile'
  /** Under "Paid. Thank you." on desktop. */
  paidNote: string
}

/** The pay box's three states: paid, no checkout yet, or the button. */
export function PayAction({ paid, checkoutUrl, leaving, onPay, label, mobileLabel, size, paidNote }: PayActionProps) {
  if (paid) {
    return (
      <div className={size === 'desktop' ? 'mt-5' : ''}>
        <p className="text-[20px] md:text-2xl font-bold text-squarage-green">Paid. Thank you.</p>
        <p className="hidden md:block mt-1 text-[15px] text-squarage-black/70">{paidNote}</p>
      </div>
    )
  }
  if (!checkoutUrl) {
    return (
      <p className={`text-[15px] leading-snug text-squarage-black/80 ${size === 'desktop' ? 'mt-5' : ''}`}>
        Checkout is not ready yet. <Link href="/contact" className="underline text-squarage-green">Get in touch</Link> and we will sort it out.
      </p>
    )
  }
  return (
    <button onClick={onPay} disabled={leaving} className={`${PAY_BUTTON_CLASS} ${size === 'desktop' ? 'mt-5 py-4 text-2xl' : 'py-3 text-xl'}`}>
      {leaving ? 'Opening checkout...' : size === 'desktop' ? label : mobileLabel}
    </button>
  )
}

/** The bar fixed to the bottom of a phone, holding the mobile pay action. */
export function MobilePayBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-squarage-black bg-cream px-4 pt-3 flex items-center justify-center"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  )
}
