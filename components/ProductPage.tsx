'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useImageCache } from '@/context/ImageCacheContext'
import { useCart } from '@/context/CartContext'
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

interface ProductPageProps {
  product: SerializedProduct
}

export default function ProductPage({ product }: ProductPageProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // Use global image cache
  const { preloadProductImages, isProductPreloaded, isImageCached } = useImageCache()
  
  // Use cart context
  const { addToCart } = useCart()

  // Get the selected variant
  const selectedVariant = product.variants?.[selectedVariantIndex]
  
  // Format price
  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price))
  }

  // Get color options from variants (all available since made to order)
  const unsortedColorOptions = product.variants?.map((variant: any, index) => {
    // Primary: Use Shopify's variant image if it exists
    let variantImage = variant.image
    
    // Fallback: Try to find matching image by altText
    if (!variantImage) {
      variantImage = product.images?.find((img: any) => 
        img.altText?.toLowerCase().includes(variant.title.toLowerCase())
      )
    }
    
    // Second fallback: Try to find by filename containing color name
    if (!variantImage) {
      variantImage = product.images?.find((img: any) => 
        img.src?.toLowerCase().includes(variant.title.toLowerCase())
      )
    }
    
    return {
      name: variant.title,
      originalIndex: index, // Store the original variant index
      available: true, // Always available since made to order
      image: variantImage
    }
  }) || []

  // Sort colors in the specified order
  const colorOrder = ['Blue', 'Green', 'Yellow', 'Orange', 'Red', 'Black', 'White']
  const colorOptions = unsortedColorOptions.sort((a, b) => {
    const aIndex = colorOrder.indexOf(a.name)
    const bIndex = colorOrder.indexOf(b.name)
    
    // If color not in order list, put it at the end
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })

  // Find the default variant index that corresponds to the first image (shown in product grid)
  const getDefaultVariantIndex = useCallback(() => {
    if (!product.images || product.images.length === 0 || colorOptions.length === 0) {
      return 0
    }
    
    const firstImage = product.images[0]
    
    // Find which color option has this image
    const defaultColorOption = colorOptions.find((colorOption) => {
      return colorOption.image?.id === firstImage.id
    })
    
    // If found, return the original variant index; otherwise default to 0
    return defaultColorOption?.originalIndex ?? 0
  }, [product.images, colorOptions])

  // Handle color selection with enhanced performance tracking
  const handleColorSelect = (colorOptionIndex: number) => {
    const startTime = performance.now()
    const colorOption = colorOptions[colorOptionIndex]
    const colorName = colorOption?.name || `variant-${colorOptionIndex}`
    const originalVariantIndex = colorOption?.originalIndex || 0
    
    console.log(`🎨 Starting color switch to ${colorName} (original variant index: ${originalVariantIndex})`)
    setSelectedVariantIndex(originalVariantIndex)
    
    // Find image for this color variant and update main image
    const variantImage = colorOption?.image
    
    if (variantImage) {
      const imageIndex = product.images?.findIndex((img: any) => img.id === variantImage.id)
      if (imageIndex !== -1) {
        const targetImageSrc = product.images[imageIndex]?.src
        
        // Enhanced performance tracking
        if (targetImageSrc && isImageCached(targetImageSrc)) {
          const switchTime = performance.now() - startTime
          console.log(`⚡ INSTANT color switch to ${colorName} in ${switchTime.toFixed(2)}ms (cached)`)
          
          // Mark performance entry for tracking
          if (typeof window !== 'undefined' && 'performance' in window) {
            performance.mark(`color-switch-cached-${colorName}`)
          }
        } else {
          console.log(`⏳ Loading ${colorName} variant (not cached - this may cause delay)`)
          
          // Track network loading with enhanced timing
          if (targetImageSrc) {
            const img = new window.Image()
            img.onload = () => {
              const loadTime = performance.now() - startTime
              console.log(`📡 Network load for ${colorName} completed in ${loadTime.toFixed(2)}ms`)
              
              // Mark performance for slow loads
              if (loadTime > 500) {
                console.warn(`🐌 SLOW: ${colorName} took ${loadTime.toFixed(2)}ms to load`)
              }
              
              if (typeof window !== 'undefined' && 'performance' in window) {
                performance.mark(`color-switch-network-${colorName}`)
              }
            }
            img.onerror = () => {
              const errorTime = performance.now() - startTime
              console.error(`❌ Failed to load ${colorName} after ${errorTime.toFixed(2)}ms`)
            }
            img.src = targetImageSrc
          }
        }
        
        setSelectedImageIndex(imageIndex)
      }
    } else {
      // Fallback: if no specific image found, cycle through images based on color option index
      const fallbackImageIndex = colorOptionIndex % (product.images?.length || 1)
      setSelectedImageIndex(fallbackImageIndex)
      console.log(`🔄 Using fallback image index ${fallbackImageIndex} for ${colorName}`)
    }
  }


  // Get metafield value by key
  const getMetafieldValue = (namespace: string, key: string): string => {
    if (!product.metafields || product.metafields.length === 0) {
      return ''
    }
    const metafield = product.metafields?.find(
      (field: any) => field.namespace === namespace && field.key === key
    )
    return metafield?.value || ''
  }

  // Get product size from metafields
  const getSize = (): string => {
    const size = getMetafieldValue('custom', 'size')
    return size || 'Custom sizing available'
  }


  // Color mapping for shadow effects
  const getShadowColorStyle = (colorName: string): { color: string } => {
    const colorMapping: { [key: string]: string } = {
      'Black': '#666666',        // gray for black selection
      'Blue': '#01BAD5',         // squarage-blue
      'Green': '#4A9B4E',        // squarage-green
      'Orange': '#F7901E',       // squarage-orange
      'Red': '#F04E23',          // squarage-red
      'White': '#666666',        // gray for white selection
      'Yellow': '#F5B74C',       // squarage-yellow
      'Pink': '#F2BAC9',         // squarage-pink
      'Dark Blue': '#2274A5',    // squarage-dark-blue
    }
    
    return { color: colorMapping[colorName] || '#F5B74C' }
  }

  // Get actual color for swatches (black/white as their real colors)
  const getSwatchColor = (colorName: string): string => {
    const colorMapping: { [key: string]: string } = {
      'Black': '#000000',        // actual black
      'Blue': '#01BAD5',         // squarage-blue
      'Green': '#4A9B4E',        // squarage-green
      'Orange': '#F7901E',       // squarage-orange
      'Red': '#F04E23',          // squarage-red
      'White': '#FFFFFF',        // actual white
      'Yellow': '#F5B74C',       // squarage-yellow
      'Pink': '#F2BAC9',         // squarage-pink
      'Dark Blue': '#2274A5',    // squarage-dark-blue
    }
    
    return colorMapping[colorName] || '#F5B74C'
  }

  // Color mapping for styling dropdown text
  const getColorStyle = (colorName: string): { color: string } => {
    const colorMapping: { [key: string]: string } = {
      'Black': '#333333',        // squarage-black
      'Blue': '#01BAD5',         // squarage-blue
      'Green': '#4A9B4E',        // squarage-green
      'Orange': '#F7901E',       // squarage-orange
      'Red': '#F04E23',          // squarage-red
      'White': '#333333',        // Keep black for visibility
      'Yellow': '#F5B74C',       // squarage-yellow
      'Pink': '#F2BAC9',         // squarage-pink
      'Dark Blue': '#2274A5',    // squarage-dark-blue
    }
    
    return { color: colorMapping[colorName] || '#333333' }
  }



  // Set the correct default variant index on component mount
  useEffect(() => {
    const defaultIndex = getDefaultVariantIndex()
    setSelectedVariantIndex(defaultIndex)
    
    // Also update the selected image to match the default variant
    const defaultColorOption = colorOptions.find(opt => opt.originalIndex === defaultIndex)
    if (defaultColorOption?.image) {
      const imageIndex = product.images?.findIndex((img: any) => img.id === defaultColorOption.image?.id)
      if (imageIndex !== -1) {
        setSelectedImageIndex(imageIndex)
      }
    }
  }, [product.id, colorOptions, getDefaultVariantIndex, product.images]) // Only run when product changes

  // Use the global image cache for better performance
  useEffect(() => {
    if (!product.images || product.images.length === 0) return

    // Check if product is already preloaded by the global cache
    const productId = product.id.toString()
    
    if (isProductPreloaded(productId)) {
      console.log('Product images already cached, ready for instant switching')
      setImagesPreloaded(true)
      return
    }

    // If not cached, preload now as fallback
    console.log('Product not in cache, preloading now...')
    preloadProductImages(product)
      .then(() => {
        setImagesPreloaded(true)
        console.log('Product images preloaded successfully')
      })
      .catch((error) => {
        console.error('Error preloading product images:', error)
        setImagesPreloaded(true) // Don't block UI
      })
  }, [product, preloadProductImages, isProductPreloaded])

  return (
    <main className="min-h-screen bg-cream">

      {/* Product Content */}
      <div className="pt-24 md:pt-32 pb-24">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row">
            
            {/* Image Gallery - Top on Mobile, Left on Desktop */}
            <div className="w-full lg:w-1/3 px-6 mb-8 lg:mb-0 lg:pr-1">
              <div className="lg:flex lg:gap-4">
                {/* Main Image */}
                <div className="bg-gray-50 relative lg:flex-1">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[selectedImageIndex]?.src || product.images[0].src}
                      alt={product.images[selectedImageIndex]?.altText || product.title}
                      width={600}
                      height={600}
                      className="w-full h-auto object-contain"
                      priority={selectedImageIndex === 0} // Prioritize first image load
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400 font-neue-haas text-lg">No Image Available</span>
                    </div>
                  )}
                </div>

                {/* Color Swatches - Mobile: below image, Desktop: right side vertical */}
                {colorOptions.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center lg:flex-col lg:justify-center lg:mt-0 lg:w-12">
                    {colorOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleColorSelect(index)}
                        className={`w-8 h-8 md:w-6 md:h-6 lg:w-10 lg:h-10 border-2 transition-all duration-200 hover:scale-110 ${
                          selectedVariantIndex === option.originalIndex 
                            ? 'border-squarage-black' 
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: getSwatchColor(option.name) }}
                        aria-label={`Select ${option.name} color`}
                        title={option.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Details - Bottom on Mobile, Right on Desktop */}
            <div className="w-full lg:w-2/3 px-6 lg:pl-1">
              <div className="space-y-0">
              {/* Title */}
              <div className="mb-4 md:mb-8">
                <h1 className="text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-neue-haas text-squarage-black mb-4 text-center md:text-left">
                  {product.title}
                </h1>
                {product.description && (
                  <p className="text-lg md:text-2xl lg:text-4xl font-neue-haas text-squarage-black leading-relaxed mt-6 text-center md:text-left">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-squarage-black mb-6"></div>

              {/* Color Section */}
              <div className="flex justify-between items-center py-4">
                <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Color</span>
                <span 
                  className="text-xl md:text-2xl lg:text-4xl font-neue-haas font-medium"
                  style={getColorStyle(colorOptions.find(opt => opt.originalIndex === selectedVariantIndex)?.name || '')}
                >
                  {colorOptions.find(opt => opt.originalIndex === selectedVariantIndex)?.name || ''}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-squarage-black"></div>

              {/* Category Section */}
              <div className="flex justify-between items-center py-4">
                <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Category</span>
                <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black">Tiled Collection</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-squarage-black"></div>

              {/* Price Section */}
              <div className="flex justify-between items-center py-4">
                <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Price</span>
                {selectedVariant && (
                  <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black">
                    {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-squarage-black"></div>

              {/* Dimensions Section */}
              <div className="flex justify-between items-center py-4">
                <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Dimensions</span>
                <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black">{getSize()}</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-squarage-black mb-12"></div>

              {/* Add to Cart */}
              <div className="pt-8">
                <button
                  onClick={async () => {
                    if (!selectedVariant || isAddingToCart) return
                    
                    setIsAddingToCart(true)
                    try {
                      await addToCart(selectedVariant.id)
                      console.log('Successfully added to cart:', {
                        productId: product.id,
                        variantId: selectedVariant.id,
                        title: product.title,
                        color: colorOptions.find(opt => opt.originalIndex === selectedVariantIndex)?.name
                      })
                    } catch (error) {
                      console.error('Error adding to cart:', error)
                    } finally {
                      setIsAddingToCart(false)
                    }
                  }}
                  disabled={!selectedVariant || isAddingToCart}
                  className="w-full inline-block bg-squarage-green font-bold font-neue-haas text-4xl py-4 px-8 border-2 border-squarage-green hover:bg-squarage-blue hover:border-squarage-blue hover:scale-[1.02] transition-all duration-300 relative disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-squarage-yellow transform translate-x-0.5 translate-y-0.5">
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </span>
                  <span className="relative z-10 text-white">
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </span>
                </button>
              </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}