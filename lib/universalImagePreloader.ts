'use client'

export interface PreloadConfig {
  imageSrc: string
  width?: number
  priority?: 'high' | 'low'
}

interface PreloadResult {
  src: string
  success: boolean
  cached: boolean
}

// Global cache that persists across navigations
declare global {
  interface Window {
    __imageCache: Map<string, HTMLImageElement>
    __imageCacheStats: {
      total: number
      loaded: number
      failed: number
      startTime: number
    }
  }
}

// Initialize global cache if it doesn't exist
if (typeof window !== 'undefined' && !window.__imageCache) {
  window.__imageCache = new Map()
  window.__imageCacheStats = { total: 0, loaded: 0, failed: 0, startTime: Date.now() }
}

// Shopify CDN optimizer
const optimizeShopifyUrl = (src: string, width: number): string => {
  if (!src.includes('cdn.shopify.com')) return src
  
  try {
    const url = new URL(src)
    url.searchParams.set('width', width.toString())
    url.searchParams.set('format', 'webp')
    url.searchParams.set('quality', '85')
    return url.toString()
  } catch {
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}width=${width}&format=webp&quality=85`
  }
}

// Single, simple preload function
export const preloadImage = async (config: PreloadConfig): Promise<PreloadResult> => {
  const { imageSrc, width = 600 } = config
  
  // Check if already cached
  const cacheKey = `${imageSrc}_${width}`
  if (window.__imageCache.has(cacheKey)) {
    const cached = window.__imageCache.get(cacheKey)!
    if (cached.complete && cached.naturalWidth > 0) {
      return { src: imageSrc, success: true, cached: true }
    }
  }
  
  return new Promise((resolve) => {
    const img = new Image()
    const isMobile = window.innerWidth < 768
    const targetWidth = isMobile ? Math.min(width, 400) : width
    
    // Optimize URL if it's from Shopify
    const optimizedSrc = optimizeShopifyUrl(imageSrc, targetWidth)
    
    img.onload = () => {
      window.__imageCache.set(cacheKey, img)
      window.__imageCacheStats.loaded++
      
      // Force decode on mobile for better caching
      if (isMobile && img.decode) {
        img.decode().catch(() => {})
      }
      
      resolve({ src: imageSrc, success: true, cached: false })
    }
    
    img.onerror = () => {
      window.__imageCacheStats.failed++
      resolve({ src: imageSrc, success: false, cached: false })
    }
    
    // Set crossOrigin for Shopify images
    if (imageSrc.includes('cdn.shopify.com')) {
      img.crossOrigin = 'anonymous'
    }
    
    img.src = optimizedSrc
    window.__imageCacheStats.total++
  })
}

// Batch preload with concurrency control
export const preloadImages = async (
  configs: PreloadConfig[],
  maxConcurrent: number = 6
): Promise<PreloadResult[]> => {
  const results: PreloadResult[] = []
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const batchSize = isMobile ? 3 : maxConcurrent // Fewer concurrent on mobile
  
  console.log(`🚀 Preloading ${configs.length} images (${isMobile ? 'mobile' : 'desktop'})...`)
  const startTime = performance.now()
  
  // Process in batches
  for (let i = 0; i < configs.length; i += batchSize) {
    const batch = configs.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(preloadImage))
    results.push(...batchResults)
    
    // Small delay between batches on mobile to prevent overwhelming
    if (isMobile && i + batchSize < configs.length) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  const endTime = performance.now()
  const cached = results.filter(r => r.cached).length
  const loaded = results.filter(r => r.success && !r.cached).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`✅ Preloading complete in ${(endTime - startTime).toFixed(0)}ms`)
  console.log(`   ⚡ Cached: ${cached}, 📥 Loaded: ${loaded}, ❌ Failed: ${failed}`)
  
  return results
}

// Page-specific preloaders
export const preloadForHomepage = async () => {
  const images: PreloadConfig[] = [
    // Hero slideshow images
    { imageSrc: '/images/hero-1.jpg', width: 1200, priority: 'high' },
    { imageSrc: '/images/hero-2.jpg', width: 1200, priority: 'high' },
    { imageSrc: '/images/hero-3.jpg', width: 1200, priority: 'high' },
    { imageSrc: '/images/hero-4.jpg', width: 1200, priority: 'high' },
    { imageSrc: '/images/hero-5.jpg', width: 1200, priority: 'high' },
    
    // Collection preview images
    { imageSrc: '/images/collection-tiled.jpg', width: 800 },
    { imageSrc: '/images/collection-warped.jpg', width: 800 },
    { imageSrc: '/images/collection-chairs.jpg', width: 800 },
    { imageSrc: '/images/collection-objects.jpg', width: 800 },
    
    // About section
    { imageSrc: '/images/about-studio.jpg', width: 600 },
  ]
  
  return preloadImages(images)
}

export const preloadForCollection = async (collectionHandle: string, products: any[]) => {
  const images: PreloadConfig[] = []
  
  // Add collection hero image
  images.push({ 
    imageSrc: `/images/collection-${collectionHandle}.jpg`, 
    width: 1200,
    priority: 'high'
  })
  
  // Add all product images and their variants
  products.forEach(product => {
    // For each product, add all images (all color variants)
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((image: any) => {
        if (image.src) {
          images.push({
            imageSrc: image.src,
            width: 600
          })
        }
      })
    }
    
    // Also add variant images if they exist
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant: any) => {
        if (variant.image?.src && !images.some(img => img.imageSrc === variant.image.src)) {
          images.push({
            imageSrc: variant.image.src,
            width: 600
          })
        }
      })
    }
  })
  
  console.log(`📦 Preloading ${images.length} images for ${collectionHandle} collection...`)
  return preloadImages(images)
}

export const preloadForProductPage = async (product: any) => {
  const images: PreloadConfig[] = []
  
  // Add all product images with high priority
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((image: any, index: number) => {
      if (image.src) {
        images.push({
          imageSrc: image.src,
          width: 800,
          priority: index < 5 ? 'high' : 'low'
        })
      }
    })
  }
  
  console.log(`📦 Preloading ${images.length} images for ${product.title}...`)
  return preloadImages(images)
}

// Utility to check if image is cached
export const isImageCached = (src: string, width: number = 600): boolean => {
  if (typeof window === 'undefined') return false
  
  const cacheKey = `${src}_${width}`
  const cached = window.__imageCache.get(cacheKey)
  return cached ? cached.complete && cached.naturalWidth > 0 : false
}

// Get cache statistics
export const getCacheStats = () => {
  if (typeof window === 'undefined') return null
  
  return {
    cacheSize: window.__imageCache.size,
    stats: window.__imageCacheStats,
    uptime: Date.now() - window.__imageCacheStats.startTime
  }
}

// Clear cache (useful for debugging)
export const clearImageCache = () => {
  if (typeof window === 'undefined') return
  
  window.__imageCache.clear()
  window.__imageCacheStats = { total: 0, loaded: 0, failed: 0, startTime: Date.now() }
  console.log('🗑️ Image cache cleared')
}