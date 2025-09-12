'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'

interface StickyAddToCartProps {
  product: {
    title: string
    images: Array<{ src: string; altText: string }>
  }
  selectedVariant: {
    id: string
    title: string
    price: {
      amount: string
      currencyCode: string
    }
  }
  onAddToCart: () => Promise<void>
  variantLabel: string // "Color" for Tiled, "Finish" for Warped
  isVisible: boolean
}

export default function StickyAddToCart({ 
  product, 
  selectedVariant, 
  onAddToCart, 
  variantLabel,
  isVisible 
}: StickyAddToCartProps) {
  const [isAdding, setIsAdding] = useState(false)

  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price))
  }

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      await onAddToCart()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-cream border-t border-squarage-black z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Mobile */}
      <div className="lg:hidden px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {product.images?.[0] && (
            <Image
              src={product.images[0].src}
              alt={product.images[0].altText || product.title}
              width={48}
              height={48}
              className="w-12 h-12 object-cover border border-gray-200"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium font-neue-haas text-squarage-black truncate">
              {product.title}
            </p>
            <p className="text-xs font-neue-haas text-gray-600">
              {variantLabel}: {selectedVariant.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold font-neue-haas text-squarage-black whitespace-nowrap">
            {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="px-4 py-2 bg-squarage-orange text-white font-medium font-neue-haas text-sm whitespace-nowrap hover:bg-squarage-yellow transition-colors duration-200 disabled:bg-gray-400"
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {product.images?.[0] && (
                <Image
                  src={product.images[0].src}
                  alt={product.images[0].altText || product.title}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover border border-gray-200"
                />
              )}
              <div>
                <h3 className="text-lg font-bold font-neue-haas text-squarage-black">
                  {product.title}
                </h3>
                <p className="text-base font-neue-haas text-gray-600">
                  {variantLabel}: {selectedVariant.title} • {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
                </p>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="px-8 py-3 bg-squarage-orange text-white font-bold font-neue-haas text-lg hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:hover:scale-100 flex items-center gap-2"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}