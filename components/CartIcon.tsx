'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { usePathname } from 'next/navigation'

const BagIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

interface CartIconProps {
  onClick: () => void
}

export default function CartIcon({ onClick }: CartIconProps) {
  const { state } = useCart()
  const pathname = usePathname()
  const [quoteFlowOpen, setQuoteFlowOpen] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setQuoteFlowOpen(detail?.open ?? false)
    }
    window.addEventListener('quoteflow', handler)
    return () => window.removeEventListener('quoteflow', handler)
  }, [])

  // Determine styling: quoteflow = white bg + green icon, contact = white bg + red icon, default = green bg + white icon
  const isContact = pathname === '/contact'
  const useInverted = isContact || quoteFlowOpen
  const iconColor = quoteFlowOpen ? 'text-squarage-green' : isContact ? 'text-squarage-red' : 'text-white'

  return (
    <button
      onClick={onClick}
      className={`fixed top-6 right-14 sm:right-16 flex items-center justify-center w-[26px] h-[26px] sm:w-[33px] sm:h-[33px] ${
        useInverted ? 'bg-white' : 'bg-squarage-green'
      } group z-[10005] transition-all duration-300 drop-shadow-lg md:hidden`}
      aria-label="Shopping cart"
      style={{ isolation: 'isolate' }}
    >
      <BagIcon className={`w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] ${iconColor}`} />

      {/* Cart count badge */}
      {state.totalQuantity > 0 && (
        <span className="absolute -top-2 -left-2 flex items-center justify-center w-5 h-5 bg-squarage-orange text-white text-xs font-bold rounded-full">
          {state.totalQuantity > 9 ? '9+' : state.totalQuantity}
        </span>
      )}
    </button>
  )
}