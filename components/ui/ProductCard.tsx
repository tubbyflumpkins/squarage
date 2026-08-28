'use client'

import Link from 'next/link'
import { Product } from 'shopify-buy'
import { mateoStyleForHandle, mateoUnifiedUrl } from '@/lib/mateoProducts'
import { preloadProductImages, isProductPreloaded } from '@/lib/productImagePreload'
import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react'
import FastProductImage from '@/components/FastProductImage'

interface ProductCardProps {
  product: Product
  className?: string
  selectedFinish?: string
  collectionName?: string
  /** Position in the grid — picks the hover-title layout */
  index?: number
}

// Shared by the hover slideshow and the Mateo auto-cycle so both run at the
// same rate.
const CYCLE_INTERVAL_MS = 2200

// Hover-title layouts, applied by grid position (index % length). Each entry
// pairs a tilt with an arc that bows the same way, so the two lines never read
// as the same lockup twice in a row. 7 entries so the cycle doesn't line up
// with the 2- or 3-column grid.
const OVERLAY_VARIANTS = [
  { topTilt: -7.5, bottomTilt: 4.5, topArc: 'M 1 20 Q 50 5 99 14', bottomArc: 'M 1 7 Q 50 22 99 11', topWidth: '92%', bottomWidth: '90%' },
  { topTilt: 4.5, bottomTilt: -6.5, topArc: 'M 1 12 Q 50 23 99 17', bottomArc: 'M 1 15 Q 50 3 99 9', topWidth: '88%', bottomWidth: '94%' },
  { topTilt: -3, bottomTilt: 9.5, topArc: 'M 1 17 Q 50 8 99 19', bottomArc: 'M 1 9 Q 50 19 99 7', topWidth: '94%', bottomWidth: '86%' },
  { topTilt: -11, bottomTilt: 2.5, topArc: 'M 1 21 Q 50 9 99 12', bottomArc: 'M 1 6 Q 50 20 99 14', topWidth: '86%', bottomWidth: '92%' },
  { topTilt: 7, bottomTilt: 6, topArc: 'M 1 11 Q 50 21 99 14', bottomArc: 'M 1 12 Q 50 22 99 8', topWidth: '90%', bottomWidth: '88%' },
  { topTilt: -5, bottomTilt: -9, topArc: 'M 1 18 Q 50 4 99 17', bottomArc: 'M 1 16 Q 50 5 99 12', topWidth: '93%', bottomWidth: '91%' },
  { topTilt: 2.5, bottomTilt: 11, topArc: 'M 1 14 Q 50 20 99 11', bottomArc: 'M 1 10 Q 50 21 99 6', topWidth: '87%', bottomWidth: '94%' },
]

export default function ProductCard({ product, className = '', selectedFinish, collectionName, index = 0 }: ProductCardProps) {
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

    setHovering(true)

    if (allImages.length <= 1) return

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

  // Hover title overlay: hand-lettered look in Marola, set on a shallow arc
  // and tilted. The layout comes from the card's grid position, so a card
  // always looks the same but never matches its neighbour.
  const overlayId = useId().replace(/:/g, '')
  const variant = OVERLAY_VARIANTS[index % OVERLAY_VARIANTS.length]

  // Marola is a serif at roughly 0.46em average advance; shrink the type so
  // long titles still land inside the card instead of running off the edge.
  const fitFontSize = (text: string) => Math.min(12, 88 / Math.max(text.length * 0.46, 1))

  const collectionLine = collectionName ? `${collectionName} Collection` : ''

  return (
    <Link
      ref={rootRef}
      href={mateoStyle ? mateoUnifiedUrl(mateoStyle) : `/products/${product.handle}`}
      className={`block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Product Image */}
      <div className="relative bg-gray-50 mb-4 overflow-hidden">
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

        {/* Hover overlay: collection curving across the top, product name
            across the bottom right. Kept clear of the middle of the image. */}
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ease-out"
          style={{ opacity: hovering ? 1 : 0 }}
          aria-hidden
        >
          {collectionLine && (
            <svg
              viewBox="0 0 100 24"
              className="absolute left-[3%] top-[1%] overflow-visible"
              style={{ width: variant.topWidth, transform: `rotate(${variant.topTilt}deg)` }}
            >
              <path id={`${overlayId}-top`} d={variant.topArc} fill="none" />
              <text
                fill="#4A9B4E"
                fontSize={fitFontSize(collectionLine)}
                style={{ fontFamily: 'Marola, serif' }}
              >
                <textPath href={`#${overlayId}-top`} startOffset="0%">
                  {collectionLine}
                </textPath>
              </text>
            </svg>
          )}

          <svg
            viewBox="0 0 100 24"
            className="absolute right-[3%] bottom-[1%] overflow-visible"
            style={{ width: variant.bottomWidth, transform: `rotate(${variant.bottomTilt}deg)` }}
          >
            <path id={`${overlayId}-bottom`} d={variant.bottomArc} fill="none" />
            <text
              fill="#4A9B4E"
              fontSize={fitFontSize(product.title)}
              style={{ fontFamily: 'Marola, serif' }}
            >
              <textPath href={`#${overlayId}-bottom`} startOffset="100%" textAnchor="end">
                {product.title}
              </textPath>
            </text>
          </svg>
        </div>
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
