'use client'

import { optimizeImageUrl, getDeviceInfo } from './imageOptimizer'
import { ImageMetadata } from './universalImageRegistry'

// Global cache for images
declare global {
  interface Window {
    __imageCache: Map<string, HTMLImageElement>
    __imageCacheMetadata: Map<string, {
      size: number
      loadTime: number
      lastAccessed: number
      status: 'loading' | 'loaded' | 'error'
    }>
  }
}

// Initialize global cache if it doesn't exist
if (typeof window !== 'undefined') {
  if (!window.__imageCache) {
    window.__imageCache = new Map()
  }
  if (!window.__imageCacheMetadata) {
    window.__imageCacheMetadata = new Map()
  }
}

export interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low'
  maxConcurrent?: number
  delay?: number
  onProgress?: (loaded: number, total: number) => void
  onComplete?: () => void
}

export interface PreloadResult {
  src: string
  success: boolean
  cached: boolean
  loadTime: number
}

// Check if image is already cached
export function isImageCached(src: string): boolean {
  if (typeof window === 'undefined') return false
  
  const cached = window.__imageCache.get(src)
  const metadata = window.__imageCacheMetadata.get(src)
  
  return !!(cached && cached.complete && cached.naturalWidth > 0 && metadata?.status === 'loaded')
}

// Preload a single image
export async function preloadImage(
  src: string,
  options: PreloadOptions = {}
): Promise<PreloadResult> {
  const startTime = performance.now()
  
  // Check if already cached
  if (isImageCached(src)) {
    // Update last accessed time
    const metadata = window.__imageCacheMetadata.get(src)
    if (metadata) {
      metadata.lastAccessed = Date.now()
    }
    
    return {
      src,
      success: true,
      cached: true,
      loadTime: 0
    }
  }
  
  // Check if previously failed - don't retry failed images
  const failedMeta = window.__imageCacheMetadata.get(src)
  if (failedMeta?.status === 'error') {
    return {
      src,
      success: false,
      cached: true,
      loadTime: 0
    }
  }
  
  // Check if currently loading
  const metadata = window.__imageCacheMetadata.get(src)
  if (metadata?.status === 'loading') {
    // Wait for existing load to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const meta = window.__imageCacheMetadata.get(src)
        if (meta?.status !== 'loading') {
          clearInterval(checkInterval)
          resolve({
            src,
            success: meta?.status === 'loaded',
            cached: false,
            loadTime: performance.now() - startTime
          })
        }
      }, 50)
    })
  }
  
  // Start loading
  window.__imageCacheMetadata.set(src, {
    size: 0,
    loadTime: 0,
    lastAccessed: Date.now(),
    status: 'loading'
  })
  
  return new Promise((resolve) => {
    const img = new Image()
    const deviceInfo = getDeviceInfo()
    
    // Optimize URL based on device
    const optimizedSrc = optimizeImageUrl(src, {
      isMobile: deviceInfo.isMobile,
      quality: deviceInfo.saveData ? 70 : undefined
    })
    
    // Set crossOrigin for Shopify images
    if (src.includes('cdn.shopify.com')) {
      img.crossOrigin = 'anonymous'
    }
    
    img.onload = async () => {
      const loadTime = performance.now() - startTime
      
      // Update cache
      window.__imageCache.set(src, img)
      window.__imageCacheMetadata.set(src, {
        size: img.naturalWidth * img.naturalHeight * 4, // Approximate size in bytes
        loadTime,
        lastAccessed: Date.now(),
        status: 'loaded'
      })
      
      // Force decode on mobile for better performance
      if (deviceInfo.isMobile && img.decode) {
        try {
          await img.decode()
        } catch (e) {
          // Ignore decode errors
        }
      }
      
      resolve({
        src,
        success: true,
        cached: false,
        loadTime
      })
    }
    
    img.onerror = () => {
      window.__imageCacheMetadata.set(src, {
        size: 0,
        loadTime: 0,
        lastAccessed: Date.now(),
        status: 'error'
      })
      
      resolve({
        src,
        success: false,
        cached: false,
        loadTime: performance.now() - startTime
      })
    }
    
    img.src = optimizedSrc
  })
}

// Preload multiple images with concurrency control
export async function preloadImages(
  images: (string | ImageMetadata)[],
  options: PreloadOptions = {}
): Promise<PreloadResult[]> {
  const deviceInfo = getDeviceInfo()
  const {
    maxConcurrent = deviceInfo.isMobile ? 2 : 6,
    delay = deviceInfo.isMobile ? 100 : 0,
    onProgress,
    onComplete
  } = options
  
  // Convert to string array
  const imageSrcs = images.map(img => 
    typeof img === 'string' ? img : img.src
  )
  
  // Filter out already cached images
  const uncachedImages = imageSrcs.filter(src => !isImageCached(src))
  
  if (uncachedImages.length === 0) {
    console.log('⚡ All images already cached')
    onComplete?.()
    return imageSrcs.map(src => ({
      src,
      success: true,
      cached: true,
      loadTime: 0
    }))
  }
  
  console.log(`📦 Preloading ${uncachedImages.length} images (${deviceInfo.isMobile ? 'mobile' : 'desktop'})`)
  if (uncachedImages.length > 0) {
    console.log('  First 5 images to load:', uncachedImages.slice(0, 5))
  }
  
  const results: PreloadResult[] = []
  let loaded = 0
  
  // Process in batches
  for (let i = 0; i < uncachedImages.length; i += maxConcurrent) {
    const batch = uncachedImages.slice(i, i + maxConcurrent)
    const batchResults = await Promise.all(
      batch.map(src => preloadImage(src, options))
    )
    
    results.push(...batchResults)
    loaded += batch.length
    
    // Report progress
    onProgress?.(loaded, uncachedImages.length)
    
    // Add delay between batches on mobile
    if (delay > 0 && i + maxConcurrent < uncachedImages.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // Add results for already cached images
  const cachedResults = imageSrcs
    .filter(src => !uncachedImages.includes(src))
    .map(src => ({
      src,
      success: true,
      cached: true,
      loadTime: 0
    }))
  
  const allResults = [...cachedResults, ...results]
  
  // Log summary
  const successCount = results.filter(r => r.success).length
  const cachedCount = cachedResults.length
  const avgLoadTime = results.reduce((acc, r) => acc + r.loadTime, 0) / results.length
  
  console.log(`✅ Preloading complete:`)
  console.log(`   ⚡ Cached: ${cachedCount}`)
  console.log(`   📥 Loaded: ${successCount}`)
  console.log(`   ⏱️ Avg time: ${avgLoadTime.toFixed(0)}ms`)
  
  onComplete?.()
  return allResults
}

// Preload with delay
export async function preloadImagesDelayed(
  images: (string | ImageMetadata)[],
  delay: number,
  options: PreloadOptions = {}
): Promise<PreloadResult[]> {
  await new Promise(resolve => setTimeout(resolve, delay))
  return preloadImages(images, options)
}

// Preload images based on visibility (Intersection Observer)
export function preloadOnVisible(
  element: HTMLElement,
  images: (string | ImageMetadata)[],
  options: PreloadOptions = {}
): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadImages(images, options)
          observer.disconnect()
        }
      })
    },
    {
      rootMargin: '50px' // Start loading 50px before visible
    }
  )
  
  observer.observe(element)
  
  // Return cleanup function
  return () => observer.disconnect()
}

// Touch event prefetching for mobile
export function prefetchOnTouch(
  images: (string | ImageMetadata)[],
  options: PreloadOptions = {}
): () => void {
  // Start prefetching immediately on touch
  preloadImages(images, { ...options, maxConcurrent: 1 })
  return () => {} // No cleanup needed
}

// Save cache to sessionStorage (mobile)
export function persistCache(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  
  const deviceInfo = getDeviceInfo()
  if (!deviceInfo.isMobile) return
  
  try {
    const cacheIndex = Array.from(window.__imageCache.keys())
    const metadata = Array.from(window.__imageCacheMetadata.entries())
      .filter(([_, meta]) => meta.status === 'loaded')
      .map(([src, meta]) => ({ src, ...meta }))
    
    sessionStorage.setItem('imageCache', JSON.stringify({
      index: cacheIndex.slice(0, 50), // Limit to 50 most recent
      metadata,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.error('Failed to persist cache:', e)
  }
}

// Restore cache from sessionStorage (mobile)
export function restoreCache(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  
  try {
    const cached = sessionStorage.getItem('imageCache')
    if (!cached) return
    
    const { index, metadata, timestamp } = JSON.parse(cached)
    
    // Only restore if less than 1 hour old
    if (Date.now() - timestamp > 3600000) {
      sessionStorage.removeItem('imageCache')
      return
    }
    
    console.log(`📱 Restoring ${index.length} cached images from session`)
    
    // Restore metadata
    metadata.forEach((meta: any) => {
      window.__imageCacheMetadata.set(meta.src, {
        size: meta.size,
        loadTime: meta.loadTime,
        lastAccessed: meta.lastAccessed,
        status: 'loaded'
      })
    })
    
    // Start reloading images in background
    index.forEach((src: string) => {
      const img = new Image()
      img.src = src
      window.__imageCache.set(src, img)
    })
  } catch (e) {
    console.error('Failed to restore cache:', e)
  }
}

// Get cache statistics
export function getCacheStats() {
  if (typeof window === 'undefined') return null
  
  const totalImages = window.__imageCache.size
  const metadata = Array.from(window.__imageCacheMetadata.values())
  const loadedImages = metadata.filter(m => m.status === 'loaded').length
  const errorImages = metadata.filter(m => m.status === 'error').length
  const totalSize = metadata.reduce((acc, m) => acc + m.size, 0)
  const avgLoadTime = metadata.reduce((acc, m) => acc + m.loadTime, 0) / metadata.length
  
  return {
    totalImages,
    loadedImages,
    errorImages,
    totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
    avgLoadTime: `${avgLoadTime.toFixed(0)}ms`,
    cacheHitRate: `${((loadedImages / totalImages) * 100).toFixed(1)}%`
  }
}

// Clear cache (for debugging)
export function clearCache(): void {
  if (typeof window === 'undefined') return
  
  window.__imageCache.clear()
  window.__imageCacheMetadata.clear()
  sessionStorage.removeItem('imageCache')
  console.log('🗑️ Image cache cleared')
}