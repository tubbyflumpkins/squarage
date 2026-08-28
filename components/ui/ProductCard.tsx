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
}

// Shared by the hover slideshow and the Mateo auto-cycle so both run at the
// same rate.
const CYCLE_INTERVAL_MS = 2200

export default function ProductCard({ product, className = '', selectedFinish, collectionName }: ProductCardProps) {
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
  // and tilted. The tilt is seeded off the product id so each card keeps its
  // own angle instead of every card leaning the same way.
  const overlayId = useId().replace(/:/g, '')
  const tilt = useMemo(() => {
    const key = String(product.id)
    let hash = 0
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
    return {
      top: -3 - (hash % 55) / 10,
      bottom: 2 + ((hash >> 5) % 50) / 10,
    }
  }, [product.id])

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
              className="absolute left-[3%] top-[1%] w-[92%] overflow-visible"
              style={{ transform: `rotate(${tilt.top}deg)` }}
            >
              <path id={`${overlayId}-top`} d="M 1 19 Q 50 6 99 15" fill="none" />
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
            className="absolute right-[3%] bottom-[1%] w-[92%] overflow-visible"
            style={{ transform: `rotate(${tilt.bottom}deg)` }}
          >
            <path id={`${overlayId}-bottom`} d="M 1 8 Q 50 21 99 12" fill="none" />
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
