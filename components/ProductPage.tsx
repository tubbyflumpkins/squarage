'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useImageCache } from '@/context/ImageCacheContext'
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
  
  // Use global image cache
  const { preloadProductImages, isProductPreloaded, isImageCached } = useImageCache()

  // Get the selected variant
  const selectedVariant = product.variants?.[selectedVariantIndex]
  
  // Format price
  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(price))
  }

  // Get color options from variants (all available since made to order)
  const colorOptions = product.variants?.map((variant: any, index) => {
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
      index,
      available: true, // Always available since made to order
      image: variantImage
    }
  }) || []

  // Handle color selection with cache-aware switching and performance tracking
  const handleColorSelect = (variantIndex: number) => {
    const startTime = Date.now()
    setSelectedVariantIndex(variantIndex)
    
    // Find image for this color variant and update main image
    const variantImage = colorOptions[variantIndex]?.image
    
    if (variantImage) {
      const imageIndex = product.images?.findIndex((img: any) => img.id === variantImage.id)
      if (imageIndex !== -1) {
        const targetImageSrc = product.images[imageIndex]?.src
        
        // Performance tracking and user feedback
        if (targetImageSrc && isImageCached(targetImageSrc)) {
          const switchTime = Date.now() - startTime
          console.log(`⚡ Instant color switch in ${switchTime}ms (cached)`)
          
          // Optional: Show success indicator in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`🎯 Cache hit for ${colorOptions[variantIndex]?.name} variant`)
          }
        } else {
          console.log(`⏳ Loading ${colorOptions[variantIndex]?.name} variant (not cached)`)
          
          // Track how long it takes to load from network
          if (targetImageSrc) {
            const img = new window.Image()
            img.onload = () => {
              const loadTime = Date.now() - startTime
              console.log(`📡 Network load completed in ${loadTime}ms for ${colorOptions[variantIndex]?.name}`)
            }
            img.src = targetImageSrc
          }
        }
        
        setSelectedImageIndex(imageIndex)
      }
    } else {
      // Fallback: if no specific image found, cycle through images based on variant index
      const fallbackImageIndex = variantIndex % (product.images?.length || 1)
      setSelectedImageIndex(fallbackImageIndex)
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

  // Color mapping for styling dropdown options
  const getColorStyle = (colorName: string): { color: string } => {
    const colorMapping: { [key: string]: string } = {
      'Black': '#333333',        // squarage-black
      'Blue': '#01BAD5',         // squarage-blue
      'Green': '#4A9B4E',        // squarage-green
      'Orange': '#F7901E',       // squarage-orange
      'Red': '#F04E23',          // squarage-red
      'White': '#333333',        // Keep black for visibility on light background
      'Yellow': '#F5B74C',       // squarage-yellow
      'Pink': '#F2BAC9',         // squarage-pink
      'Dark Blue': '#2274A5',    // squarage-dark-blue
    }
    
    return { color: colorMapping[colorName] || '#333333' }
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
      <div className="pt-32 pb-24">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row">
            
            {/* Image Gallery - Top on Mobile, Left on Desktop */}
            <div className="w-full lg:w-1/3 px-6 mb-8 lg:mb-0">
              {/* Main Image */}
              <div className="bg-gray-50 relative">
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
            </div>

            {/* Product Details - Bottom on Mobile, Right on Desktop */}
            <div className="w-full lg:w-2/3 px-6">
              <div className="space-y-0">
              {/* Title */}
              <div className="mb-8">
                <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-neue-haas text-squarage-black mb-4 relative">
                  <span 
                    className="absolute transform translate-x-1 translate-y-1"
                    style={getShadowColorStyle(colorOptions[selectedVariantIndex]?.name || '')}
                  >
                    {product.title}
                  </span>
                  <span className="relative z-10 text-squarage-black">
                    {product.title}
                  </span>
                </h1>
                {product.description && (
                  <p className="text-lg md:text-2xl lg:text-4xl font-neue-haas text-squarage-black leading-relaxed mt-6">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-squarage-black mb-6"></div>

              {/* Color Section */}
              <div className="flex justify-between items-center py-4">
                <span className="text-xl md:text-2xl lg:text-4xl font-neue-haas text-squarage-black font-medium">Color</span>
                <select
                  value={selectedVariantIndex}
                  onChange={(e) => handleColorSelect(parseInt(e.target.value))}
                  className="text-xl md:text-2xl lg:text-4xl font-neue-haas bg-transparent border-none outline-none cursor-pointer font-medium"
                  style={getColorStyle(colorOptions[selectedVariantIndex]?.name || '')}
                >
                  {colorOptions.map((option, index) => (
                    <option 
                      key={index} 
                      value={index}
                      style={getColorStyle(option.name)}
                      className="bg-cream font-neue-haas"
                    >
                      {option.name}
                    </option>
                  ))}
                </select>
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
              <div className="h-px bg-squarage-black mb-8"></div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    // TODO: Implement add to cart functionality
                    console.log('Add to cart:', {
                      productId: product.id,
                      variantId: selectedVariant?.id,
                      title: product.title,
                      color: colorOptions[selectedVariantIndex]?.name
                    })
                  }}
                  disabled={!selectedVariant}
                  className="w-full inline-block bg-squarage-green font-bold font-neue-haas text-4xl py-4 px-8 border-2 border-squarage-green hover:bg-squarage-blue hover:border-squarage-blue hover:scale-105 transition-all duration-300 relative disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-squarage-yellow transform translate-x-0.5 translate-y-0.5">
                    Add to Cart
                  </span>
                  <span className="relative z-10 text-white">
                    Add to Cart
                  </span>
                </button>
                <p className="text-base md:text-lg lg:text-2xl font-neue-haas text-squarage-black text-center opacity-70">
                  Each piece is made to order. Production time: 4-6 weeks.
                </p>
              </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}