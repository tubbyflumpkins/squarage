'use client'

import Link from 'next/link'
import { Product } from 'shopify-buy'
import { mateoStyleForHandle, mateoUnifiedUrl } from '@/lib/mateoProducts'
import { preloadProductImages, isProductPreloaded } from '@/lib/productImagePreload'
import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react'
import FastProductImage from '@/components/FastProductImage'
import { marolaTextWidth } from '@/lib/marolaMetrics'

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

// Hover-title geometry. Rotation happens on a <g> *inside* the SVG rather
// than on the element, so the box never moves and the browser's default
// `overflow: hidden` on <svg> is a hard backstop — a tilted line physically
// cannot escape the image. The numbers below are chosen so the ink stays
// inside the viewBox even in the worst case (max font size, full-width text,
// widest glyph, full ascender and descender); scripts/verifyOverlayBounds.mjs
// re-checks that and fails if a new line style breaks it.
const OVERLAY_VIEWBOX_HEIGHT = 34
const OVERLAY_ORIGIN_Y = 17
const OVERLAY_MAX_FONT_SIZE = 9
const OVERLAY_TEXT_WIDTH = 88

// Each style is one tilt paired with an arc that bows to suit it. Cards take
// their top and bottom line from different offsets into this list, so the two
// lines on a card never share a style and neighbouring cards never match.
export const OVERLAY_LINE_STYLES = [
  { tilt: -9, arc: 'M 2 22.0 Q 50 18.6 98 21.2' },
  { tilt: 5.5, arc: 'M 2 18.8 Q 50 22.2 98 19.6' },
  { tilt: -3, arc: 'M 2 20.6 Q 50 18.5 98 22.2' },
  { tilt: 10, arc: 'M 2 21.8 Q 50 19.4 98 18.6' },
  { tilt: -6.5, arc: 'M 2 19.0 Q 50 21.9 98 22.0' },
  { tilt: 8, arc: 'M 2 22.2 Q 50 20.0 98 19.0' },
  { tilt: -4.5, arc: 'M 2 18.6 Q 50 21.4 98 21.8' },
]

// How much of the card the overlay spans. Text is centred in its own box, so
// a narrower box pulls the line toward the edge that box is pinned to. 5 and
// 7 are coprime, so width and tilt only repeat every 35 cards.
const OVERLAY_WIDTHS = ['84%', '78%', '88%', '74%', '82%']


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
  const topStyle = OVERLAY_LINE_STYLES[index % OVERLAY_LINE_STYLES.length]
  const bottomStyle = OVERLAY_LINE_STYLES[(index + 3) % OVERLAY_LINE_STYLES.length]
  const topWidth = OVERLAY_WIDTHS[index % OVERLAY_WIDTHS.length]
  const bottomWidth = OVERLAY_WIDTHS[(index + 2) % OVERLAY_WIDTHS.length]

  // Sized off Marola's real advance widths, so a long title shrinks to fit
  // instead of running past the edge of the card.
  const fitFontSize = (text: string) =>
    Math.min(OVERLAY_MAX_FONT_SIZE, OVERLAY_TEXT_WIDTH / Math.max(marolaTextWidth(text), 0.001))

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
            across the bottom right. Both stay clear of the middle. */}
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ease-out"
          style={{ opacity: hovering ? 1 : 0 }}
          aria-hidden
        >
          {collectionLine && (
            <svg
              viewBox={`0 0 100 ${OVERLAY_VIEWBOX_HEIGHT}`}
              className="absolute left-[2%] top-0"
              style={{ width: topWidth }}
            >
              <defs>
                <path id={`${overlayId}-top`} d={topStyle.arc} />
              </defs>
              <g transform={`rotate(${topStyle.tilt} 50 ${OVERLAY_ORIGIN_Y})`}>
                <text
                  fill="#4A9B4E"
                  fontFamily="Marola, serif"
                  fontSize={fitFontSize(collectionLine)}
                >
                  <textPath href={`#${overlayId}-top`} startOffset="50%" textAnchor="middle">
                    {collectionLine}
                  </textPath>
                </text>
              </g>
            </svg>
          )}

          <svg
            viewBox={`0 0 100 ${OVERLAY_VIEWBOX_HEIGHT}`}
            className="absolute right-[2%] bottom-0"
            style={{ width: bottomWidth }}
          >
            <defs>
              <path id={`${overlayId}-bottom`} d={bottomStyle.arc} />
            </defs>
            <g transform={`rotate(${bottomStyle.tilt} 50 ${OVERLAY_ORIGIN_Y})`}>
              <text
                fill="#4A9B4E"
                fontFamily="Marola, serif"
                fontSize={fitFontSize(product.title)}
              >
                <textPath href={`#${overlayId}-bottom`} startOffset="50%" textAnchor="middle">
                  {product.title}
                </textPath>
              </text>
            </g>
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
