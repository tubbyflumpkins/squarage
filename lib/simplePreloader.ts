// Simple, direct preloader that actually works
'use client'

// Global cache that persists across navigation
declare global {
  interface Window {
    __simpleImageCache: Set<string>
    __preloadQueue: Set<string>
  }
}

// Initialize cache
if (typeof window !== 'undefined') {
  window.__simpleImageCache = window.__simpleImageCache || new Set()
  window.__preloadQueue = window.__preloadQueue || new Set()
}

// Simple preload function
export function preloadImage(src: string): Promise<void> {
  // Skip if already cached or queued
  if (window.__simpleImageCache.has(src) || window.__preloadQueue.has(src)) {
    return Promise.resolve()
  }

  // Add to queue
  window.__preloadQueue.add(src)

  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      window.__simpleImageCache.add(src)
      window.__preloadQueue.delete(src)
      console.log('✅ Preloaded:', src)
      resolve()
    }
    
    img.onerror = () => {
      window.__preloadQueue.delete(src)
      console.log('❌ Failed:', src)
      resolve() // Resolve anyway to not block
    }
    
    img.src = src
  })
}

// Batch preload with concurrency
export async function preloadImages(srcs: string[], maxConcurrent = 3): Promise<void> {
  const uniqueSrcs = [...new Set(srcs)]
  const uncached = uniqueSrcs.filter(src => !window.__simpleImageCache.has(src))
  
  if (uncached.length === 0) {
    console.log('⚡ All images already cached')
    return
  }
  
  console.log(`📦 Preloading ${uncached.length} images...`)
  
  // Process in batches
  for (let i = 0; i < uncached.length; i += maxConcurrent) {
    const batch = uncached.slice(i, i + maxConcurrent)
    await Promise.all(batch.map(src => preloadImage(src)))
  }
}

// Preload based on current page
export async function preloadForPage(pathname: string) {
  console.log(`📍 Preloading for: ${pathname}`)
  
  const images: string[] = []
  
  // Homepage - preload hero images and collection images
  if (pathname === '/') {
    images.push(
      '/images/hero-2-processed.jpg',
      '/images/IMG_0961.jpg',
      '/images/IMG_1286.jpg',
      '/images/IMG_6122.jpeg',
      '/images/product_5_main_angle_blue.jpg',
      '/images/product_6_main_angle_3d.jpg',
      '/images/collection-tiled.jpg',
      '/images/collection-warped.jpg',
      '/images/collection-chairs.jpg',
      '/images/collection-objects.jpg'
    )
  }
  
  // Tiled collection - preload all tiled product images
  else if (pathname === '/collections/tiled') {
    images.push(
      '/images/collection-tiled.jpg',
      // Harper variants
      '/images/products/harper/product_3_main_angle.jpg',
      '/images/products/harper/product_3_green_corrected_v3.jpg',
      '/images/products/harper/product_3_yellow.jpg',
      '/images/products/harper/product_3_orange.jpg',
      '/images/products/harper/product_3_red.jpg',
      '/images/products/harper/product_3_black.jpg',
      '/images/products/harper/product_3_white.jpg',
      // Matis variants
      '/images/products/matis/Product_1_blue.jpg',
      '/images/products/matis/Product_1_green.jpg',
      '/images/products/matis/Product_1_yellow.jpg',
      '/images/products/matis/Product_1_orange.jpg',
      '/images/products/matis/Product_1_red.jpg',
      '/images/products/matis/Product_1_white.jpg',
      // Chuck variants
      '/images/products/chuck/product_4_main_angle_blue.jpg',
      '/images/products/chuck/product_4_main_angle_green.jpg',
      '/images/products/chuck/product_4_main_angle_yellow.jpg',
      '/images/products/chuck/product_4_main_angle_orange.jpg',
      '/images/products/chuck/product_4_main_angle_red.jpg',
      '/images/products/chuck/product_4_main_angle_black.jpg',
      '/images/products/chuck/product_4_main_angle_white.jpg'
    )
  }
  
  // Warped collection
  else if (pathname === '/collections/warped') {
    images.push(
      '/images/collection-warped.jpg',
      '/images/warped/curved_shelf_light_05.png',
      '/images/warped/curved_shelf_dark_05.png',
      '/images/warped/corner_shelf_light_05.png',
      '/images/warped/corner_shelf_medium_02.png',
      '/images/warped/corner_shelf_medium_07.png'
    )
  }
  
  // Products page - preload first image of each product
  else if (pathname === '/products') {
    images.push(
      '/images/products/harper/product_3_main_angle.jpg',
      '/images/products/matis/Product_1_blue.jpg',
      '/images/products/chuck/product_4_main_angle_blue.jpg',
      '/images/products/arielle/Product_2_blue.jpg',
      '/images/products/saskia/Blue.jpg',
      '/images/products/seba/product_6_main_angle_blue.jpg'
    )
  }
  
  // Product detail pages - preload all variants
  else if (pathname.startsWith('/products/')) {
    const productHandle = pathname.split('/').pop()
    
    if (productHandle === 'the-harper') {
      images.push(
        '/images/products/harper/product_3_main_angle.jpg',
        '/images/products/harper/product_3_green_corrected_v3.jpg',
        '/images/products/harper/product_3_yellow.jpg',
        '/images/products/harper/product_3_orange.jpg',
        '/images/products/harper/product_3_red.jpg',
        '/images/products/harper/product_3_black.jpg',
        '/images/products/harper/product_3_white.jpg'
      )
    }
    // Add other products as needed
  }
  
  // Preload with appropriate concurrency
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  await preloadImages(images, isMobile ? 2 : 4)
}

// Hook to automatically preload on navigation
export function useSimplePreloader(pathname: string) {
  if (typeof window === 'undefined') return
  
  // Preload after a short delay to let the page render first
  setTimeout(() => {
    preloadForPage(pathname)
  }, 100)
}