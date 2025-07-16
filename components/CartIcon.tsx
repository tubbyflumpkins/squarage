'use client'

import { useCart } from '@/context/CartContext'

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
  
  return (
    <button
      onClick={onClick}
      className="fixed top-6 right-16 sm:right-18 md:right-24 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-squarage-green group z-[9999] md:hover:scale-110 transition-all duration-300 drop-shadow-lg"
      aria-label="Shopping cart"
      style={{ isolation: 'isolate' }}
    >
      <BagIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
      
      {/* Cart count badge */}
      {state.totalQuantity > 0 && (
        <span className="absolute -top-2 -left-2 flex items-center justify-center w-5 h-5 bg-squarage-orange text-white text-xs font-bold rounded-full">
          {state.totalQuantity > 9 ? '9+' : state.totalQuantity}
        </span>
      )}
    </button>
  )
}