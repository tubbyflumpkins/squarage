'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { preloadForPage, preloadImages } from '@/lib/simplePreloader'
import { fetchAndCacheShopifyProducts, preloadShopifyCollection, preloadShopifyProduct } from '@/lib/shopifyPreloader'

export default function SimplePreloader() {
  const pathname = usePathname()
  
  useEffect(() => {
    console.log('🚀 SimplePreloader: Starting for', pathname)
    
    const loadImages = async () => {
      // First, load local images
      await preloadForPage(pathname)
      
      // Then, handle Shopify images based on route
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
      } else if (pathname === '/products') {
        // On products page, fetch all Shopify products
        await fetchAndCacheShopifyProducts()
      }
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
      
      // Preload images for the target page
      preloadForPage(href)
      
      // Also preload Shopify images for collections/products
      if (href.includes('/collections/')) {
        const collection = href.split('/').pop()
        if (collection) {
          preloadShopifyCollection(collection)
        }
      } else if (href.includes('/products/')) {
        const productHandle = href.split('/').pop()
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
  
  // Also handle color swatch clicks in product pages
  useEffect(() => {
    if (!pathname.includes('/products/')) return
    
    const handleColorClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if it's a color swatch
      if (target.tagName === 'BUTTON' && target.style.backgroundColor) {
        console.log('🎨 Color swatch clicked, preloading variants...')
        
        // Get product handle from URL
        const productHandle = pathname.split('/').pop()
        
        // Preload all variants for this product immediately
        if (productHandle === 'the-harper') {
          await preloadImages([
            '/images/products/harper/product_3_main_angle.jpg',
            '/images/products/harper/product_3_green_corrected_v3.jpg',
            '/images/products/harper/product_3_yellow.jpg',
            '/images/products/harper/product_3_orange.jpg',
            '/images/products/harper/product_3_red.jpg',
            '/images/products/harper/product_3_black.jpg',
            '/images/products/harper/product_3_white.jpg'
          ], 4)
        }
        // Add other products as needed
      }
    }
    
    document.addEventListener('click', handleColorClick)
    
    return () => {
      document.removeEventListener('click', handleColorClick)
    }
  }, [pathname])
  
  return null
}