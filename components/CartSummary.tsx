'use client'

import { useCart } from '@/context/CartContext'
import { trackMetaEvent } from '@/lib/metaPixel'

export default function CartSummary() {
  const { state } = useCart()
  
  const formatPrice = (priceObj: any) => {
    if (!priceObj || !priceObj.amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: priceObj.currencyCode || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(priceObj.amount))
  }
  
  const handleCheckout = () => {
    if (state.checkoutUrl) {
      // Meta Pixel InitiateCheckout — the CAPI half uses a keepalive fetch so
      // it survives the redirect. Line items are in the raw Buy SDK shape.
      const contents = state.lineItems
        .map((item: any) => ({
          id: item.variant?.id as string,
          quantity: item.quantity || 0,
          item_price: parseFloat(item.variant?.price?.amount || '0'),
        }))
        .filter(c => c.id)
      trackMetaEvent('InitiateCheckout', {
        value: parseFloat(state.subtotalPrice.amount || '0'),
        currency: state.subtotalPrice.currencyCode || 'USD',
        num_items: state.totalQuantity,
        content_ids: contents.map(c => c.id),
        content_type: 'product',
        contents,
      })

      // Hand off to Shopify checkout. Drop the stored id so a returning
      // customer starts a fresh cart instead of resuming a completed one.
      localStorage.removeItem('shopify_checkout_id')
      window.location.href = state.checkoutUrl
    }
  }
  
  return (
    <div className="p-6 space-y-4">
      {/* Subtotal */}
      <div className="flex justify-between items-center">
        <span className="text-2xl font-neue-haas font-bold text-white">Subtotal</span>
        <span className="text-2xl font-neue-haas font-bold text-white">
          {formatPrice(state.subtotalPrice)}
        </span>
      </div>
      
      {/* Shipping Note */}
      <p className="text-sm font-neue-haas text-white opacity-80">
        Shipping calculated at checkout
      </p>
      
      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={!state.checkoutUrl || state.isLoading}
        className="w-full bg-squarage-yellow font-bold font-neue-haas text-2xl py-4 px-8 text-white hover:bg-squarage-orange hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Checkout
      </button>
      
      {/* Test Mode Notice */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-squarage-yellow bg-opacity-20 rounded">
          <p className="text-xs font-neue-haas text-white">
            <strong>Test Mode:</strong> Use card 4111 1111 1111 1111
          </p>
        </div>
      )}
    </div>
  )
}