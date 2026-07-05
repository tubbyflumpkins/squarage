// Shopify-specific preloader that fetches and caches product images
'use client'

import { shopifyApi } from '@/lib/shopify'
import { preloadImage } from '@/lib/simplePreloader'

// Cache Shopify products globally
declare global {
  interface Window {
    __shopifyProducts: any[]
    __shopifyLoaded: boolean
  }
}

if (typeof window !== 'undefined') {
  window.__shopifyProducts = window.__shopifyProducts || []
  window.__shopifyLoaded = window.__shopifyLoaded || false
}

// Fetch and cache all Shopify products
export async function fetchAndCacheShopifyProducts() {
  if (window.__shopifyLoaded) {
    console.log('⚡ Shopify products already loaded')
    return window.__shopifyProducts
  }

  console.log('🛍️ Fetching Shopify products...')

  try {
    const products = await shopifyApi.getProducts()
    window.__shopifyProducts = products
    window.__shopifyLoaded = true

    console.log(`✅ Loaded ${products.length} Shopify products`)

    return products
  } catch (error) {
    console.error('❌ Failed to fetch Shopify products:', error)
    return []
  }
}

// Seed the cache with server-fetched catalog data (e.g. /products passes its
// props here) so hover-preloading works without a duplicate client fetch.
export function seedShopifyProductCache(products: any[]) {
  if (typeof window === 'undefined' || window.__shopifyLoaded || products.length === 0) return
  window.__shopifyProducts = products
  window.__shopifyLoaded = true
  console.log(`⚡ Seeded Shopify cache with ${products.length} server-fetched products`)
}

// The cache array starts as [] (truthy), so callers must check the loaded
// flag — `window.__shopifyProducts || fetch...` would never fetch.
async function getCachedProducts(): Promise<any[]> {
  return window.__shopifyLoaded ? window.__shopifyProducts : fetchAndCacheShopifyProducts()
}

// Preload Shopify images for a specific collection
export async function preloadShopifyCollection(collectionHandle: string) {
  const products = await getCachedProducts()
  
  const collectionImages: string[] = []
  
  products.forEach((product: any) => {
    // Simple heuristic: match collection to product
    const shouldInclude = 
      (collectionHandle === 'tiled' && (
        product.handle?.includes('harper') ||
        product.handle?.includes('matis') ||
        product.handle?.includes('chuck') ||
        product.handle?.includes('table')
      )) ||
      (collectionHandle === 'warped' && (
        product.handle?.includes('shelf') ||
        product.handle?.includes('warped')
      ))
    
    if (shouldInclude && product.images) {
      product.images.forEach((img: any) => {
        if (img.src) {
          collectionImages.push(img.src)
        }
      })
    }
  })
  
  console.log(`📦 Preloading ${collectionImages.length} images for ${collectionHandle} collection`)
  
  // Preload in batches
  for (let i = 0; i < collectionImages.length; i += 3) {
    const batch = collectionImages.slice(i, i + 3)
    await Promise.all(batch.map(src => preloadImage(src)))
  }
}

// Preload Shopify images for a specific product
export async function preloadShopifyProduct(productHandle: string) {
  const products = await getCachedProducts()
  
  const product = products.find((p: any) => p.handle === productHandle)
  
  if (!product) {
    console.log(`⚠️ Product ${productHandle} not found`)
    return
  }
  
  const productImages: string[] = []
  
  // Add all product images
  if (product.images) {
    product.images.forEach((img: any) => {
      if (img.src) {
        productImages.push(img.src)
      }
    })
  }
  
  // Add all variant images
  if (product.variants) {
    product.variants.forEach((variant: any) => {
      if (variant.image?.src) {
        productImages.push(variant.image.src)
      }
    })
  }
  
  console.log(`📦 Preloading ${productImages.length} images for ${productHandle}`)
  
  // Preload all at once for product pages (high priority)
  await Promise.all(productImages.map(src => preloadImage(src)))
}