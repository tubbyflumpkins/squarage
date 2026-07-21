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

// There is intentionally NO route-based preloading of local /images/ files.
// Local images render exclusively through the Next.js image optimizer
// (/_next/image), so preloading the RAW originals (img.src = '/images/...')
// never matches the URLs the pages actually render and force-decodes
// full-resolution files — which exhausted iOS Safari's RAM-proportional
// decoded-image budget on 4 GB iPhones (blank collection tiles). Only Shopify
// CDN URLs, which FastProductImage renders verbatim, belong in this cache.
// See PRELOADING.md.

// Check if an image is already in the cache
export function isImageCached(src: string): boolean {
  if (typeof window === 'undefined') return false
  return window.__simpleImageCache?.has(src) ?? false
}
