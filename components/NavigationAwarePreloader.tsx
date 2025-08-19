'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { 
  initializeImageRegistry, 
  getImagesForRoute,
  ImageMetadata 
} from '@/lib/universalImageRegistry'
import { 
  preloadImages, 
  preloadImagesDelayed,
  restoreCache,
  persistCache,
  getCacheStats,
  isImageCached
} from '@/lib/navigationPreloader'
import { getDeviceInfo } from '@/lib/imageOptimizer'

export default function NavigationAwarePreloader() {
  const pathname = usePathname()
  const [isPreloading, setIsPreloading] = useState(false)
  const [progress, setProgress] = useState({ loaded: 0, total: 0 })
  const [registryInitialized, setRegistryInitialized] = useState(false)
  
  // Initialize registry on mount
  useEffect(() => {
    const init = async () => {
      console.log('🚀 NavigationAwarePreloader: Initializing...')
      
      // Restore cache from sessionStorage on mobile
      const deviceInfo = getDeviceInfo()
      if (deviceInfo.isMobile) {
        restoreCache()
      }
      
      // Initialize image registry
      await initializeImageRegistry()
      setRegistryInitialized(true)
      
      // Log initial cache stats
      const stats = getCacheStats()
      if (stats) {
        console.log('📊 Initial cache stats:', stats)
      }
    }
    
    init()
    
    // Persist cache on page unload (mobile)
    const handleUnload = () => {
      const deviceInfo = getDeviceInfo()
      if (deviceInfo.isMobile) {
        persistCache()
      }
    }
    
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])
  
  // Preload images based on current route
  const preloadForRoute = useCallback(async (path: string) => {
    if (!registryInitialized || isPreloading) return
    
    setIsPreloading(true)
    const deviceInfo = getDeviceInfo()
    
    console.log(`📍 Route changed to: ${path}`)
    console.log(`📱 Device: ${deviceInfo.isMobile ? 'Mobile' : 'Desktop'}`)
    
    // Wait for page to be interactive
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true })
      })
    }
    
    // Get images for this route
    const { immediate, delayed, onDemand } = getImagesForRoute(path)
    
    console.log(`📦 Images to preload:`)
    console.log(`   - Immediate: ${immediate.length}`)
    console.log(`   - Delayed: ${delayed.length}`)
    console.log(`   - On-demand: ${onDemand.length}`)
    
    // Track total progress
    const totalImages = immediate.length + delayed.length
    let loadedImages = 0
    
    // Preload immediate images
    if (immediate.length > 0) {
      console.log('🔥 Loading immediate images...')
      
      await preloadImages(immediate, {
        priority: 'high',
        maxConcurrent: deviceInfo.isMobile ? 3 : 8,
        onProgress: (loaded, total) => {
          loadedImages = loaded
          setProgress({ loaded: loadedImages, total: totalImages })
        }
      })
    }
    
    // Preload delayed images with appropriate delay
    if (delayed.length > 0) {
      const delay = getDelayForRoute(path, deviceInfo.isMobile)
      console.log(`⏱️ Loading delayed images after ${delay}ms...`)
      
      preloadImagesDelayed(delayed, delay, {
        priority: 'medium',
        maxConcurrent: deviceInfo.isMobile ? 2 : 6,
        onProgress: (loaded, total) => {
          setProgress({ 
            loaded: immediate.length + loaded, 
            total: totalImages 
          })
        },
        onComplete: () => {
          console.log('✅ All delayed images loaded')
          logCacheStats()
        }
      })
    }
    
    // Setup on-demand loading for specific elements
    if (onDemand.length > 0 && !deviceInfo.isMobile) {
      // On desktop, preload on-demand images after a longer delay
      setTimeout(() => {
        console.log('📦 Background loading on-demand images...')
        preloadImages(onDemand, {
          priority: 'low',
          maxConcurrent: 2
        })
      }, 5000)
    }
    
    setIsPreloading(false)
  }, [registryInitialized, isPreloading])
  
  // React to route changes
  useEffect(() => {
    if (!registryInitialized) return
    
    // Add a small delay to ensure the route has fully changed
    const timer = setTimeout(() => {
      preloadForRoute(pathname)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [pathname, registryInitialized, preloadForRoute])
  
  // Prefetch images for links on hover/touch
  useEffect(() => {
    if (!registryInitialized) return
    
    const handleLinkInteraction = (e: Event) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (!link) return
      
      const href = link.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      
      // Get images for the target route
      const { immediate } = getImagesForRoute(href)
      const uncached = immediate.filter(img => !isImageCached(img.src))
      
      if (uncached.length > 0) {
        console.log(`🔗 Prefetching ${uncached.length} images for ${href}`)
        preloadImages(uncached.slice(0, 5), {
          priority: 'high',
          maxConcurrent: 2
        })
      }
    }
    
    // Add event listeners for link prefetching
    document.addEventListener('mouseenter', handleLinkInteraction, true)
    document.addEventListener('touchstart', handleLinkInteraction, true)
    
    return () => {
      document.removeEventListener('mouseenter', handleLinkInteraction, true)
      document.removeEventListener('touchstart', handleLinkInteraction, true)
    }
  }, [registryInitialized])
  
  // Helper function to determine delay based on route
  function getDelayForRoute(path: string, isMobile: boolean): number {
    if (path === '/') {
      return isMobile ? 2000 : 1500 // Homepage needs more time
    }
    if (path.includes('/products/')) {
      return 500 // Product pages load quickly
    }
    if (path.includes('/collections/')) {
      return isMobile ? 1500 : 1000
    }
    return isMobile ? 1500 : 1000
  }
  
  // Log cache statistics
  function logCacheStats() {
    const stats = getCacheStats()
    if (stats) {
      console.log('📊 Cache statistics:')
      console.log(`   - Total images: ${stats.totalImages}`)
      console.log(`   - Loaded: ${stats.loadedImages}`)
      console.log(`   - Errors: ${stats.errorImages}`)
      console.log(`   - Size: ${stats.totalSize}`)
      console.log(`   - Avg load time: ${stats.avgLoadTime}`)
      console.log(`   - Hit rate: ${stats.cacheHitRate}`)
    }
  }
  
  // Show subtle loading indicator (optional)
  if (isPreloading && progress.total > 0) {
    const percentage = Math.round((progress.loaded / progress.total) * 100)
    
    // Only show on desktop or if explicitly needed
    if (process.env.NODE_ENV === 'development') {
      return (
        <div 
          className="fixed bottom-4 right-4 z-50 bg-black/80 text-white px-3 py-2 rounded text-xs"
          style={{ display: percentage >= 100 ? 'none' : 'block' }}
        >
          Optimizing images... {percentage}%
        </div>
      )
    }
  }
  
  return null
}

// Export utility function for manual preloading
export async function preloadProductVariants(productHandle: string, variants: string[]) {
  const deviceInfo = getDeviceInfo()
  const images: ImageMetadata[] = []
  
  // Build list of variant images
  variants.forEach(variant => {
    // This would be populated from the registry
    // For now, using a simple pattern
    const variantImages = [
      `/images/products/${productHandle}/${productHandle}-${variant}.jpg`
    ]
    
    variantImages.forEach(src => {
      images.push({
        src,
        type: 'local',
        priority: 'high'
      })
    })
  })
  
  console.log(`🎨 Preloading ${images.length} variant images for ${productHandle}`)
  
  return preloadImages(images, {
    priority: 'high',
    maxConcurrent: deviceInfo.isMobile ? 2 : 4
  })
}