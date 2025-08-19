'use client'

import { useEffect } from 'react'
import { preloadImage } from '@/lib/simplePreloader'

interface MobileCollectionPreloaderProps {
  products: any[]
}

export default function MobileCollectionPreloader({ products }: MobileCollectionPreloaderProps) {
  useEffect(() => {
    // Only run on mobile
    if (typeof window === 'undefined' || window.innerWidth >= 768) {
      console.log('📱 Skipping mobile preloader (desktop detected)')
      return
    }
    
    // Don't run if no products
    if (!products || products.length === 0) {
      console.log('📱 No products to preload yet')
      return
    }
    
    console.log(`📱 Mobile Collection Preloader: Starting for ${products.length} products`)
    
    const preloadProductImages = async () => {
      const startTime = performance.now()
      const imageUrls: string[] = []
      
      // Collect all product images (first image only for grid view)
      products.forEach(product => {
        // Main images
        if (product.images && product.images.length > 0) {
          const firstImageUrl = product.images[0].src
          if (!imageUrls.includes(firstImageUrl)) {
            imageUrls.push(firstImageUrl)
          }
        }
        
        // Also check variant images if they're different
        if (product.variants && product.variants[0]?.image?.src) {
          const variantImageUrl = product.variants[0].image.src
          if (!imageUrls.includes(variantImageUrl)) {
            imageUrls.push(variantImageUrl)
          }
        }
      })
      
      // Check what's already cached
      const uncachedImages = imageUrls.filter(url => !window.__simpleImageCache?.has(url))
      
      if (uncachedImages.length === 0) {
        console.log('📱 All collection images already cached!')
        return
      }
      
      console.log(`📱 Preloading ${uncachedImages.length} uncached images (${imageUrls.length - uncachedImages.length} already cached)`)
      
      // Preload images in parallel (2 at a time for mobile)
      const batchSize = 2
      for (let i = 0; i < uncachedImages.length; i += batchSize) {
        const batch = uncachedImages.slice(i, i + batchSize)
        await Promise.all(batch.map(url => preloadImage(url)))
      }
      
      const loadTime = performance.now() - startTime
      console.log(`✅ Mobile collection preload complete in ${loadTime.toFixed(0)}ms`)
    }
    
    // Run immediately - products are already loaded when this component mounts
    preloadProductImages()
  }, [products])
  
  return null
}