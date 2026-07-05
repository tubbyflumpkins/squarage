'use client'

import Link from 'next/link'
import { Product } from 'shopify-buy'
import { preloadProductImages, isProductPreloaded } from '@/lib/productImagePreload'
import { useState, useRef, useCallback, useMemo } from 'react'
import FastProductImage from '@/components/FastProductImage'

interface ProductCardProps {
  product: Product
  className?: string
  selectedFinish?: string
}

export default function ProductCard({ product, className = '', selectedFinish }: ProductCardProps) {
  const [hovering, setHovering] = useState(false)
  const [hoverImageIndex, setHoverImageIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Format price
  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price))
  }

  // Get the current price from first variant
  const currentPrice = product.variants?.[0]
    ? formatPrice(String(product.variants[0].price.amount), product.variants[0].price.currencyCode)
    : 'Price unavailable'

  // Get all product images, filtered by selectedFinish if applicable,
  // and excluding images with "dimensions" in the alt text
  const allImages = useMemo(() => {
    if (!product.images?.length) return []

    let images = product.images.filter(img => {
      const alt = (img.altText || '').toLowerCase()
      return !alt.includes('dimensions')
    })

    if (selectedFinish) {
      const finishLower = selectedFinish.toLowerCase()
      const finishImages = images.filter(img => {
        const text = (img.altText || img.src || '').toLowerCase()
        return text.includes(finishLower)
      })
      if (finishImages.length > 0) {
        images = finishImages
      }
    }

    return images
  }, [product.images, selectedFinish])

  // The first image is the default display image
  const displayImage = allImages[0] || null

  // Check if device supports hover (desktop)
  const isHoverDevice = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(hover: hover)').matches
  }, [])

  const handleMouseEnter = useCallback(() => {
    // Preload product images on hover if not already done
    if (!isProductPreloaded(product.id.toString())) {
      preloadProductImages(product)
    }

    // Only start hover slideshow on desktop devices with hover capability
    if (!isHoverDevice()) return
    if (allImages.length <= 1) return

    setHovering(true)
    setHoverImageIndex(0)

    // Start cycling through images
    intervalRef.current = setInterval(() => {
      setHoverImageIndex(prev => (prev + 1) % allImages.length)
    }, 1200)
  }, [isHoverDevice, allImages.length, product])

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
    setHoverImageIndex(0)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return (
    <Link
      href={`/products/${product.handle}`}
      className={`block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Product Image */}
      <div
        className="relative bg-gray-50 mb-4 overflow-hidden transition-transform duration-300 ease-out"
        style={{ transform: hovering ? 'scale(1.03)' : 'scale(1)' }}
      >
        {allImages.length > 0 ? (
          <div className="relative">
            {/* Base image to maintain layout flow */}
            <FastProductImage
              src={displayImage!.src}
              alt={displayImage!.altText || product.title}
              width={600}
              height={600}
              className="w-full h-auto object-contain"
            />

            {/* Stacked images for crossfade on hover */}
            {allImages.length > 1 && allImages.map((img, index) => (
              <div
                key={img.src}
                className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity: hovering && hoverImageIndex === index ? 1 : 0 }}
                aria-hidden={!(hovering && hoverImageIndex === index)}
              >
                <FastProductImage
                  src={img.src}
                  alt={img.altText || product.title}
                  width={600}
                  height={600}
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 font-neue-haas">No Image</span>
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
