'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { preloadImages, isImageCached, prefetchOnTouch } from '@/lib/navigationPreloader'
import FastProductImage from '@/components/FastProductImage'
import ProductFAQ from '@/components/ProductFAQ'
import ShippingEstimator from '@/components/ShippingEstimator'
import StickyAddToCart from '@/components/StickyAddToCart'
import ProductDetailsAccordion from '@/components/ProductDetailsAccordion'
import ProductTrustBadges from '@/components/ProductTrustBadges'
import { CreditCardIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

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
  collections?: Array<{
    handle: string
    title: string
  }>
}

interface ProductPageProps {
  product: SerializedProduct
}

export default function ProductPage({ product }: ProductPageProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [imagesPreloaded, setImagesPreloaded] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showStickyCart, setShowStickyCart] = useState(false)
  const addToCartRef = useRef<HTMLDivElement>(null)
  
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
  const unsortedColorOptions = useMemo(() => {
    // Check if product has separate color option
    const colorOption = product.options?.find(opt => opt.name === 'Color')
    
    if (colorOption) {
      // Product has explicit color options, use those
      return colorOption.values.map((color: string) => {
        // Find a variant with this color (preferably without size or with first size)
        const variant = product.variants?.find(v => 
          v.selectedOptions?.some(opt => opt.name === 'Color' && opt.value === color)
        )
        const variantIndex = variant ? product.variants?.indexOf(variant) : -1
        
        return {
          name: color,
          originalIndex: variantIndex >= 0 ? variantIndex : 0,
          available: true,
          image: variant?.image || null
        }
      })
    } else {
      // No explicit color options, fall back to variant titles (original behavior)
      return product.variants?.map((variant: any, index) => {
        let variantImage = variant.image
        
        if (!variantImage) {
          variantImage = product.images?.find((img: any) => 
            img.altText?.toLowerCase().includes(variant.title.toLowerCase())
          )
        }
        
        if (!variantImage) {
          variantImage = product.images?.find((img: any) => 
            img.src?.toLowerCase().includes(variant.title.toLowerCase())
          )
        }
        
        return {
          name: variant.title,
          originalIndex: index,
          available: true,
          image: variantImage
        }
      }) || []
    }
  }, [product.variants, product.options, product.images])

  // Sort colors in the specified order
  const colorOptions = useMemo(() => {
    const colorOrder = ['Blue', 'Green', 'Yellow', 'Orange', 'Red', 'Black', 'White']
    return [...unsortedColorOptions].sort((a, b) => {
      const aIndex = colorOrder.indexOf(a.name)
      const bIndex = colorOrder.indexOf(b.name)
      
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      
      return aIndex - bIndex
    })
  }, [unsortedColorOptions])

  // Check if product has size options
  const sizeOption = product.options?.find(opt => opt.name.toLowerCase() === 'size')
  const availableSizes = sizeOption?.values || []

  // Filter out dimensions images from product images
  const filteredProductImages = useMemo(() => {
    return product.images?.filter(img => {
      const fileName = img.src.toLowerCase()
      const altText = img.altText?.toLowerCase() || ''
      return !fileName.includes('dimensions') && !altText.includes('dimensions')
    }) || []
  }, [product.images])

  // Find dimensions image (if exists)
  const dimensionsImage = useMemo(() => {
    return product.images?.find(img => {
      const fileName = img.src.toLowerCase()
      const altText = img.altText?.toLowerCase() || ''
      return fileName.includes('dimensions') || altText.includes('dimensions')
    }) || null
  }, [product.images])

  // Group images by color - each color typically has one image for Tiled collection
  const imagesByColor = useMemo(() => {
    const grouped: Record<string, Array<typeof product.images[0]>> = {}

    colorOptions.forEach(option => {
      grouped[option.name] = []
      if (option.image) {
        // Find the actual image object from filteredProductImages (not all product.images)
        const actualImage = filteredProductImages?.find(img =>
          img.id === option.image.id || img.src === option.image.src
        )
        if (actualImage) {
          grouped[option.name].push(actualImage)
        }
      }
    })

    // Fallback: if a color has no images, use the first filtered product image
    const fallbackImage = filteredProductImages?.[0]
    Object.keys(grouped).forEach(color => {
      if (grouped[color].length === 0 && fallbackImage) {
        grouped[color].push(fallbackImage)
      }
    })

    return grouped
  }, [filteredProductImages, colorOptions])

  // Find the default variant index that corresponds to the first image
  const getDefaultVariantIndex = useCallback(() => {
    if (!filteredProductImages || filteredProductImages.length === 0 || colorOptions.length === 0) {
      return 0
    }

    const firstImage = filteredProductImages[0]
    const defaultColorOption = colorOptions.find((colorOption) => {
      return colorOption.image?.id === firstImage.id
    })

    return defaultColorOption?.originalIndex ?? 0
  }, [filteredProductImages, colorOptions])

  // Get current variant images based on selected color and size
  const currentVariantImages = useMemo(() => {
    // If we have both color and size selected, try to find the specific variant's image
    if (selectedColor && selectedSize && availableSizes.length > 0) {
      const matchingVariant = product.variants?.find(v => 
        v.selectedOptions?.some(opt => opt.name === 'Color' && opt.value === selectedColor) &&
        v.selectedOptions?.some(opt => opt.name === 'Size' && opt.value === selectedSize)
      )
      
      // If the matching variant has an image, use it
      if (matchingVariant?.image) {
        console.log(`Found size-specific image for ${selectedColor} - ${selectedSize}`)
        return [matchingVariant.image]
      }
    }
    
    // Fall back to color-based images if no size-specific image
    if (!selectedColor || !imagesByColor[selectedColor]) {
      return filteredProductImages || []
    }
    console.log(`Using color-based image for ${selectedColor}`)
    return imagesByColor[selectedColor]
  }, [selectedColor, selectedSize, imagesByColor, filteredProductImages, product.variants, availableSizes])

  // Handle color selection
  const handleColorSelect = (colorOptionIndex: number) => {
    const colorOption = colorOptions[colorOptionIndex]
    const colorName = colorOption?.name || `variant-${colorOptionIndex}`
    
    setSelectedColor(colorName)
    
    // If there are sizes, find the variant that matches both color and size
    if (availableSizes.length > 0 && selectedSize) {
      const matchingVariant = product.variants?.findIndex(v => 
        v.selectedOptions?.some(opt => opt.name === 'Color' && opt.value === colorName) &&
        v.selectedOptions?.some(opt => opt.name === 'Size' && opt.value === selectedSize)
      )
      if (matchingVariant !== undefined && matchingVariant >= 0) {
        setSelectedVariantIndex(matchingVariant)
      }
    } else {
      // No sizes, just use the color variant
      const originalVariantIndex = colorOption?.originalIndex || 0
      setSelectedVariantIndex(originalVariantIndex)
    }
  }

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    
    // Find the variant that matches both color and size
    if (selectedColor) {
      const matchingVariant = product.variants?.findIndex(v => 
        v.selectedOptions?.some(opt => opt.name === 'Color' && opt.value === selectedColor) &&
        v.selectedOptions?.some(opt => opt.name === 'Size' && opt.value === size)
      )
      if (matchingVariant !== undefined && matchingVariant >= 0) {
        setSelectedVariantIndex(matchingVariant)
      }
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

  // Get actual color for buttons
  const getSwatchColor = (colorName: string): string => {
    const colorMapping: { [key: string]: string } = {
      'Black': '#000000',
      'Blue': '#01BAD5',
      'Green': '#4A9B4E',
      'Orange': '#F7901E',
      'Red': '#F04E23',
      'White': '#FFFFFF',
      'Yellow': '#F5B74C',
      'Pink': '#F2BAC9',
      'Dark Blue': '#2274A5',
    }
    
    return colorMapping[colorName] || '#F5B74C'
  }

  // Get selection styles for color buttons
  const getColorSelectionStyles = (colorName: string, isSelected: boolean): string => {
    if (!isSelected) {
      return 'border-gray-300 hover:border-gray-400'
    }
    
    // Use green for black and white, otherwise use the color itself
    if (colorName === 'Black' || colorName === 'White') {
      return 'border-squarage-green bg-green-50'
    }
    
    const colorStyles: { [key: string]: string } = {
      'Blue': 'border-[#01BAD5] bg-blue-50',
      'Green': 'border-[#4A9B4E] bg-green-50',
      'Orange': 'border-[#F7901E] bg-orange-50',
      'Red': 'border-[#F04E23] bg-red-50',
      'Yellow': 'border-[#F5B74C] bg-yellow-50',
      'Pink': 'border-[#F2BAC9] bg-pink-50',
      'Dark Blue': 'border-[#2274A5] bg-blue-100',
    }
    
    return colorStyles[colorName] || 'border-squarage-green bg-green-50'
  }

  // Handle scroll for sticky cart
  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect()
        setShowStickyCart(rect.bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Set the correct default variant index on component mount
  useEffect(() => {
    const defaultIndex = getDefaultVariantIndex()
    setSelectedVariantIndex(defaultIndex)
    
    const defaultColorOption = colorOptions.find(opt => opt.originalIndex === defaultIndex)
    if (defaultColorOption) {
      setSelectedColor(defaultColorOption.name)
    }
    
    // If there are size options, set the first size as default
    if (availableSizes.length > 0) {
      setSelectedSize(availableSizes[0])
      
      // Find the variant that matches both color and size
      if (defaultColorOption) {
        const matchingVariant = product.variants?.findIndex(v => 
          v.selectedOptions?.some(opt => opt.name === 'Color' && opt.value === defaultColorOption.name) &&
          v.selectedOptions?.some(opt => opt.name === 'Size' && opt.value === availableSizes[0])
        )
        if (matchingVariant !== undefined && matchingVariant >= 0) {
          setSelectedVariantIndex(matchingVariant)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  // Preload all color variant images for instant switching
  useEffect(() => {
    if (!filteredProductImages || filteredProductImages.length === 0) return

    const preloadAllVariants = async () => {
      const uncachedImages = filteredProductImages
        .map(img => img.src)
        .filter(src => !isImageCached(src))

      if (uncachedImages.length === 0) {
        setImagesPreloaded(true)
        return
      }

      const results = await preloadImages(uncachedImages, {
        priority: 'high',
        maxConcurrent: window.innerWidth < 768 ? 2 : 4
      })

      setImagesPreloaded(true)
    }

    preloadAllVariants()
  }, [filteredProductImages])

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

  // Get collection info
  const collection = product.collections?.[0] || { handle: 'tiled', title: 'Tiled Collection' }

  return (
    <main className="min-h-screen bg-cream">
      {/* Sticky Add to Cart Bar */}
      <StickyAddToCart
        product={{
          ...product,
          images: currentVariantImages.length > 0 ? currentVariantImages : product.images
        }}
        selectedVariant={selectedVariant}
        onAddToCart={handleAddToCart}
        variantLabel="Color"
        isVisible={showStickyCart}
      />

      {/* Product Content */}
      <div className="pt-24 md:pt-32 pb-24">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:gap-12">
            
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

              {/* Main Image - Shows only current variant image */}
              <div className="relative w-full mb-4">
                {currentVariantImages && currentVariantImages.length > 0 ? (
                  <FastProductImage
                    src={currentVariantImages[0].src}
                    alt={currentVariantImages[0].altText || product.title}
                    width={600}
                    height={600}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400 font-neue-haas text-lg">No Image Available</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images - Only show if multiple images for this variant */}
              {currentVariantImages && currentVariantImages.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {currentVariantImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {}}
                      className="flex-shrink-0 w-16 h-16 border-2 transition-all border-gray-200"
                    >
                      <Image
                        src={image.src}
                        alt={image.altText || `View ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

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

              {/* Color Variant Selector */}
              <div className="mb-6">
                <h3 className="text-lg font-medium font-neue-haas text-squarage-black mb-3">
                  Select Color
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(index)}
                      className={`px-4 py-3 border-2 font-medium font-neue-haas text-sm transition-all ${getColorSelectionStyles(option.name, selectedColor === option.name)}`}
                    >
                      <div className="flex items-center gap-2">
                        <Image 
                          src={`/images/colors/${option.name.toLowerCase()}.png`}
                          alt={option.name}
                          width={32}
                          height={32}
                          className="flex-shrink-0"
                          style={{ 
                            width: '32px', 
                            height: '32px',
                            margin: '-8px'
                          }}
                        />
                        <span className="ml-2">{option.name}</span>
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
                        onClick={() => handleSizeSelect(size)}
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
                  productType="tiled"
                  metafields={product.metafields}
                  dimensionsImage={dimensionsImage}
                />
              </div>

              {/* Trust Badges */}
              <div className="mb-8">
                <ProductTrustBadges />
              </div>

              {/* FAQ Section */}
              <div className="mb-8">
                <ProductFAQ productType="tiled" />
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block w-full px-6">
              <div className="flex flex-row">
              {/* Image Gallery - Left */}
              <div className="w-1/2 pr-8">
                <div className="sticky top-32">
                  {/* Main Image - Shows only current variant image */}
                  <div className="relative mb-4">
                    {currentVariantImages && currentVariantImages.length > 0 ? (
                      <FastProductImage
                        src={currentVariantImages[0].src}
                        alt={currentVariantImages[0].altText || product.title}
                        width={600}
                        height={600}
                        className="w-full h-auto object-contain"
                      />
                    ) : (
                      <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 font-neue-haas text-lg">No Image Available</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Images - Only show if multiple images for this variant */}
                  {currentVariantImages && currentVariantImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {currentVariantImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => {}}
                          className="flex-shrink-0 w-20 h-20 border-2 transition-all border-gray-200 hover:border-gray-400"
                        >
                          <Image
                            src={image.src}
                            alt={image.altText || `View ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details - Right */}
              <div className="w-1/2 pl-8">
                {/* Title and Collection */}
                <div className="mb-8">
                  <h1 className="text-5xl font-bold font-neue-haas text-squarage-black mb-2">
                    {product.title}
                  </h1>
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

                {/* Color Variant Selector */}
                <div className="mb-8">
                  <h3 className="text-xl font-medium font-neue-haas text-squarage-black mb-4">
                    Select Color
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {colorOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleColorSelect(index)}
                        className={`px-4 py-3 border-2 font-medium font-neue-haas transition-all ${getColorSelectionStyles(option.name, selectedColor === option.name)}`}
                      >
                        <div className="flex items-center gap-2">
                          <Image 
                            src={`/images/colors/${option.name.toLowerCase()}.png`}
                            alt={option.name}
                            width={40}
                            height={40}
                            className="flex-shrink-0"
                            style={{ 
                              width: '40px', 
                              height: '40px',
                              margin: '-10px'
                            }}
                          />
                          <span className="ml-2">{option.name}</span>
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
                          onClick={() => handleSizeSelect(size)}
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
                    productType="tiled"
                    metafields={product.metafields}
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
                <ProductFAQ productType="tiled" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}