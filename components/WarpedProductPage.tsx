'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { useCart } from '@/context/CartContext'
import FastProductImage from '@/components/FastProductImage'
import ProductFAQ from '@/components/ProductFAQ'
import ShippingEstimator from '@/components/ShippingEstimator'
import StickyAddToCart from '@/components/StickyAddToCart'
import ProductDetailsAccordion from '@/components/ProductDetailsAccordion'
import ProductTrustBadges from '@/components/ProductTrustBadges'
import { CreditCardIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { formatPrice } from '@/lib/formatPrice'
import { useStickyCartVisibility } from '@/lib/useStickyCartVisibility'
import { SerializedProduct } from '@/lib/productTypes'
import { useMetaViewContent } from '@/lib/metaPixel'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'

interface WarpedProductPageProps {
  product: SerializedProduct
}

// Wood finish variants for warped collection
const WARPED_FINISHES = ['Birch', 'Oak', 'Walnut']

export default function WarpedProductPage({ product }: WarpedProductPageProps) {
  useMetaViewContent(product)
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null)
  const [selectedFinish, setSelectedFinish] = useState<string>('Birch')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const addToCartRef = useRef<HTMLDivElement>(null)
  const showStickyCart = useStickyCartVisibility(addToCartRef)
  
  // Use cart context
  const { addToCart } = useCart()
  
  // Check if product has size options
  const sizeOption = product.options?.find(opt => opt.name.toLowerCase() === 'size')
  const availableSizes = sizeOption?.values || []
  
  // Initialize default size on mount
  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0])
    }
  }, [availableSizes, selectedSize])

  // Find dimensions image (if exists) - exclude from carousel
  const dimensionsImage = useMemo(() => {
    return product.images?.find(img => {
      const fileName = img.src.toLowerCase()
      const altText = img.altText?.toLowerCase() || ''
      return fileName.includes('dimensions') || altText.includes('dimensions')
    }) || null
  }, [product.images])

  // Get filtered images based on finish and size selection
  const filteredImages = useMemo(() => {
    const sortedImages: Array<typeof product.images[0]> = []
    const genericImages: Array<typeof product.images[0]> = []
    const addedImageIds = new Set<string>()

    // Process each image and categorize it (excluding dimensions images)
    product.images.forEach(image => {
      const imageText = (image.altText || image.src || '').toLowerCase()

      // Skip dimensions images - they should not appear in the carousel
      if (imageText.includes('dimensions')) {
        return
      }
      
      // Check if image has finish (color) specification
      const hasFinish = WARPED_FINISHES.some(finish => 
        imageText.includes(finish.toLowerCase())
      )
      
      // Check if image has size specification
      const hasSize = availableSizes.some(size => 
        size && imageText.includes(size.toLowerCase())
      )
      
      // If product has sizes (like shoe rack)
      if (availableSizes.length > 0 && selectedSize) {
        if (hasFinish && hasSize) {
          // This image has BOTH color and size - only show if exact match
          const matchesSelectedFinish = imageText.includes(selectedFinish.toLowerCase())
          const matchesSelectedSize = imageText.includes(selectedSize.toLowerCase())
          
          if (matchesSelectedFinish && matchesSelectedSize) {
            // This is a sorted image that matches current selection
            sortedImages.push(image)
          }
          // Images with color+size that don't match are excluded
        } else if (!hasFinish && !hasSize) {
          // Generic image with no color or size - goes to the end
          genericImages.push(image)
        }
        // Images with only color OR only size are excluded
      } else {
        // Product doesn't have sizes (normal warped products)
        if (hasFinish) {
          // Has finish - only show if it matches selected finish
          if (imageText.includes(selectedFinish.toLowerCase())) {
            // This is a sorted image that matches current selection
            sortedImages.push(image)
          }
          // Images with color that don't match are excluded
        } else {
          // No finish or size - generic image, goes to the end
          genericImages.push(image)
        }
      }
    })
    
    // Build final image array: ALL sorted images first, THEN all generic images
    const finalImages: Array<typeof product.images[0]> = []
    
    // Add all sorted images first (avoiding duplicates)
    sortedImages.forEach(image => {
      if (!addedImageIds.has(image.id)) {
        finalImages.push(image)
        addedImageIds.add(image.id)
      }
    })
    
    // Then add all generic images at the end (avoiding duplicates)
    genericImages.forEach(image => {
      if (!addedImageIds.has(image.id)) {
        finalImages.push(image)
        addedImageIds.add(image.id)
      }
    })
    
    // Fallback: if no images selected, show at least something
    if (finalImages.length === 0 && product.images.length > 0) {
      // Try to find any image with the selected finish
      const fallbackFinishImage = product.images.find(image => {
        const imageText = (image.altText || image.src || '').toLowerCase()
        return imageText.includes(selectedFinish.toLowerCase())
      })
      
      if (fallbackFinishImage) {
        finalImages.push(fallbackFinishImage)
      } else {
        // Last resort: show first available image
        finalImages.push(product.images[0])
      }
    }
    
    return finalImages
  }, [product, selectedFinish, selectedSize, availableSizes])

  // Get the selected variant based on finish and size
  const selectedVariant = useMemo(() => {
    if (availableSizes.length > 0 && selectedSize) {
      // Find variant matching both finish and size
      return product.variants.find(variant => 
        variant.selectedOptions?.some(opt => 
          (opt.name === 'Finish' || opt.name === 'Color') && opt.value === selectedFinish
        ) &&
        variant.selectedOptions?.some(opt => 
          opt.name === 'Size' && opt.value === selectedSize
        )
      ) || product.variants[0]
    } else {
      // No sizes, just match finish
      return product.variants.find(variant => 
        variant.title.toLowerCase() === selectedFinish.toLowerCase() ||
        variant.selectedOptions?.some(opt => 
          opt.value.toLowerCase() === selectedFinish.toLowerCase()
        )
      ) || product.variants[0]
    }
  }, [selectedFinish, selectedSize, product.variants, availableSizes])

  // Get metafield value - check multiple namespaces
  const getMetafieldValue = (namespace: string, key: string): string => {
    // Try the specified namespace first
    let metafield = product.metafields?.find(
      field => field.namespace === namespace && field.key === key
    )
    
    // If not found in 'custom' namespace, try 'product' namespace
    if (!metafield && namespace === 'custom') {
      metafield = product.metafields?.find(
        field => field.namespace === 'product' && field.key === key
      )
    }
    
    return metafield?.value || ''
  }

  const getSize = (): string => {
    // First try to get the regular size
    let size = getMetafieldValue('custom', 'size')
    
    // If size is empty, try multisize
    if (!size) {
      size = getMetafieldValue('custom', 'multisize')
    }
    
    // Also check for multi_size (with underscore)
    if (!size) {
      size = getMetafieldValue('custom', 'multi_size')
    }
    
    return size || 'Custom sizing available'
  }

  // Get texture path for finish buttons
  const getFinishTexture = (finishName: string) => {
    const textureMapping: Record<string, string> = {
      'Birch': '/textures/swatches/birch.webp',
      'Oak': '/textures/swatches/oak.webp',
      'Walnut': '/textures/swatches/walnut.webp',
    }
    return textureMapping[finishName] || ''
  }

  // Reset active index when finish or size changes
  useEffect(() => {
    setActiveIndex(0)
    if (mainSwiper) {
      mainSwiper.slideTo(0)
    }
  }, [selectedFinish, selectedSize, mainSwiper])

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    if (mainSwiper) {
      mainSwiper.slideTo(index)
      setActiveIndex(index)
    }
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedVariant || isAddingToCart) return
    
    setIsAddingToCart(true)
    try {
      await addToCart(selectedVariant.id)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Desktop image zoom handlers
  const handleZoomMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
  }, [])

  const handleZoomMouseEnter = useCallback(() => {
    setIsZoomed(true)
  }, [])

  const handleZoomMouseLeave = useCallback(() => {
    setIsZoomed(false)
    setZoomOrigin('50% 50%')
  }, [])

  // Get collection info
  const collection = product.collections?.[0] || { handle: 'warped', title: 'Warped Collection' }

  return (
    <main className="min-h-screen bg-cream">
      {/* Sticky Add to Cart Bar */}
      <StickyAddToCart
        product={product}
        selectedVariant={selectedVariant}
        onAddToCart={handleAddToCart}
        variantLabel="Finish"
        isVisible={showStickyCart}
      />

      <div className="pt-24 md:pt-32 pb-24">
        <div className="w-full max-w-7xl mx-auto">
          {/* Mobile Layout */}
          <div className="lg:hidden px-6">
            {/* Title and Collection */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold font-neue-haas text-squarage-black">
                {product.title}
              </h1>
              <Link 
                href={`/collections/${collection.handle}`}
                className="text-base font-neue-haas text-gray-600 hover:text-squarage-orange transition-colors"
              >
                Part of the {collection.title} →
              </Link>
            </div>

            {/* Mobile Carousel */}
            <div className="relative mb-4" style={{ 
              aspectRatio: filteredImages[0] ? 
                `${filteredImages[0].width} / ${filteredImages[0].height}` : 
                '1 / 1' 
            }}>
              <Swiper
                spaceBetween={0}
                navigation={true}
                modules={[Navigation]}
                className="warped-swiper-mobile h-full"
              >
                {filteredImages.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <FastProductImage
                        src={image.src}
                        alt={image.altText || `${product.title} - ${selectedFinish} - View ${index + 1}`}
                        width={600}
                        height={600}
                        className="w-full h-full object-contain"
                        fillContainer={true}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Price and Description */}
            <div className="mb-6">
              <p className="text-2xl font-bold font-neue-haas text-squarage-black mb-2">
                {selectedVariant && formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
              </p>
              {product.description && (
                <p className="text-base font-neue-haas text-squarage-black leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Finish Variant Selector */}
            <div className="mb-6">
              <h3 className="text-lg font-medium font-neue-haas text-squarage-black mb-3">
                Wood Finish
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {WARPED_FINISHES.map(finish => (
                  <button
                    key={finish}
                    onClick={() => setSelectedFinish(finish)}
                    className={`px-4 py-3 border-2 font-medium font-neue-haas text-sm transition-all ${
                      selectedFinish === finish 
                        ? 'border-squarage-green bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 border border-gray-300 bg-cover bg-center"
                        style={{ backgroundImage: `url(${getFinishTexture(finish)})` }}
                      />
                      <span>{finish}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector - Only show if product has sizes */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium font-neue-haas text-squarage-black mb-3">
                  Size
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-3 border-2 font-medium font-neue-haas text-sm transition-all ${
                        selectedSize === size
                          ? 'border-squarage-green bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span>{size}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Estimator */}
            <div className="mb-6">
              <ShippingEstimator 
                price={parseFloat(selectedVariant?.price.amount || '0')}
                productTitle={product.title}
              />
            </div>

            {/* Add to Cart Button */}
            <div ref={addToCartRef} className="mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || isAddingToCart}
                className="w-full bg-squarage-orange font-bold font-neue-haas text-xl py-4 text-white hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              
              {/* Payment disclaimer - small text with icons */}
              <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-500 font-neue-haas">
                <div className="flex items-center gap-1">
                  <CreditCardIcon className="w-3.5 h-3.5" />
                  <span>Secure checkout powered by Shopify</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <CheckBadgeIcon className="w-3.5 h-3.5" />
                  <span>SSL encrypted</span>
                </div>
              </div>
            </div>

            {/* Product Details Accordion */}
            <div className="mb-8">
              <ProductDetailsAccordion
                productType="warped"
                metafields={product.metafields}
                dimensions={getSize()}
                dimensionsImage={dimensionsImage}
              />
            </div>

            {/* Trust Badges */}
            <div className="mb-8">
              <ProductTrustBadges />
            </div>

            {/* FAQ Section */}
            <div className="mb-8">
              <ProductFAQ productType="warped" />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block w-full px-6">
            <div className="flex flex-row">
            {/* Image Gallery - Left */}
            <div className="w-1/2 pr-8">
              <div className="sticky top-32">
                {/* Main Swiper */}
                <div className="mb-4">
                  <Swiper
                    onSwiper={setMainSwiper}
                    spaceBetween={0}
                    navigation={true}
                    modules={[Navigation]}
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                    className="warped-swiper"
                  >
                    {filteredImages.map((image, index) => (
                      <SwiperSlide key={index}>
                        <div
                          className="relative w-full overflow-hidden cursor-zoom-in"
                          onMouseMove={handleZoomMouseMove}
                          onMouseEnter={handleZoomMouseEnter}
                          onMouseLeave={handleZoomMouseLeave}
                        >
                          <div
                            style={{
                              transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                              transformOrigin: zoomOrigin,
                              transition: 'transform 0.3s ease',
                            }}
                          >
                            <FastProductImage
                              src={image.src}
                              alt={image.altText || `${product.title} - ${selectedFinish} - View ${index + 1}`}
                              width={600}
                              height={600}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {/* Thumbnail Navigation */}
                <div className="flex gap-2 justify-center">
                  {filteredImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`w-20 h-20 border-2 transition-all ${
                        activeIndex === index 
                          ? 'border-squarage-orange' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Image
                        src={image.src}
                        alt={image.altText || `Thumbnail ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Details - Right */}
            <div className="w-1/2 pl-8">
              {/* Title and Collection */}
              <div className="mb-8">
                <p className="text-5xl font-bold font-neue-haas text-squarage-black mb-2">
                  {product.title}
                </p>
                <Link 
                  href={`/collections/${collection.handle}`}
                  className="text-lg font-neue-haas text-gray-600 hover:text-squarage-orange transition-colors inline-flex items-center"
                >
                  Part of the {collection.title} →
                </Link>
              </div>

              {/* Price */}
              <div className="mb-6">
                <p className="text-3xl font-bold font-neue-haas text-squarage-black">
                  {selectedVariant && formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-lg font-neue-haas text-squarage-black leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* Finish Variant Selector */}
              <div className="mb-8">
                <h3 className="text-xl font-medium font-neue-haas text-squarage-black mb-4">
                  Select Wood Finish
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {WARPED_FINISHES.map(finish => (
                    <button
                      key={finish}
                      onClick={() => setSelectedFinish(finish)}
                      className={`px-4 py-3 border-2 font-medium font-neue-haas transition-all ${
                        selectedFinish === finish 
                          ? 'border-squarage-green bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 border border-gray-300 bg-cover bg-center"
                          style={{ backgroundImage: `url(${getFinishTexture(finish)})` }}
                        />
                        <span>{finish}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector - Only show if product has sizes */}
              {availableSizes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-medium font-neue-haas text-squarage-black mb-4">
                    Select Size
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-3 border-2 font-medium font-neue-haas transition-all ${
                          selectedSize === size
                            ? 'border-squarage-green bg-green-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span>{size}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Estimator */}
              <div className="mb-8">
                <ShippingEstimator 
                  price={parseFloat(selectedVariant?.price.amount || '0')}
                  productTitle={product.title}
                />
              </div>

              {/* Add to Cart Button */}
              <div ref={addToCartRef} className="mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || isAddingToCart}
                  className="w-full bg-squarage-orange font-bold font-neue-haas text-2xl py-4 text-white hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </button>

                {/* Payment disclaimer - small text with icons */}
                <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-500 font-neue-haas">
                  <div className="flex items-center gap-1">
                    <CreditCardIcon className="w-3.5 h-3.5" />
                    <span>Secure checkout powered by Shopify</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <CheckBadgeIcon className="w-3.5 h-3.5" />
                    <span>SSL encrypted</span>
                  </div>
                </div>
              </div>

              {/* Product Details Accordion */}
              <div className="mb-8">
                <ProductDetailsAccordion
                  productType="warped"
                  metafields={product.metafields}
                  dimensions={getSize()}
                  dimensionsImage={dimensionsImage}
                />
              </div>
            </div>
          </div>

            {/* Trust Badges - Below the two-column layout */}
            <div className="mt-12 mb-12">
              <ProductTrustBadges />
            </div>

            {/* FAQ Section - Below trust badges */}
            <div>
              <ProductFAQ productType="warped" />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .warped-swiper .swiper-button-prev,
        .warped-swiper .swiper-button-next,
        .warped-swiper-mobile .swiper-button-prev,
        .warped-swiper-mobile .swiper-button-next {
          color: #333;
        }

        .warped-swiper .swiper-button-prev {
          left: 4px;
        }
        .warped-swiper .swiper-button-next {
          right: 4px;
        }

        .warped-swiper .swiper-button-prev:after,
        .warped-swiper .swiper-button-next:after,
        .warped-swiper-mobile .swiper-button-prev:after,
        .warped-swiper-mobile .swiper-button-next:after {
          font-size: 20px;
        }
      `}</style>
    </main>
  )
}