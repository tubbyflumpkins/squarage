'use client'

import { useEffect } from 'react'
import { preloadImages, getCacheStats, PreloadConfig } from '@/lib/universalImagePreloader'
import { usePathname } from 'next/navigation'

// Complete list of ALL images in the site
const ALL_SITE_IMAGES: PreloadConfig[] = [
  // Hero images
  { imageSrc: '/images/hero-1.jpg', width: 1200, priority: 'high' },
  { imageSrc: '/images/hero-2.jpg', width: 1200, priority: 'high' },
  { imageSrc: '/images/hero-2-processed.jpg', width: 1200, priority: 'high' },
  { imageSrc: '/images/hero-3.jpg', width: 1200, priority: 'high' },
  { imageSrc: '/images/hero-4.jpg', width: 1200, priority: 'high' },
  { imageSrc: '/images/hero-5.jpg', width: 1200, priority: 'high' },
  
  // Collection heroes
  { imageSrc: '/images/collection-tiled.jpg', width: 800 },
  { imageSrc: '/images/collection-warped.jpg', width: 800 },
  { imageSrc: '/images/collection-chairs.jpg', width: 800 },
  { imageSrc: '/images/collection-objects.jpg', width: 800 },
  
  // About and other sections
  { imageSrc: '/images/about-studio.jpg', width: 600 },
  { imageSrc: '/images/custom-process.jpg', width: 600 },
  
  // Warped collection images
  { imageSrc: '/images/warped/curved_shelf_light_01.png', width: 600 },
  { imageSrc: '/images/warped/curved_shelf_light_02.png', width: 600 },
  { imageSrc: '/images/warped/curved_shelf_light_03.png', width: 600 },
  { imageSrc: '/images/warped/curved_shelf_light_04.png', width: 600 },
  { imageSrc: '/images/warped/curved_shelf_light_05.png', width: 600 },
  
  // Product images - The Matis
  { imageSrc: '/images/products/the-matis/matis-blue.jpg', width: 600 },
  { imageSrc: '/images/products/the-matis/matis-green.jpg', width: 600 },
  { imageSrc: '/images/products/the-matis/matis-yellow.jpg', width: 600 },
  { imageSrc: '/images/products/the-matis/matis-orange.jpg', width: 600 },
  { imageSrc: '/images/products/the-matis/matis-red.jpg', width: 600 },
  { imageSrc: '/images/products/the-matis/matis-black.jpg', width: 600 },
  { imageSrc: '/images/products/the-matis/matis-white.jpg', width: 600 },
  { imageSrc: '/images/products/the-matis/matis-natural.jpg', width: 600 },
  
  // Product images - The Harper
  { imageSrc: '/images/products/the-harper/harper-blue.jpg', width: 600 },
  { imageSrc: '/images/products/the-harper/harper-green.jpg', width: 600 },
  { imageSrc: '/images/products/the-harper/harper-yellow.jpg', width: 600 },
  { imageSrc: '/images/products/the-harper/harper-orange.jpg', width: 600 },
  { imageSrc: '/images/products/the-harper/harper-red.jpg', width: 600 },
  { imageSrc: '/images/products/the-harper/harper-black.jpg', width: 600 },
  { imageSrc: '/images/products/the-harper/harper-white.jpg', width: 600 },
  
  // Product images - The Chuck
  { imageSrc: '/images/products/the-chuck/chuck-blue.jpg', width: 600 },
  { imageSrc: '/images/products/the-chuck/chuck-green.jpg', width: 600 },
  { imageSrc: '/images/products/the-chuck/chuck-yellow.jpg', width: 600 },
  { imageSrc: '/images/products/the-chuck/chuck-orange.jpg', width: 600 },
  { imageSrc: '/images/products/the-chuck/chuck-red.jpg', width: 600 },
  { imageSrc: '/images/products/the-chuck/chuck-black.jpg', width: 600 },
  { imageSrc: '/images/products/the-chuck/chuck-white.jpg', width: 600 },
  
  // Add more product images as needed...
]

export default function UniversalPreloader() {
  const pathname = usePathname()
  
  useEffect(() => {
    const preloadAllImages = async () => {
      const isMobile = window.innerWidth < 768
      const startTime = performance.now()
      
      console.log(`🌐 Universal Preloader: Starting aggressive preload from ${pathname}`)
      console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`)
      
      // Check current cache status
      const beforeStats = getCacheStats()
      if (beforeStats && beforeStats.cacheSize > 0) {
        console.log(`⚡ Already cached: ${beforeStats.cacheSize} images`)
      }
      
      // Determine what to preload based on current page
      let imagesToPreload: PreloadConfig[] = []
      
      if (pathname === '/') {
        // On homepage: preload EVERYTHING accessible
        imagesToPreload = ALL_SITE_IMAGES
      } else if (pathname.includes('/collections/')) {
        // On collection page: preload all products in that collection
        imagesToPreload = ALL_SITE_IMAGES.filter(img => {
          // Filter based on collection
          const collectionName = pathname.split('/').pop()
          return img.imageSrc.includes(collectionName || '')
        })
      } else if (pathname.includes('/products/')) {
        // On product page: already showing images, no need to preload more
        console.log('📦 Product page - images already visible')
        return
      }
      
      // Start preloading with staggered approach for mobile
      if (isMobile) {
        // On mobile, prioritize high-priority images first
        const highPriority = imagesToPreload.filter(img => img.priority === 'high')
        const lowPriority = imagesToPreload.filter(img => img.priority !== 'high')
        
        if (highPriority.length > 0) {
          console.log(`🔥 Preloading ${highPriority.length} high-priority images...`)
          await preloadImages(highPriority, 3) // Only 3 concurrent on mobile
        }
        
        // Delay before loading low priority on mobile
        if (lowPriority.length > 0) {
          setTimeout(async () => {
            console.log(`📦 Preloading ${lowPriority.length} low-priority images...`)
            await preloadImages(lowPriority, 2) // Even fewer concurrent for low priority
            
            const stats = getCacheStats()
            console.log(`✅ Mobile preload complete: ${stats?.cacheSize} images cached`)
          }, 2000)
        }
      } else {
        // Desktop: load everything at once
        await preloadImages(imagesToPreload, 8) // More concurrent on desktop
      }
      
      const endTime = performance.now()
      const stats = getCacheStats()
      
      console.log(`🎉 Preload session complete in ${(endTime - startTime).toFixed(0)}ms`)
      console.log(`📊 Cache status: ${stats?.cacheSize} images, ${stats?.stats.loaded} loaded, ${stats?.stats.failed} failed`)
    }
    
    // Start preloading after a small delay to not block initial render
    const timer = setTimeout(preloadAllImages, 500)
    
    return () => clearTimeout(timer)
  }, [pathname])
  
  return null // This component doesn't render anything
}