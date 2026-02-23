'use client'

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
  
  // Use special styling on contact page only
  const useSpecialStyling = pathname === '/contact'
  
  if (useSpecialStyling) {
    return (
      <button
        onClick={onClick}
        className="fixed top-6 right-14 sm:right-16 flex items-center justify-center w-[26px] h-[26px] sm:w-[33px] sm:h-[33px] bg-white group z-[10005] transition-all duration-300 drop-shadow-lg md:hidden"
        aria-label="Shopping cart"
        style={{ isolation: 'isolate' }}
      >
        <BagIcon className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] text-squarage-red" />
        
        {/* Cart count badge */}
        {state.totalQuantity > 0 && (
          <span className="absolute -top-2 -left-2 flex items-center justify-center w-5 h-5 bg-squarage-orange text-white text-xs font-bold rounded-full">
            {state.totalQuantity > 9 ? '9+' : state.totalQuantity}
          </span>
        )}
      </button>
    )
  }
  
  return (
    <button
      onClick={onClick}
      className="fixed top-6 right-14 sm:right-16 flex items-center justify-center w-[26px] h-[26px] sm:w-[33px] sm:h-[33px] bg-squarage-green group z-[10005] transition-all duration-300 drop-shadow-lg md:hidden"
      aria-label="Shopping cart"
      style={{ isolation: 'isolate' }}
    >
      <BagIcon className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] text-white" />
      
      {/* Cart count badge */}
      {state.totalQuantity > 0 && (
        <span className="absolute -top-2 -left-2 flex items-center justify-center w-5 h-5 bg-squarage-orange text-white text-xs font-bold rounded-full">
          {state.totalQuantity > 9 ? '9+' : state.totalQuantity}
        </span>
      )}
    </button>
  )
}