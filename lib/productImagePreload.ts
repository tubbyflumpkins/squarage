'use client'

// Product-image preloading on top of the shared window.__simpleImageCache
// system — the same cache FastProductImage reads for its instant-render
// path. Module-level state, no React context: preload progress must never
// re-render the app tree.
import { preloadImages, isImageCached } from '@/lib/simplePreloader'

const preloadedProducts = new Set<string>()

function extractProductImages(product: any): string[] {
  const imageSet = new Set<string>()

  if (product.images) {
    product.images.forEach((image: any) => {
      // Handle both 'src' and 'url' properties (different between Product shapes)
      const src = image.src || image.url
      if (src) imageSet.add(src)
    })
  }

  if (product.variants) {
    product.variants.forEach((variant: any) => {
      const src = variant.image?.src || variant.image?.url
      if (src) imageSet.add(src)
    })
  }

  return Array.from(imageSet)
}

export function isProductPreloaded(productId: string): boolean {
  return preloadedProducts.has(productId)
}

export async function preloadProductImages(product: any): Promise<void> {
  const productId = String(product.id)
  // Mark before awaiting so concurrent callers (grid effect + card hover)
  // don't kick off duplicate loads
  if (preloadedProducts.has(productId)) return
  preloadedProducts.add(productId)

  const srcs = extractProductImages(product).filter((src) => !isImageCached(src))
  if (srcs.length === 0) return

  await preloadImages(srcs, 6)
}
