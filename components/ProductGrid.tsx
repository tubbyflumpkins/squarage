'use client'

import { useEffect, useState } from 'react'
import { Product } from 'shopify-buy'
import ProductCard from '@/components/ui/ProductCard'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export default function ProductGrid({ 
  products, 
  loading = false, 
  emptyMessage = "No products found.",
  className = ""
}: ProductGridProps) {
  const [gridImagesLoaded, setGridImagesLoaded] = useState(false)
  const [variantImagesPreloaded, setVariantImagesPreloaded] = useState(false)

  // Preload all variant images after grid images are loaded
  useEffect(() => {
    if (!products.length || gridImagesLoaded || variantImagesPreloaded) return

    const preloadAllVariantImages = async () => {
      console.log('Starting background preload of variant images...')
      
      // Collect all variant images from all products
      const allVariantImages: string[] = []
      
      products.forEach((product) => {
        if (product.variants && product.images) {
          product.variants.forEach((variant: any) => {
            // Get variant-specific images
            if (variant.image?.src) {
              allVariantImages.push(variant.image.src)
            }
            
            // Also get all product images for each variant
            product.images.forEach((image: any) => {
              if (image.src && !allVariantImages.includes(image.src)) {
                allVariantImages.push(image.src)
              }
            })
          })
        }
      })

      // Remove duplicates and start preloading
      const uniqueImages = [...new Set(allVariantImages)]
      console.log(`Preloading ${uniqueImages.length} variant images...`)

      const imagePromises = uniqueImages.map((imageSrc, index) => {
        return new Promise((resolve) => {
          // Add small delay between requests to avoid overwhelming the server
          setTimeout(() => {
            const htmlImg = new window.Image()
            htmlImg.onload = resolve
            htmlImg.onerror = resolve // Don't let failed images block the process
            htmlImg.src = imageSrc
          }, index * 50) // 50ms delay between each image
        })
      })

      try {
        await Promise.all(imagePromises)
        setVariantImagesPreloaded(true)
        console.log('All variant images preloaded successfully!')
      } catch (error) {
        console.error('Some variant images failed to preload:', error)
        setVariantImagesPreloaded(true) // Mark as complete anyway
      }
    }

    // Start preloading after a short delay to let grid images load first
    const timer = setTimeout(() => {
      setGridImagesLoaded(true)
      preloadAllVariantImages()
    }, 2000) // 2 second delay

    return () => clearTimeout(timer)
  }, [products, gridImagesLoaded, variantImagesPreloaded])
  
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-20 gap-y-20">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="w-full h-64 bg-gray-200 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className={`w-full text-center py-16 ${className}`}>
        <p className="text-xl font-neue-haas text-gray-600 mb-8">
          {emptyMessage}
        </p>
        <p className="text-lg font-neue-haas text-gray-500">
          Check back soon for new additions to our collection.
        </p>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-20 gap-y-20">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
          />
        ))}
      </div>
    </div>
  )
}