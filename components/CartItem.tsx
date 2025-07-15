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
    <div className={`bg-cream p-4 rounded-lg border-2 border-squarage-red ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          {item.variant?.image || item.variant?.product?.images?.[0] ? (
            <Image
              src={item.variant?.image?.src || item.variant?.product?.images?.[0]?.src}
              alt={item.variant?.image?.altText || item.variant?.product?.title || 'Product'}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="flex-1">
          <h3 className="font-neue-haas font-medium text-squarage-black">
            {item.title || item.variant?.product?.title || 'Unknown Product'}
          </h3>
          {item.variant?.title && item.variant.title !== 'Default Title' && (
            <p className="text-sm text-gray-600">{item.variant.title}</p>
          )}
          
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Quantity Controls */}
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="w-6 h-6 flex items-center justify-center bg-squarage-green text-white hover:bg-squarage-blue disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <span className="text-xl leading-none">-</span>
              </button>
              
              <span className="w-8 text-center font-neue-haas">{item.quantity || 0}</span>
              
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating}
                className="w-6 h-6 flex items-center justify-center bg-squarage-green text-white hover:bg-squarage-blue disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <span className="text-xl leading-none">+</span>
              </button>
            </div>
            
            {/* Price */}
            <p className="font-neue-haas font-medium">
              {formatPrice(item.variant?.price)}
            </p>
          </div>
        </div>
        
        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isUpdating}
          className="text-gray-400 hover:text-squarage-red transition-colors disabled:cursor-not-allowed"
          aria-label="Remove item"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}