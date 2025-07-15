'use client'

import { useEffect } from 'react'
import { Product } from 'shopify-buy'
import ProductCard from '@/components/ui/ProductCard'
import { useImageCache } from '@/context/ImageCacheContext'

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
  const { preloadProductImages, isProductPreloaded, getCacheStats } = useImageCache()

  // Enhanced preloading: Start immediately when products are available
  useEffect(() => {
    if (!products.length) return

    const preloadAllProducts = async () => {
      console.log('Starting enhanced image preloading for', products.length, 'products')
      
      // Priority 1: Preload images for products currently visible (first few)
      const visibleProducts = products.slice(0, 6) // Assume 6 products visible initially
      const backgroundProducts = products.slice(6)

      console.log('Preloading visible products first:', visibleProducts.length)
      
      // Preload visible products immediately (no delay)
      const visiblePreloadPromises = visibleProducts.map(async (product) => {
        if (!isProductPreloaded(product.id.toString())) {
          return preloadProductImages(product)
        }
      })

      // Start visible products preloading
      await Promise.allSettled(visiblePreloadPromises)
      console.log('Visible products preloaded')

      // Priority 2: Preload remaining products in background
      if (backgroundProducts.length > 0) {
        console.log('Preloading background products:', backgroundProducts.length)
        
        // Small delay before background preloading to ensure visible images are prioritized
        setTimeout(async () => {
          const backgroundPreloadPromises = backgroundProducts.map(async (product) => {
            if (!isProductPreloaded(product.id.toString())) {
              return preloadProductImages(product)
            }
          })

          await Promise.allSettled(backgroundPreloadPromises)
          console.log('All products preloaded. Cache stats:', getCacheStats())
        }, 500) // 500ms delay for background products
      }
    }

    // Start preloading immediately when products are available
    preloadAllProducts()
  }, [products, preloadProductImages, isProductPreloaded, getCacheStats])
  
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