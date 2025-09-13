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
  collections?: Array<{
    handle: string
    title: string
  }>
}

interface WarpedProductPageProps {
  product: SerializedProduct
}

// Wood finish variants for warped collection
const WARPED_FINISHES = ['Birch', 'Oak', 'Walnut']

export default function WarpedProductPage({ product }: WarpedProductPageProps) {
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null)
  const [selectedFinish, setSelectedFinish] = useState<string>('Birch')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showStickyCart, setShowStickyCart] = useState(false)
  const addToCartRef = useRef<HTMLDivElement>(null)
  
  // Use cart context
  const { addToCart } = useCart()

  // Group images by finish variant
  const imagesByFinish = useMemo(() => {
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
    Object.keys(grouped).forEach(finish => {
      grouped[finish].sort((a, b) => {
        const aMatch = (a.altText || a.src).match(/_(\d+)/);
        const bMatch = (b.altText || b.src).match(/_(\d+)/);
        const aNum = aMatch ? parseInt(aMatch[1]) : 999;
        const bNum = bMatch ? parseInt(bMatch[1]) : 999;
        return aNum - bNum;
      })
    })

    // Ensure we have exactly 5 images per finish
    const fallbackImage = product.images[0]
    WARPED_FINISHES.forEach(finish => {
      if (grouped[finish].length === 0 && fallbackImage) {
        for (let i = 0; i < 5; i++) {
          grouped[finish].push(product.images[i] || fallbackImage)
        }
      }
      while (grouped[finish].length < 5 && grouped[finish].length > 0) {
        grouped[finish].push(grouped[finish][grouped[finish].length - 1])
      }
    })

    return grouped
  }, [product])

  // Get the selected variant based on finish
  const selectedVariant = useMemo(() => {
    return product.variants.find(variant => 
      variant.title.toLowerCase() === selectedFinish.toLowerCase() ||
      variant.selectedOptions?.some(opt => 
        opt.value.toLowerCase() === selectedFinish.toLowerCase()
      )
    ) || product.variants[0]
  }, [selectedFinish, product.variants])

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

  // Get color style for finish buttons
  const getFinishColor = (finishName: string) => {
    const colorMapping: Record<string, string> = {
      'Birch': '#E8D5B7',
      'Oak': '#B08D57',
      'Walnut': '#5D4E37'
    }
    return colorMapping[finishName] || '#999'
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
  
  // Reset active index when finish changes
  useEffect(() => {
    setActiveIndex(0)
    if (mainSwiper) {
      mainSwiper.slideTo(0)
    }
  }, [selectedFinish, mainSwiper])

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
              aspectRatio: imagesByFinish[selectedFinish][0] ? 
                `${imagesByFinish[selectedFinish][0].width} / ${imagesByFinish[selectedFinish][0].height}` : 
                '1 / 1' 
            }}>
              <Swiper
                spaceBetween={0}
                navigation={true}
                modules={[Navigation]}
                className="warped-swiper-mobile h-full"
              >
                {imagesByFinish[selectedFinish].map((image, index) => (
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
                        className="w-4 h-4 border border-gray-300 rounded-full"
                        style={{ backgroundColor: getFinishColor(finish) }}
                      />
                      <span>{finish}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
          <div className="hidden lg:block px-6">
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
                    {imagesByFinish[selectedFinish].map((image, index) => (
                      <SwiperSlide key={index}>
                        <div className="relative w-full h-[600px] flex items-center justify-center bg-cream">
                          <FastProductImage
                            src={image.src}
                            alt={image.altText || `${product.title} - ${selectedFinish} - View ${index + 1}`}
                            width={600}
                            height={600}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {/* Thumbnail Navigation */}
                <div className="flex gap-2 justify-center">
                  {imagesByFinish[selectedFinish].map((image, index) => (
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
                          className="w-5 h-5 border border-gray-300 rounded-full"
                          style={{ backgroundColor: getFinishColor(finish) }}
                        />
                        <span>{finish}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

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