'use client'

import Link from 'next/link'
import { Product } from 'shopify-buy'
import { mateoStyleForHandle, mateoUnifiedUrl } from '@/lib/mateoProducts'
import { preloadProductImages, isProductPreloaded } from '@/lib/productImagePreload'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import FastProductImage from '@/components/FastProductImage'

interface ProductCardProps {
  product: Product
  className?: string
  selectedFinish?: string
}

// Shared by the hover slideshow and the Mateo auto-cycle so both run at the
// same rate.
const CYCLE_INTERVAL_MS = 1200

export default function ProductCard({ product, className = '', selectedFinish }: ProductCardProps) {
  const [hovering, setHovering] = useState(false)
  const [hoverImageIndex, setHoverImageIndex] = useState(0)
  const [cycleIndex, setCycleIndex] = useState(0)
  const [inView, setInView] = useState(false)
  const rootRef = useRef<HTMLAnchorElement>(null)
  // Hover-capable (desktop) only, set after mount: the crossfade stack decodes
  // every product image at full resolution, which blows iOS Safari's per-tab
  // decoded-image budget and white-screens the page on phones — where the
  // hover slideshow can never run anyway. SSR renders without the stack.
  const [enableHoverStack, setEnableHoverStack] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setEnableHoverStack(window.matchMedia('(hover: hover)').matches)
  }, [])

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

  // The three Mateo chair cards color-cycle on their own: every Shopify image
  // is the chair in a different color, so the card shuffles through them
  // (random start, random order) instead of waiting for hover.
  const autoCycle = mateoStyleForHandle(String(product.handle)) !== undefined && allImages.length > 1

  // Random starting image, and only cycle while the card is on screen.
  useEffect(() => {
    if (!autoCycle) return
    setCycleIndex(Math.floor(Math.random() * allImages.length))
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoCycle, allImages.length])

  useEffect(() => {
    if (!autoCycle || !inView) return
    const timer = setInterval(() => {
      setCycleIndex((prev) => {
        // Uniform pick over all images except the one showing
        let next = Math.floor(Math.random() * (allImages.length - 1))
        if (next >= prev) next++
        return next
      })
    }, CYCLE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [autoCycle, inView, allImages.length])

  // The default display image. Touch devices never mount the crossfade stack
  // (decoded-image budget — see enableHoverStack above), so auto-cycling
  // there swaps the single base image in place instead.
  const displayImage = (autoCycle && !enableHoverStack ? allImages[cycleIndex] : allImages[0]) || allImages[0] || null

  // Check if device supports hover (desktop)
  const isHoverDevice = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(hover: hover)').matches
  }, [])

  const handleMouseEnter = useCallback(() => {
    // Hover-only feature: iOS fires mouseenter on first tap, so bail before
    // preloading full-resolution variants a touch device will never show
    if (!isHoverDevice()) return

    // Preload product images on hover if not already done
    if (!isProductPreloaded(product.id.toString())) {
      preloadProductImages(product)
    }

    if (allImages.length <= 1) return

    setHovering(true)

    // Auto-cycling cards are already rotating on their own — hover only
    // keeps the scale effect
    if (autoCycle) return

    setHoverImageIndex(0)

    // Start cycling through images
    intervalRef.current = setInterval(() => {
      setHoverImageIndex(prev => (prev + 1) % allImages.length)
    }, CYCLE_INTERVAL_MS)
  }, [isHoverDevice, allImages.length, product, autoCycle])

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
    setHoverImageIndex(0)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // The three Mateo style products share one unified page — their cards link
  // straight there with the style preselected (no redirect hop).
  const mateoStyle = mateoStyleForHandle(String(product.handle))

  // Which stacked image is visible: the auto-cycle drives it for Mateo
  // cards; everything else shows on hover only.
  const activeStackIndex = autoCycle ? cycleIndex : hovering ? hoverImageIndex : -1

  return (
    <Link
      ref={rootRef}
      href={mateoStyle ? mateoUnifiedUrl(mateoStyle) : `/products/${product.handle}`}
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

            {/* Stacked images for crossfade on hover — desktop only */}
            {enableHoverStack && allImages.length > 1 && allImages.map((img, index) => (
              <div
                key={img.src}
                className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity: activeStackIndex === index ? 1 : 0 }}
                aria-hidden={activeStackIndex !== index}
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
