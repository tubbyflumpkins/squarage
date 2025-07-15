'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'

interface CartItemProps {
  item: any // Using any for now since Shopify SDK returns complex objects
}

export default function CartItem({ item }: CartItemProps) {
  const { updateCartItem, removeFromCart } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Debug: log the item structure
  console.log('CartItem received item:', item)
  
  const formatPrice = (priceObj: any) => {
    console.log('formatPrice called with:', priceObj)
    if (!priceObj || !priceObj.amount) {
      console.log('No price object or amount, returning $0.00')
      return '$0.00'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: priceObj.currencyCode || 'USD',
    }).format(parseFloat(priceObj.amount))
  }
  
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateCartItem(item.id, newQuantity)
    } catch (error) {
      console.error('Error updating quantity:', error)
    } finally {
      setIsUpdating(false)
    }
  }
  
  const handleRemove = async () => {
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      await removeFromCart(item.id)
    } catch (error) {
      console.error('Error removing item:', error)
    } finally {
      setIsUpdating(false)
    }
  }
  
  return (
    <div className={`bg-cream p-4 rounded-lg border-2 border-squarage-orange relative ${isUpdating ? 'opacity-50' : ''}`}>
      {/* Remove Button - Top Right */}
      <button
        onClick={handleRemove}
        disabled={isUpdating}
        className="absolute top-2 right-2 text-gray-400 hover:text-squarage-red transition-colors disabled:cursor-not-allowed"
        aria-label="Remove item"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          {item.variant?.image || item.variant?.product?.images?.[0] ? (
            <Image
              src={item.variant?.image?.src || item.variant?.product?.images?.[0]?.src}
              alt={item.variant?.image?.altText || item.variant?.product?.title || 'Product'}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Product Info & Quantity */}
          <div>
            <h3 className="font-neue-haas font-bold text-2xl text-squarage-black leading-tight pr-8">
              {item.title || item.variant?.product?.title || 'Unknown Product'}
            </h3>
            {item.variant?.title && item.variant.title !== 'Default Title' && (
              <p className="text-base font-bold text-squarage-black mt-1">{item.variant.title}</p>
            )}
            
            {/* Quantity Controls & Price */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-4">
                <span className="text-base font-neue-haas font-bold text-squarage-black">Quantity:</span>
                <div className="flex items-center border-2 border-squarage-orange rounded-full overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                    disabled={isUpdating || item.quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center text-squarage-black disabled:text-gray-400 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  
                  <span className="px-3 font-neue-haas font-bold text-squarage-black">{item.quantity || 0}</span>
                  
                  <button
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    disabled={isUpdating}
                    className="w-8 h-8 flex items-center justify-center text-squarage-black disabled:text-gray-400 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Price */}
              <div className="text-right">
                <p className="font-neue-haas font-bold text-lg text-squarage-black">
                  {formatPrice(item.variant?.price)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}