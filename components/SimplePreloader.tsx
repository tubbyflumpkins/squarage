'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { fetchAndCacheShopifyProducts, preloadShopifyCollection, preloadShopifyProduct } from '@/lib/shopifyPreloader'

export default function SimplePreloader() {
  const pathname = usePathname()
  
  useEffect(() => {
    console.log('🚀 SimplePreloader: Starting for', pathname)
    
    const loadImages = async () => {
      // Handle Shopify images based on route. Local /images/ files are NOT
      // preloaded — they render through the Next.js image optimizer, so raw
      // preloads never match and only waste bandwidth (see lib/simplePreloader.ts).
      if (pathname === '/') {
        // On homepage, fetch all Shopify products for later use
        await fetchAndCacheShopifyProducts()
      } else if (pathname.includes('/collections/')) {
        const collection = pathname.split('/').pop()
        if (collection) {
          await preloadShopifyCollection(collection)
        }
      } else if (pathname.includes('/products/')) {
        const productHandle = pathname.split('/').pop()
        if (productHandle) {
          await preloadShopifyProduct(productHandle)
        }
      }
      // /products needs no fetch here: the server component provides the
      // catalog and ProductsPageClient seeds the cache from it.
    }
    
    // Wait for page to be interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        loadImages()
      })
    } else {
      // Small delay to let critical resources load first
      setTimeout(() => {
        loadImages()
      }, 500)
    }
    
    // Also preload on link hover
    const handleHover = async (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (!link) return
      
      const href = link.getAttribute('href')
      if (!href || !href.startsWith('/')) return

      // Preload Shopify images for collections/products
      if (href.includes('/collections/')) {
        const collection = href.split('/').pop()
        if (collection) {
          preloadShopifyCollection(collection)
        }
      } else if (href.includes('/products/')) {
        // Strip query/hash — the Mateo catalog cards link to
        // /products/mateo-chair?style=…
        const productHandle = href.split('/').pop()?.split(/[?#]/)[0]
        if (productHandle) {
          preloadShopifyProduct(productHandle)
        }
      }
    }
    
    document.addEventListener('mouseover', handleHover)
    
    return () => {
      document.removeEventListener('mouseover', handleHover)
    }
  }, [pathname])

  return null
}