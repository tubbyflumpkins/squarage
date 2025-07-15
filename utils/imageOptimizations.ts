'use client'

/**
 * Next.js Image Optimization Utilities
 * 
 * These utilities work specifically with Next.js Image component
 * to provide better preloading and caching integration
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface NextImagePreloadOptions {
  priority?: boolean
  sizes?: string
  quality?: number
  format?: 'webp' | 'avif' | 'auto'
}

/**
 * Enhanced image preloading that works with Next.js Image component
 */
export const preloadNextImage = (
  src: string, 
  options: NextImagePreloadOptions = {}
): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a link element for preloading that Next.js will recognize
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    
    // Add Next.js specific optimizations
    if (options.sizes) {
      link.setAttribute('imagesizes', options.sizes)
    }
    
    // Handle load/error events
    link.onload = () => {
      resolve(true)
      // Clean up after successful load
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      }, 1000)
    }
    
    link.onerror = () => {
      resolve(false)
      // Clean up after error
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
    
    // Add to document head
    document.head.appendChild(link)
  })
}

/**
 * Batch preload images with Next.js optimizations
 */
export const batchPreloadNextImages = async (
  imageSrcs: string[],
  options: NextImagePreloadOptions = {},
  batchSize: number = 3
): Promise<{ success: number; failed: number }> => {
  let successCount = 0
  let failedCount = 0
  
  // Process in batches to avoid overwhelming the browser
  for (let i = 0; i < imageSrcs.length; i += batchSize) {
    const batch = imageSrcs.slice(i, i + batchSize)
    
    const results = await Promise.allSettled(
      batch.map(src => preloadNextImage(src, options))
    )
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++
      } else {
        failedCount++
      }
    })
    
    // Small delay between batches
    if (i + batchSize < imageSrcs.length) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  return { success: successCount, failed: failedCount }
}

/**
 * Hook for prefetching product pages and their images
 */
export const usePrefetchProductPages = () => {
  const router = useRouter()
  
  const prefetchProductPage = useCallback(
    (productHandle: string, productImages: string[] = []) => {
      // Prefetch the product page route
      router.prefetch(`/products/${productHandle}`)
      
      // Preload the product images
      if (productImages.length > 0) {
        batchPreloadNextImages(productImages, {
          sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
        })
      }
    },
    [router]
  )
  
  return { prefetchProductPage }
}

/**
 * Generate optimized srcSet for responsive images
 */
export const generateOptimizedSrcSet = (
  baseSrc: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
  return widths
    .map(width => {
      // For Shopify images, we can add size parameters
      if (baseSrc.includes('shopify')) {
        const url = new URL(baseSrc)
        url.searchParams.set('width', width.toString())
        return `${url.toString()} ${width}w`
      }
      
      // For other images, return as-is
      return `${baseSrc} ${width}w`
    })
    .join(', ')
}

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizesAttribute = (
  breakpoints: { [key: string]: string } = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    'default': '33vw'
  }
): string => {
  const sizeEntries = Object.entries(breakpoints)
  const defaultSize = sizeEntries.find(([key]) => key === 'default')?.[1] || '100vw'
  const mediaQueries = sizeEntries
    .filter(([key]) => key !== 'default')
    .map(([query, size]) => `${query} ${size}`)
    .join(', ')
  
  return mediaQueries ? `${mediaQueries}, ${defaultSize}` : defaultSize
}

/**
 * Enhanced Image component wrapper with built-in preloading
 */
export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  sizes?: string
  onLoad?: () => void
  onError?: () => void
  preload?: boolean
}

// This would be used like:
// <OptimizedImage src={imageSrc} alt={alt} preload={true} ... />

export const createOptimizedImageLoader = (baseUrl: string) => {
  return ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    const url = new URL(src, baseUrl)
    
    if (width) {
      url.searchParams.set('w', width.toString())
    }
    
    if (quality) {
      url.searchParams.set('q', quality.toString())
    }
    
    return url.toString()
  }
}

/**
 * Performance monitoring for image loading
 */
export const trackImagePerformance = (imageSrc: string, startTime: number = Date.now()) => {
  return {
    markLoaded: () => {
      const loadTime = Date.now() - startTime
      console.log(`Image loaded in ${loadTime}ms:`, imageSrc)
      
      // You could send this to analytics
      if (typeof window !== 'undefined' && 'performance' in window) {
        performance.mark(`image-loaded-${imageSrc}`)
      }
      
      return loadTime
    },
    
    markError: () => {
      const failTime = Date.now() - startTime
      console.warn(`Image failed to load after ${failTime}ms:`, imageSrc)
      
      return failTime
    }
  }
}