'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { useCart } from '@/context/CartContext'
import { useImageCache } from '@/context/ImageCacheContext'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'

interface SerializedProduct {
  id: string
  title: string
  handle: string
  description: string
  descriptionHtml: string
  availableForSale: boolean
  createdAt: string
  updatedAt: string
  productType: string
  vendor: string
  tags: string[]
  options: Array<{
    id: string
    name: string
    values: string[]
  }>
  variants: Array<{
    id: string
    title: string
    availableForSale: boolean
    price: {
      amount: string
      currencyCode: string
    }
    compareAtPrice: {
      amount: string
      currencyCode: string
    } | null
    selectedOptions: Array<{
      name: string
      value: string
    }>
    image: {
      id: string
      src: string
      altText: string
    } | null
  }>
  images: Array<{
    id: string
    src: string
    altText: string
    width: number
    height: number
  }>
  metafields?: Array<{
    id: string
    namespace: string
    key: string
    value: string
    type: string
  }>
}

interface WarpedProductPageProps {
  product: SerializedProduct
}

// Color variants for warped collection
const WARPED_COLORS = ['Birch', 'Oak', 'Walnut']

// Shopify image loader for optimized CDN delivery with format conversion
const shopifyLoader = ({ src, width }: { src: string; width: number }) => {
  try {
    const url = new URL(src)
    // Set width for responsive sizing
    url.searchParams.set('width', width.toString())
    // Request WebP format for better compression
    url.searchParams.set('format', 'webp')
    // Set quality for balance of size and visual quality
    url.searchParams.set('quality', '85')
    return url.toString()
  } catch {
    // Fallback for non-URL strings
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}width=${width}&format=webp&quality=85`
  }
}

export default function WarpedProductPage({ product }: WarpedProductPageProps) {
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('Birch')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)
  const [preloadStatus, setPreloadStatus] = useState<Record<string, boolean>>({})
  
  // Use cart context
  const { addToCart } = useCart()
  
  // Use image cache for instant color switching
  const { preloadProductImages, isProductPreloaded, isImageCached, preloadImageBatch } = useImageCache()

  // Group images by color variant
  const imagesByColor = useMemo(() => {
    const grouped: Record<string, Array<typeof product.images[0]>> = {
      'Birch': [],
      'Oak': [],
      'Walnut': []
    }

    product.images.forEach(image => {
      const imageText = (image.altText || image.src || '').toLowerCase()
      
      if (imageText.includes('birch')) {
        grouped['Birch'].push(image)
      } else if (imageText.includes('oak')) {
        grouped['Oak'].push(image)
      } else if (imageText.includes('walnut')) {
        grouped['Walnut'].push(image)
      }
    })

    // Sort images by number
    Object.keys(grouped).forEach(color => {
      grouped[color].sort((a, b) => {
        const aMatch = (a.altText || a.src).match(/_(\d+)/);
        const bMatch = (b.altText || b.src).match(/_(\d+)/);
        const aNum = aMatch ? parseInt(aMatch[1]) : 999;
        const bNum = bMatch ? parseInt(bMatch[1]) : 999;
        return aNum - bNum;
      })
    })

    // Ensure we have exactly 5 images per color
    const fallbackImage = product.images[0]
    WARPED_COLORS.forEach(color => {
      if (grouped[color].length === 0 && fallbackImage) {
        for (let i = 0; i < 5; i++) {
          grouped[color].push(product.images[i] || fallbackImage)
        }
      }
      while (grouped[color].length < 5 && grouped[color].length > 0) {
        grouped[color].push(grouped[color][grouped[color].length - 1])
      }
    })

    return grouped
  }, [product.images])

  // Get the selected variant based on color
  const selectedVariant = useMemo(() => {
    return product.variants.find(variant => 
      variant.title.toLowerCase() === selectedColor.toLowerCase() ||
      variant.selectedOptions?.some(opt => 
        opt.value.toLowerCase() === selectedColor.toLowerCase()
      )
    ) || product.variants[0]
  }, [selectedColor, product.variants])

  // Format price
  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price))
  }

  // Get metafield value
  const getMetafieldValue = (namespace: string, key: string): string => {
    const metafield = product.metafields?.find(
      field => field.namespace === namespace && field.key === key
    )
    return metafield?.value || ''
  }

  const getSize = (): string => {
    const size = getMetafieldValue('custom', 'size')
    return size || 'Custom sizing available'
  }

  // Get color style for UI elements
  const getColorStyle = (colorName: string) => {
    const colorMapping: Record<string, string> = {
      'Birch': '#E8D5B7',
      'Oak': '#B08D57',
      'Walnut': '#5D4E37'
    }
    return { backgroundColor: colorMapping[colorName] || '#999' }
  }

  // Aggressive preloading of ALL images using multiple strategies
  useEffect(() => {
    const preloadAllColorImages = async () => {
      console.log('🎨 Starting aggressive Warped image preload...')
      const startTime = performance.now()
      
      // Strategy 1: Use native browser preloading with link tags
      WARPED_COLORS.forEach(color => {
        const colorImages = imagesByColor[color]
        if (colorImages && colorImages.length > 0) {
          colorImages.forEach((img, index) => {
            // Create link preload tags for first 2 images of each color
            if (index < 2 && img.src) {
              const link = document.createElement('link')
              link.rel = 'preload'
              link.as = 'image'
              link.href = shopifyLoader({ src: img.src, width: 600 })
              link.setAttribute('fetchpriority', color === 'Birch' ? 'high' : 'low')
              document.head.appendChild(link)
            }
          })
        }
      })
      
      // Strategy 2: Use Image constructor for browser caching
      const imagePromises: Promise<void>[] = []
      WARPED_COLORS.forEach(color => {
        const colorImages = imagesByColor[color]
        if (colorImages && colorImages.length > 0) {
          colorImages.forEach(img => {
            if (img.src) {
              const promise = new Promise<void>((resolve) => {
                const image = new window.Image()
                image.onload = () => {
                  console.log(`✅ Loaded: ${color} image`)
                  setPreloadStatus(prev => ({ ...prev, [img.src]: true }))
                  resolve()
                }
                image.onerror = () => {
                  console.error(`❌ Failed: ${color} image`)
                  resolve()
                }
                // Load optimized version from Shopify CDN
                image.src = shopifyLoader({ src: img.src, width: 600 })
              })
              imagePromises.push(promise)
            }
          })
        }
      })
      
      // Strategy 3: Also use the ImageCache system
      const allImages: string[] = []
      WARPED_COLORS.forEach(color => {
        const colorImages = imagesByColor[color]
        if (colorImages && colorImages.length > 0) {
          colorImages.forEach(img => {
            if (img.src && !allImages.includes(img.src)) {
              allImages.push(img.src)
            }
          })
        }
      })
      
      console.log(`📦 Preloading ${allImages.length} images with 3 strategies...`)
      
      // Execute all strategies in parallel
      const [browserResults] = await Promise.all([
        Promise.allSettled(imagePromises),
        preloadImageBatch(allImages)
      ])
      
      const loadTime = performance.now() - startTime
      const successCount = browserResults.filter(r => r.status === 'fulfilled').length
      console.log(`✅ Preloaded ${successCount}/${imagePromises.length} images in ${loadTime.toFixed(2)}ms`)
      
      // Verify cache status
      WARPED_COLORS.forEach(color => {
        const cached = imagesByColor[color].every(img => isImageCached(img.src))
        console.log(`${cached ? '⚡' : '🔄'} ${color}: ${cached ? 'Cached' : 'Loading'}`)
      })
      
      setImagesPreloaded(true)
    }
    
    // Start preloading immediately
    preloadAllColorImages()
  }, [imagesByColor, preloadImageBatch, isImageCached, product])
  
  // Reset active index when color changes
  useEffect(() => {
    setActiveIndex(0)
    if (mainSwiper) {
      mainSwiper.slideTo(0)
    }
  }, [selectedColor, mainSwiper])

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    if (mainSwiper) {
      mainSwiper.slideTo(index)
      setActiveIndex(index)
    }
  }
  
  // Prefetch images on hover for instant switching
  const handleColorHover = useCallback((color: string) => {
    const images = imagesByColor[color]
    if (images && images.length > 0) {
      const imageSrcs = images.map(img => img.src)
      // Only prefetch if not already cached
      const uncachedImages = imageSrcs.filter(src => !isImageCached(src))
      if (uncachedImages.length > 0) {
        console.log(`🔍 Prefetching ${color} images on hover...`)
        preloadImageBatch(uncachedImages)
      }
    }
  }, [imagesByColor, isImageCached, preloadImageBatch])

  return (
    <main className="min-h-screen bg-cream">
      <div className="pt-24 md:pt-32 pb-24 lg:px-6">
        <div className="w-full">
          {/* Mobile Layout */}
            <div className="lg:hidden fixed inset-0 pt-24 flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                {/* Mobile Carousel */}
                <div className="bg-gray-50 relative aspect-square">
                  <Swiper
                    spaceBetween={10}
                    navigation={true}
                    modules={[Navigation]}
                    className="warped-swiper-mobile h-full"
                  >
                    {imagesByColor[selectedColor].map((image, index) => (
                      <SwiperSlide key={`${selectedColor}-${index}`}>
                        <div className="relative w-full h-full">
                          <Image
                            loader={shopifyLoader}
                            src={image.src}
                            alt={image.altText || `${product.title} - ${selectedColor} - View ${index + 1}`}
                            fill
                            className="object-contain"
                            priority={index === 0 && selectedColor === 'Birch'}
                            sizes="100vw"
                            loading={index === 0 && selectedColor === 'Birch' ? 'eager' : 'lazy'}
                            quality={90}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {/* Color Swatches */}
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {WARPED_COLORS.map(color => (
                    <button
                      key={color}
                      onMouseEnter={() => handleColorHover(color)}
                      onClick={() => {
                        const startTime = performance.now()
                        const prevColor = selectedColor
                        setSelectedColor(color)
                        
                        // Track performance
                        const switchTime = performance.now() - startTime
                        const isCached = imagesByColor[color].every(img => isImageCached(img.src))
                        
                        if (isCached) {
                          console.log(`⚡ INSTANT color switch from ${prevColor} to ${color} in ${switchTime.toFixed(2)}ms (cached)`)
                          performance.mark(`warped-color-switch-cached-${color}`)
                        } else {
                          console.log(`📡 Network load for ${color} in ${switchTime.toFixed(2)}ms`)
                          performance.mark(`warped-color-switch-network-${color}`)
                        }
                      }}
                      className={`w-8 h-8 border-2 transition-all duration-200 hover:scale-110 ${
                        selectedColor === color 
                          ? 'border-squarage-black' 
                          : 'border-gray-300'
                      }`}
                      style={getColorStyle(color)}
                      aria-label={`Select ${color} finish`}
                      title={color}
                    />
                  ))}
                </div>

                {/* Product Details */}
                <div className="mt-4">
                  <div className="mb-2">
                    <h1 className="text-4xl font-bold font-neue-haas text-squarage-black mb-2 text-center">
                      {product.title}
                    </h1>
                    {product.description && (
                      <p className="text-base font-neue-haas text-squarage-black leading-relaxed mt-2 text-center">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-squarage-black mb-2"></div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-neue-haas text-squarage-black font-medium">Finish</span>
                    <span className="text-lg font-neue-haas font-medium text-squarage-black">
                      {selectedColor}
                    </span>
                  </div>

                  <div className="h-px bg-squarage-black"></div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-neue-haas text-squarage-black font-medium">Price</span>
                    {selectedVariant && (
                      <span className="text-lg font-neue-haas text-squarage-black">
                        {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
                      </span>
                    )}
                  </div>

                  <div className="h-px bg-squarage-black"></div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-neue-haas text-squarage-black font-medium">Dimensions</span>
                    <span className="text-lg font-neue-haas text-squarage-black">{getSize()}</span>
                  </div>

                  <div className="h-px bg-squarage-black"></div>
                </div>
              </div>

              {/* Fixed Add to Cart Button */}
              <div className="px-6 pb-6 pt-4 bg-cream border-t border-gray-200">
                <button
                  onClick={async () => {
                    if (!selectedVariant || isAddingToCart) return
                    
                    setIsAddingToCart(true)
                    try {
                      await addToCart(selectedVariant.id)
                    } catch (error) {
                      console.error('Error adding to cart:', error)
                    } finally {
                      setIsAddingToCart(false)
                    }
                  }}
                  disabled={!selectedVariant || isAddingToCart}
                  className="w-full bg-squarage-orange font-bold font-neue-haas text-2xl py-3 text-white hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>

            {/* Desktop Layout - Fixed margins, expanding description */}
            <div className="hidden lg:flex flex-row gap-6">
                {/* Image Gallery - Fixed width */}
                <div className="flex flex-col w-[600px] flex-shrink-0">
                  {/* Container for thumbnails and main image */}
                  <div className="flex flex-row gap-6 w-full">
                    {/* Vertical Thumbnails */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {imagesByColor[selectedColor].map((image, index) => (
                        <button
                          key={`thumb-${selectedColor}-${index}`}
                          onClick={() => handleThumbnailClick(index)}
                          className={`w-14 h-14 bg-gray-50 border-2 transition-all flex-shrink-0 ${
                            activeIndex === index
                              ? 'border-squarage-black opacity-100'
                              : 'border-gray-300 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image
                            loader={shopifyLoader}
                            src={image.src}
                            alt={`Thumbnail ${index + 1}`}
                            width={56}
                            height={56}
                            className="w-full h-full object-contain"
                            sizes="56px"
                            loading="eager"
                            quality={75}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Main Image Carousel */}
                    <div className="flex-1 bg-gray-50 relative max-h-[600px] overflow-hidden">
                      <Swiper
                        spaceBetween={10}
                        navigation={true}
                        onSwiper={setMainSwiper}
                        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                        modules={[Navigation]}
                        className="warped-swiper-main h-full"
                      >
                        {imagesByColor[selectedColor].map((image, index) => (
                          <SwiperSlide key={`${selectedColor}-${index}`}>
                            <div className="w-full h-[600px] relative">
                              <Image
                                loader={shopifyLoader}
                                src={image.src}
                                alt={image.altText || `${product.title} - ${selectedColor} - View ${index + 1}`}
                                fill
                                className="object-contain"
                                priority={index === 0 && selectedColor === 'Birch'}
                                sizes="(max-width: 768px) 100vw, 50vw"
                                loading={index === 0 && selectedColor === 'Birch' ? 'eager' : 'lazy'}
                                quality={90}
                              />
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex flex-wrap gap-2 mt-4 justify-center w-full">
                    {WARPED_COLORS.map(color => (
                      <button
                        key={color}
                        onMouseEnter={() => handleColorHover(color)}
                        onClick={() => {
                          const startTime = performance.now()
                          const prevColor = selectedColor
                          setSelectedColor(color)
                          
                          // Track performance
                          const switchTime = performance.now() - startTime
                          const isCached = imagesByColor[color].every(img => isImageCached(img.src))
                          
                          if (isCached) {
                            console.log(`⚡ INSTANT color switch from ${prevColor} to ${color} in ${switchTime.toFixed(2)}ms (cached)`)
                            performance.mark(`warped-color-switch-cached-${color}`)
                          } else {
                            console.log(`📡 Network load for ${color} in ${switchTime.toFixed(2)}ms`)
                            performance.mark(`warped-color-switch-network-${color}`)
                          }
                        }}
                        className={`w-10 h-10 border-2 transition-all duration-200 hover:scale-110 ${
                          selectedColor === color 
                            ? 'border-squarage-black' 
                            : 'border-gray-300'
                        }`}
                        style={getColorStyle(color)}
                        aria-label={`Select ${color} finish`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Product Details - Expandable width */}
                <div className="flex-1">
                  <div className="space-y-0">
                  <div className="mb-8">
                    <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold font-neue-haas text-squarage-black mb-4 text-left">
                      {product.title}
                    </h1>
                    {product.description && (
                      <p className="text-2xl lg:text-4xl font-neue-haas text-squarage-black leading-relaxed mt-6 text-left">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-squarage-black mb-6"></div>

                  <div className="flex justify-between items-center py-4">
                    <span className="text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Finish</span>
                    <span className="text-2xl lg:text-4xl font-neue-haas font-medium text-squarage-black">
                      {selectedColor}
                    </span>
                  </div>

                  <div className="h-px bg-squarage-black"></div>

                  <div className="flex justify-between items-center py-4">
                    <span className="text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Price</span>
                    {selectedVariant && (
                      <span className="text-2xl lg:text-4xl font-neue-haas text-squarage-black">
                        {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
                      </span>
                    )}
                  </div>

                  <div className="h-px bg-squarage-black"></div>

                  <div className="flex justify-between items-center py-4">
                    <span className="text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Dimensions</span>
                    <span className="text-2xl lg:text-4xl font-neue-haas text-squarage-black">{getSize()}</span>
                  </div>

                  <div className="h-px bg-squarage-black mb-12"></div>

                  <div className="pt-8">
                    <button
                      onClick={async () => {
                        if (!selectedVariant || isAddingToCart) return
                        
                        setIsAddingToCart(true)
                        try {
                          await addToCart(selectedVariant.id)
                        } catch (error) {
                          console.error('Error adding to cart:', error)
                        } finally {
                          setIsAddingToCart(false)
                        }
                      }}
                      disabled={!selectedVariant || isAddingToCart}
                      className="w-full bg-squarage-orange font-bold font-neue-haas text-4xl py-4 px-8 text-white hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .warped-swiper-main {
          width: 100%;
          height: auto;
        }
        
        .warped-swiper-main .swiper-slide {
          background: #f9fafb;
        }
        
        .warped-swiper-main .swiper-button-next,
        .warped-swiper-main .swiper-button-prev {
          color: #333;
          background: rgba(255, 255, 255, 0.9);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .warped-swiper-main .swiper-button-next:after,
        .warped-swiper-main .swiper-button-prev:after {
          font-size: 16px;
          font-weight: 600;
        }
        
        .warped-swiper-main .swiper-button-next:hover,
        .warped-swiper-main .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 1);
        }
        
        .warped-swiper-mobile .swiper-button-next,
        .warped-swiper-mobile .swiper-button-prev {
          color: #333;
          width: 30px;
          height: 30px;
        }
        
        .warped-swiper-mobile .swiper-button-next:after,
        .warped-swiper-mobile .swiper-button-prev:after {
          font-size: 20px;
        }
      `}</style>
    </main>
  )
}