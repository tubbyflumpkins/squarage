'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from 'shopify-buy'
import { useImageCache } from '@/context/ImageCacheContext'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const { preloadProductImages, isProductPreloaded } = useImageCache()
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Format price
  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(price))
  }

  // Get the current price from first variant
  const currentPrice = product.variants?.[0] 
    ? formatPrice(String(product.variants[0].price.amount), product.variants[0].price.currencyCode)
    : 'Price unavailable'


  // Handle hover to prefetch product details if not already preloaded
  const handleMouseEnter = () => {
    if (!isProductPreloaded(product.id.toString())) {
      // Preload product images on hover for instant navigation
      preloadProductImages(product)
    }
  }

  return (
    <Link 
      href={`/products/${product.handle}`}
      className={`block ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      {/* Product Image */}
      <div className="relative bg-gray-50 mb-4">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0].src}
            alt={product.images[0].altText || product.title}
            width={600}
            height={600}
            className="w-full h-auto object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            priority={false} // Let the grid manage priority loading
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 font-neue-haas">No Image</span>
          </div>
        )}
        
        {/* Loading indicator for main image */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Product Info - Name and Price aligned with image edges */}
      <div className="flex justify-between items-start">
        <h3 className="font-neue-haas font-medium text-sm md:text-lg text-gray-900">
          {product.title}
        </h3>
        <span className="font-neue-haas font-medium text-sm md:text-lg text-gray-900 ml-4">
          {currentPrice}
        </span>
      </div>
    </Link>
  )
}