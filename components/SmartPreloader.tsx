'use client'

import { useEffect, useState } from 'react'
import { preloadImages, getCacheStats, PreloadConfig } from '@/lib/universalImagePreloader'
import { usePathname } from 'next/navigation'
import { fetchAllProducts } from '@/lib/shopify'

export default function SmartPreloader() {
  const pathname = usePathname()
  const [shopifyImages, setShopifyImages] = useState<PreloadConfig[]>([])
  
  // Fetch Shopify product images dynamically
  useEffect(() => {
    const fetchShopifyImages = async () => {
      try {
        const products = await fetchAllProducts()
        const images: PreloadConfig[] = []
        
        products.forEach(product => {
          // Add all product images
          if (product.images && Array.isArray(product.images)) {
            product.images.forEach((image: any) => {
              if (image.src && !images.some(img => img.imageSrc === image.src)) {
                images.push({
                  imageSrc: image.src,
                  width: 600,
                  priority: 'low'
                })
              }
            })
          }
          
          // Add variant images
          if (product.variants && Array.isArray(product.variants)) {
            product.variants.forEach((variant: any) => {
              if (variant.image?.src && !images.some(img => img.imageSrc === variant.image.src)) {
                images.push({
                  imageSrc: variant.image.src,
                  width: 600,
                  priority: 'low'
                })
              }
            })
          }
        })
        
        console.log(`📦 Found ${images.length} Shopify product images`)
        setShopifyImages(images)
      } catch (error) {
        console.error('Failed to fetch Shopify images:', error)
      }
    }
    
    // Only fetch if we have Shopify configured
    if (process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN) {
      fetchShopifyImages()
    }
  }, [])
  
  useEffect(() => {
    const preloadAllImages = async () => {
      // Wait for page to fully load
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          window.addEventListener('load', resolve, { once: true })
        })
      }
      
      // Delay based on page type
      const delay = pathname === '/' ? 2000 : 1000 // Longer delay on homepage
      await new Promise(resolve => setTimeout(resolve, delay))
      
      const isMobile = window.innerWidth < 768
      const startTime = performance.now()
      
      console.log(`🚀 Smart Preloader: Starting optimized preload`)
      console.log(`📍 Current page: ${pathname}`)
      console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`)
      
      // Check current cache status
      const beforeStats = getCacheStats()
      if (beforeStats && beforeStats.cacheSize > 0) {
        console.log(`⚡ Already cached: ${beforeStats.cacheSize} images`)
      }
      
      // Static images that should always be preloaded
      const staticImages: PreloadConfig[] = [
        // Hero images (high priority on homepage)
        { imageSrc: '/images/hero-1.jpg', width: 1200, priority: pathname === '/' ? 'high' : 'low' },
        { imageSrc: '/images/hero-2.jpg', width: 1200, priority: pathname === '/' ? 'high' : 'low' },
        { imageSrc: '/images/hero-2-processed.jpg', width: 1200, priority: pathname === '/' ? 'high' : 'low' },
        { imageSrc: '/images/hero-3.jpg', width: 1200, priority: pathname === '/' ? 'high' : 'low' },
        { imageSrc: '/images/hero-4.jpg', width: 1200, priority: pathname === '/' ? 'high' : 'low' },
        { imageSrc: '/images/hero-5.jpg', width: 1200, priority: pathname === '/' ? 'high' : 'low' },
        
        // Collection heroes
        { imageSrc: '/images/collection-tiled.jpg', width: 800 },
        { imageSrc: '/images/collection-warped.jpg', width: 800 },
        { imageSrc: '/images/collection-chairs.jpg', width: 800 },
        { imageSrc: '/images/collection-objects.jpg', width: 800 },
        
        // Warped collection local images
        { imageSrc: '/images/warped/curved_shelf_light_05.png', width: 600 },
        { imageSrc: '/images/warped/curved_shelf_dark_05.png', width: 600 },
        { imageSrc: '/images/warped/corner_shelf_light_05.png', width: 600 },
        { imageSrc: '/images/warped/corner_shelf_medium_02.png', width: 600 },
        { imageSrc: '/images/warped/corner_shelf_medium_07.png', width: 600 },
        
        // About and other sections
        { imageSrc: '/images/about-studio.jpg', width: 600 },
        { imageSrc: '/images/custom-process.jpg', width: 600 },
      ]
      
      // Combine static and Shopify images
      const allImages = [...staticImages, ...shopifyImages]
      
      // Filter based on current page
      let imagesToPreload: PreloadConfig[] = []
      
      if (pathname === '/') {
        // Homepage: preload collection images first, then products
        imagesToPreload = allImages
      } else if (pathname.includes('/collections/warped')) {
        // Warped collection: prioritize Warped images
        imagesToPreload = allImages.filter(img => 
          img.imageSrc.includes('warped') || 
          img.imageSrc.includes('shelf') ||
          img.imageSrc.includes('birch') ||
          img.imageSrc.includes('oak') ||
          img.imageSrc.includes('walnut')
        )
      } else if (pathname.includes('/collections/')) {
        // Other collections: preload relevant products
        const collectionName = pathname.split('/').pop()
        imagesToPreload = allImages.filter(img => 
          img.imageSrc.toLowerCase().includes(collectionName || '')
        )
      } else if (pathname.includes('/products/')) {
        // Product page: minimal preloading
        console.log('📦 Product page - minimal preloading')
        return
      } else {
        // Default: preload essentials
        imagesToPreload = staticImages.filter(img => img.priority === 'high')
      }
      
      // Preload with intelligent batching
      if (isMobile) {
        // Mobile: strict prioritization
        const essential = imagesToPreload.filter(img => img.priority === 'high').slice(0, 5)
        const important = imagesToPreload.filter(img => img.priority !== 'high').slice(0, 15)
        
        if (essential.length > 0) {
          console.log(`🔥 Preloading ${essential.length} essential images...`)
          await preloadImages(essential, 2)
        }
        
        // Delay before secondary images on mobile
        if (important.length > 0) {
          setTimeout(async () => {
            console.log(`📦 Background loading ${important.length} additional images...`)
            await preloadImages(important, 2)
            
            const stats = getCacheStats()
            console.log(`✅ Mobile preload complete: ${stats?.cacheSize} total images cached`)
          }, 3000)
        }
      } else {
        // Desktop: aggressive but non-blocking
        const highPriority = imagesToPreload.filter(img => img.priority === 'high')
        const lowPriority = imagesToPreload.filter(img => img.priority !== 'high')
        
        // Load high priority first
        if (highPriority.length > 0) {
          await preloadImages(highPriority, 6)
        }
        
        // Then load everything else
        if (lowPriority.length > 0) {
          // Use requestIdleCallback for low priority on desktop
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
              preloadImages(lowPriority, 4).then(() => {
                const stats = getCacheStats()
                console.log(`✅ Desktop preload complete: ${stats?.cacheSize} total images cached`)
              })
            })
          } else {
            setTimeout(() => {
              preloadImages(lowPriority, 4).then(() => {
                const stats = getCacheStats()
                console.log(`✅ Desktop preload complete: ${stats?.cacheSize} total images cached`)
              })
            }, 1000)
          }
        }
      }
      
      const endTime = performance.now()
      console.log(`⏱️ Initial preload phase took ${(endTime - startTime).toFixed(0)}ms`)
    }
    
    // Start preloading
    preloadAllImages()
  }, [pathname, shopifyImages])
  
  return null
}