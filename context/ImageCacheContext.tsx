'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Product } from 'shopify-buy'

// Support both native Shopify Product and SerializedProduct types
interface SerializedProduct {
  id: string
  title: string
  handle: string
  description: string
  descriptionHtml: string
  availableForSale: boolean
  createdAt: string
  updatedAt: string
  productType: string
  vendor: string
  tags: string[]
  options: Array<{
    id: string
    name: string
    values: string[]
  }>
  variants: Array<{
    id: string
    title: string
    availableForSale: boolean
    price: {
      amount: string
      currencyCode: string
    }
    compareAtPrice: {
      amount: string
      currencyCode: string
    } | null
    selectedOptions: Array<{
      name: string
      value: string
    }>
    image: {
      id: string
      src: string
      altText: string
    } | null
  }>
  images: Array<{
    id: string
    src: string
    altText: string
    width: number
    height: number
  }>
  metafields?: Array<{
    id: string
    namespace: string
    key: string
    value: string
    type: string
  }>
}

type SupportedProduct = Product | SerializedProduct

interface ImageCacheState {
  // Track which images are cached
  cachedImages: Set<string>
  // Track which images are currently loading
  loadingImages: Set<string>
  // Track which products have been fully preloaded
  preloadedProducts: Set<string>
  // Track preloading progress
  preloadingProgress: { loaded: number; total: number }
  // Cache statistics
  cacheStats: {
    totalImages: number
    cachedCount: number
    failedCount: number
  }
}

interface ImageCacheContextType {
  // State
  cacheState: ImageCacheState
  // Actions
  preloadProductImages: (product: SupportedProduct) => Promise<void>
  preloadImageBatch: (imageSrcs: string[]) => Promise<void>
  isImageCached: (imageSrc: string) => boolean
  isImageLoading: (imageSrc: string) => boolean
  isProductPreloaded: (productId: string) => boolean
  clearCache: () => void
  getCacheStats: () => ImageCacheState['cacheStats']
}

const ImageCacheContext = createContext<ImageCacheContextType | undefined>(undefined)

export const useImageCache = () => {
  const context = useContext(ImageCacheContext)
  if (!context) {
    throw new Error('useImageCache must be used within an ImageCacheProvider')
  }
  return context
}

interface ImageCacheProviderProps {
  children: React.ReactNode
}

export const ImageCacheProvider: React.FC<ImageCacheProviderProps> = ({ children }) => {
  const [cacheState, setCacheState] = useState<ImageCacheState>({
    cachedImages: new Set(),
    loadingImages: new Set(),
    preloadedProducts: new Set(),
    preloadingProgress: { loaded: 0, total: 0 },
    cacheStats: {
      totalImages: 0,
      cachedCount: 0,
      failedCount: 0
    }
  })

  // Simplified image preloading function without complex state dependencies
  const preloadImage = useCallback((imageSrc: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simple Image preloading strategy
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Update cache state on successful load
        setCacheState(prev => ({
          ...prev,
          cachedImages: new Set(prev.cachedImages).add(imageSrc),
          loadingImages: new Set([...prev.loadingImages].filter(src => src !== imageSrc)),
          cacheStats: {
            ...prev.cacheStats,
            cachedCount: prev.cacheStats.cachedCount + 1
          }
        }))
        resolve(true)
      }
      
      img.onerror = () => {
        // Update cache state on error
        setCacheState(prev => ({
          ...prev,
          loadingImages: new Set([...prev.loadingImages].filter(src => src !== imageSrc)),
          cacheStats: {
            ...prev.cacheStats,
            failedCount: prev.cacheStats.failedCount + 1
          }
        }))
        resolve(false)
      }
      
      // Mark as loading before starting
      setCacheState(prev => ({
        ...prev,
        loadingImages: new Set(prev.loadingImages).add(imageSrc)
      }))
      
      img.src = imageSrc
    })
  }, [])

  // Extract all images from a product (including variant images)
  const extractProductImages = useCallback((product: SupportedProduct): string[] => {
    const imageSet = new Set<string>()
    
    // Add all product images
    if (product.images) {
      product.images.forEach((image: any) => {
        // Handle both 'src' and 'url' properties (different between Product types)
        const imageSrc = image.src || image.url
        if (imageSrc) {
          imageSet.add(imageSrc)
        }
      })
    }

    // Add variant-specific images
    if (product.variants) {
      product.variants.forEach((variant: any) => {
        // Handle variant images - may have different structure
        const variantImageSrc = variant.image?.src || variant.image?.url
        if (variantImageSrc) {
          imageSet.add(variantImageSrc)
        }
      })
    }

    return Array.from(imageSet)
  }, [])

  // Preload all images for a specific product
  const preloadProductImages = useCallback(async (product: SupportedProduct): Promise<void> => {
    const productId = product.id.toString()
    
    // Use current state to check if already preloaded
    let isAlreadyPreloaded = false
    setCacheState(prev => {
      isAlreadyPreloaded = prev.preloadedProducts.has(productId)
      return prev
    })
    
    if (isAlreadyPreloaded) {
      return
    }

    const imageSrcs = extractProductImages(product)
    
    if (imageSrcs.length === 0) {
      // Mark as preloaded even if no images
      setCacheState(prev => ({
        ...prev,
        preloadedProducts: new Set(prev.preloadedProducts).add(productId)
      }))
      return
    }

    // Update total count
    setCacheState(prev => ({
      ...prev,
      cacheStats: {
        ...prev.cacheStats,
        totalImages: prev.cacheStats.totalImages + imageSrcs.length
      }
    }))

    // Preload images in small batches to avoid overwhelming the browser
    const batchSize = 3
    for (let i = 0; i < imageSrcs.length; i += batchSize) {
      const batch = imageSrcs.slice(i, i + batchSize)
      
      // Process batch in parallel
      await Promise.allSettled(
        batch.map(imageSrc => preloadImage(imageSrc))
      )

      // Small delay between batches to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Mark product as preloaded
    setCacheState(prev => ({
      ...prev,
      preloadedProducts: new Set(prev.preloadedProducts).add(productId)
    }))
  }, [extractProductImages, preloadImage])

  // Preload a batch of image URLs
  const preloadImageBatch = useCallback(async (imageSrcs: string[]): Promise<void> => {
    const batchSize = 5
    
    for (let i = 0; i < imageSrcs.length; i += batchSize) {
      const batch = imageSrcs.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(imageSrc => preloadImage(imageSrc))
      )

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 20))
    }
  }, [preloadImage])

  // Utility functions without state dependencies
  const isImageCached = useCallback((imageSrc: string): boolean => {
    // Use ref to get current state without dependency
    let isCached = false
    setCacheState(prev => {
      isCached = prev.cachedImages.has(imageSrc)
      return prev
    })
    return isCached
  }, [])

  const isImageLoading = useCallback((imageSrc: string): boolean => {
    let isLoading = false
    setCacheState(prev => {
      isLoading = prev.loadingImages.has(imageSrc)
      return prev
    })
    return isLoading
  }, [])

  const isProductPreloaded = useCallback((productId: string): boolean => {
    let isPreloaded = false
    setCacheState(prev => {
      isPreloaded = prev.preloadedProducts.has(productId)
      return prev
    })
    return isPreloaded
  }, [])

  const clearCache = useCallback(() => {
    setCacheState({
      cachedImages: new Set(),
      loadingImages: new Set(),
      preloadedProducts: new Set(),
      preloadingProgress: { loaded: 0, total: 0 },
      cacheStats: {
        totalImages: 0,
        cachedCount: 0,
        failedCount: 0
      }
    })
  }, [])

  const getCacheStats = useCallback(() => {
    let stats = { totalImages: 0, cachedCount: 0, failedCount: 0 }
    setCacheState(prev => {
      stats = prev.cacheStats
      return prev
    })
    return stats
  }, [])

  // Removed debug logging to prevent re-render loops

  const value: ImageCacheContextType = {
    cacheState,
    preloadProductImages,
    preloadImageBatch,
    isImageCached,
    isImageLoading,
    isProductPreloaded,
    clearCache,
    getCacheStats
  }

  return (
    <ImageCacheContext.Provider value={value}>
      {children}
    </ImageCacheContext.Provider>
  )
}