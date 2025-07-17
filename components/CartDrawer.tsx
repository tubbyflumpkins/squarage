'use client'

import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import CartItem from './CartItem'
import CartSummary from './CartSummary'
import { useRouter } from 'next/navigation'

export default function CartDrawer() {
  const { state, closeCart } = useCart()
  const router = useRouter()
  
  return (
    <>
      {/* Click Outside to Close Overlay */}
      {state.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9990]"
          onClick={closeCart}
        />
      )}
      
      {/* Cart Drawer */}
      <div
        className={`fixed top-0 h-full z-[9995] bg-squarage-green transition-transform duration-300 ease-out drop-shadow-2xl ${
          state.isOpen 
            ? 'translate-x-0' 
            : 'translate-x-full'
        }`}
        style={{
          right: 0,
          width: 'min(480px, 100vw)',
          isolation: 'isolate',
          willChange: state.isOpen ? 'transform' : 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="pt-20 pb-6 px-6 sm:pt-24 md:pt-28 lg:pt-32 border-b-2 border-white">
            <h2 className="text-4xl md:text-5xl font-bold font-neue-haas text-white text-center">Your Cart</h2>
          </div>
          
          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto">
            {state.lineItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <p className="text-2xl font-neue-haas text-white mb-6 text-center">Weird... theres nothing here?</p>
                <button
                  onClick={() => {
                    closeCart()
                    router.push('/easter-egg-game')
                  }}
                  className="bg-squarage-orange font-bold font-neue-haas text-2xl py-4 px-8 text-white hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 relative"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-squarage-red transform translate-x-0.5 translate-y-0.5">
                    Totally strange
                  </span>
                  <span className="relative z-10 text-white">
                    Totally strange
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {state.lineItems.map((item, index) => (
                  <CartItem key={item.id || index} item={item} />
                ))}
              </div>
            )}
          </div>
          
          {/* Cart Summary - Only show when items exist */}
          {state.lineItems.length > 0 && (
            <CartSummary />
          )}
        </div>
      </div>
    </>
  )
}