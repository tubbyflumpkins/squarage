'use client'

import { fetchAllProducts } from '@/lib/shopify'
import { Product } from 'shopify-buy'

// Types
export interface ImageMetadata {
  src: string
  width?: number
  height?: number
  type: 'local' | 'shopify' | 'external'
  priority?: 'high' | 'medium' | 'low'
}

export interface ProductImages {
  productId: string
  productHandle: string
  productTitle: string
  variants: Map<string, ImageMetadata[]> // color -> images
  allImages: ImageMetadata[]
}

export interface ImageRegistry {
  localImages: {
    hero: ImageMetadata[]
    collections: Record<string, ImageMetadata[]>
    products: Record<string, ImageMetadata[]>
    misc: ImageMetadata[]
  }
  shopifyImages: Map<string, ProductImages>
  initialized: boolean
}

// Type for local images structure
type LocalImageMap = {
  hero: ImageMetadata[]
  collections: Record<string, ImageMetadata[]>
  products: Record<string, ImageMetadata[]>
  misc: ImageMetadata[]
}

// Static local images mapping with correct paths
const LOCAL_IMAGES: LocalImageMap = {
  hero: [
    { src: '/images/hero-2-processed.jpg', type: 'local', priority: 'high' },
    { src: '/images/IMG_0961.jpg', type: 'local', priority: 'high' },
    { src: '/images/IMG_1286.jpg', type: 'local', priority: 'high' },
    { src: '/images/IMG_6122.jpeg', type: 'local', priority: 'high' },
    { src: '/images/product_5_main_angle_blue.jpg', type: 'local', priority: 'high' },
    { src: '/images/product_6_main_angle_3d.jpg', type: 'local', priority: 'high' },
  ],
  collections: {
    tiled: [
      { src: '/images/collection-tiled.jpg', type: 'local', priority: 'high' }
    ],
    warped: [
      { src: '/images/collection-warped.jpg', type: 'local', priority: 'high' },
      { src: '/images/warped/curved_shelf_light_05.png', type: 'local', priority: 'medium' },
      { src: '/images/warped/curved_shelf_dark_05.png', type: 'local', priority: 'medium' },
      { src: '/images/warped/corner_shelf_light_05.png', type: 'local', priority: 'medium' },
      { src: '/images/warped/corner_shelf_medium_02.png', type: 'local', priority: 'medium' },
      { src: '/images/warped/corner_shelf_medium_07.png', type: 'local', priority: 'medium' }
    ],
    chairs: [
      { src: '/images/collection-chairs.jpg', type: 'local', priority: 'high' }
    ],
    objects: [
      { src: '/images/collection-objects.jpg', type: 'local', priority: 'high' }
    ]
  },
  products: {
    // Local product images using actual paths from public/images/products/
    matis: [
      { src: '/images/products/matis/Product_1_blue.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/matis/Product_1_green.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/matis/Product_1_yellow.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/matis/Product_1_orange.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/matis/Product_1_red.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/matis/Product_1_white.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/matis/Product_1_white_blackgrout.jpg', type: 'local', priority: 'medium' }
    ],
    harper: [
      { src: '/images/products/harper/product_3_main_angle.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/harper/product_3_green_corrected_v3.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/harper/product_3_yellow.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/harper/product_3_orange.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/harper/product_3_red.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/harper/product_3_black.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/harper/product_3_white.jpg', type: 'local', priority: 'medium' }
    ],
    chuck: [
      { src: '/images/products/chuck/product_4_main_angle_blue.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/chuck/product_4_main_angle_green.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/chuck/product_4_main_angle_yellow.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/chuck/product_4_main_angle_orange.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/chuck/product_4_main_angle_red.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/chuck/product_4_main_angle_black.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/chuck/product_4_main_angle_white.jpg', type: 'local', priority: 'medium' }
    ],
    arielle: [
      { src: '/images/products/arielle/Product_2_blue.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/arielle/Product_2_green.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/arielle/Product_2_yellow.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/arielle/Product_2_orange.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/arielle/Product_2_red.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/arielle/Product_2_black.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/arielle/Product_2_white.jpg', type: 'local', priority: 'medium' }
    ],
    saskia: [
      { src: '/images/products/saskia/Blue.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/saskia/green.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/saskia/yellow.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/saskia/orange.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/saskia/red.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/saskia/black.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/saskia/white.jpg', type: 'local', priority: 'medium' }
    ],
    seba: [
      { src: '/images/products/seba/product_6_main_angle_blue.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/seba/product_6_main_angle_green.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/seba/product_6_main_angle_yellow.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/seba/product_6_main_angle_3d.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/seba/product_6_main_angle_red.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/seba/product_6_main_angle_black.jpg', type: 'local', priority: 'medium' },
      { src: '/images/products/seba/product_6_main_angle_white.jpg', type: 'local', priority: 'medium' }
    ]
  },
  misc: [
    { src: '/images/logo_main_small.png', type: 'local', priority: 'low' },
    { src: '/images/logo_main_white_transparent_small.png', type: 'local', priority: 'low' }
  ]
}

// Global registry instance
let registryInstance: ImageRegistry | null = null

// Initialize registry with local images
function initializeLocalImages(): ImageRegistry['localImages'] {
  // Already in the correct format now
  return LOCAL_IMAGES
}

// Fetch and process Shopify product images
async function fetchShopifyImages(): Promise<Map<string, ProductImages>> {
  const shopifyImages = new Map<string, ProductImages>()
  
  try {
    const products = await fetchAllProducts()
    console.log(`📦 Processing ${products.length} Shopify products for image registry`)
    
    products.forEach((product: Product) => {
      const productImages: ProductImages = {
        productId: product.id as string,
        productHandle: product.handle as string,
        productTitle: product.title as string,
        variants: new Map(),
        allImages: []
      }
      
      // Process all product images
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((image: any) => {
          if (image.src) {
            const metadata: ImageMetadata = {
              src: image.src,
              width: image.width,
              height: image.height,
              type: 'shopify',
              priority: 'medium'
            }
            productImages.allImages.push(metadata)
            
            // Try to categorize by color variant
            const altText = (image.altText || '').toLowerCase()
            let color = 'default'
            
            // Check for color keywords
            const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'black', 'white', 'natural', 'birch', 'oak', 'walnut']
            colors.forEach(c => {
              if (altText.includes(c)) {
                color = c
              }
            })
            
            if (!productImages.variants.has(color)) {
              productImages.variants.set(color, [])
            }
            productImages.variants.get(color)!.push(metadata)
          }
        })
      }
      
      // Also process variant images
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
          if (variant.image?.src) {
            const color = variant.title?.toLowerCase() || 'default'
            const metadata: ImageMetadata = {
              src: variant.image.src,
              type: 'shopify',
              priority: 'medium'
            }
            
            if (!productImages.variants.has(color)) {
              productImages.variants.set(color, [])
            }
            
            // Avoid duplicates
            const exists = productImages.variants.get(color)!.some(img => img.src === metadata.src)
            if (!exists) {
              productImages.variants.get(color)!.push(metadata)
              productImages.allImages.push(metadata)
            }
          }
        })
      }
      
      shopifyImages.set(product.handle as string, productImages)
    })
    
    console.log(`✅ Registered ${shopifyImages.size} products with images`)
  } catch (error) {
    console.error('❌ Failed to fetch Shopify images:', error)
  }
  
  return shopifyImages
}

// Main registry initialization
export async function initializeImageRegistry(): Promise<ImageRegistry> {
  if (registryInstance && registryInstance.initialized) {
    console.log('⚡ Using existing image registry')
    return registryInstance
  }
  
  console.log('🎨 Initializing universal image registry...')
  
  // Initialize with local images first
  registryInstance = {
    localImages: initializeLocalImages(),
    shopifyImages: new Map(),
    initialized: false
  }
  
  // Fetch Shopify images and WAIT for them
  try {
    const shopifyImages = await fetchShopifyImages()
    registryInstance.shopifyImages = shopifyImages
    registryInstance.initialized = true
    console.log('✅ Image registry fully initialized with', shopifyImages.size, 'Shopify products')
  } catch (error) {
    console.error('❌ Failed to initialize Shopify images:', error)
    // Still mark as initialized even if Shopify fails
    registryInstance.initialized = true
  }
  
  return registryInstance
}

// Get all images for a specific route
export function getImagesForRoute(pathname: string): {
  immediate: ImageMetadata[]
  delayed: ImageMetadata[]
  onDemand: ImageMetadata[]
} {
  const registry = registryInstance || {
    localImages: initializeLocalImages(),
    shopifyImages: new Map(),
    initialized: false
  }
  
  const result = {
    immediate: [] as ImageMetadata[],
    delayed: [] as ImageMetadata[],
    onDemand: [] as ImageMetadata[]
  }
  
  // Homepage
  if (pathname === '/') {
    // Immediate: Hero and collection previews
    result.immediate.push(...registry.localImages.hero)
    result.immediate.push(...registry.localImages.collections.tiled.slice(0, 1))
    result.immediate.push(...registry.localImages.collections.warped.slice(0, 1))
    result.immediate.push(...registry.localImages.collections.chairs.slice(0, 1))
    result.immediate.push(...registry.localImages.collections.objects.slice(0, 1))
    
    // Delayed: First product from each collection
    registry.shopifyImages.forEach(product => {
      if (product.allImages.length > 0) {
        result.delayed.push(product.allImages[0])
      }
    })
    
    // OnDemand: Rest of collection images
    Object.values(registry.localImages.collections).forEach(images => {
      result.onDemand.push(...images.slice(1))
    })
  }
  
  // Collection pages
  else if (pathname.includes('/collections/')) {
    const collection = pathname.split('/').pop()
    
    // Immediate: Collection hero
    if (collection && registry.localImages.collections[collection]) {
      result.immediate.push(...registry.localImages.collections[collection])
    }
    
    // Debug: Log Shopify images status
    console.log(`📊 Collection ${collection}: Shopify products available: ${registry.shopifyImages.size}`)
    
    // Delayed: All product variants in this collection
    registry.shopifyImages.forEach(product => {
      console.log(`  - Product: ${product.productHandle}, Images: ${product.allImages.length}`)
      // Check if product belongs to this collection (simplified logic)
      if (collection === 'warped' && product.productHandle.includes('shelf')) {
        result.delayed.push(...product.allImages)
      } else if (collection === 'tiled' && (product.productHandle.includes('table') || product.productHandle.includes('matis') || product.productHandle.includes('harper') || product.productHandle.includes('chuck'))) {
        result.delayed.push(...product.allImages)
      }
      // Add more collection logic as needed
    })
  }
  
  // Products listing page
  else if (pathname === '/products') {
    // Immediate: First image of each product
    registry.shopifyImages.forEach(product => {
      if (product.allImages.length > 0) {
        result.immediate.push(product.allImages[0])
      }
    })
    
    // Delayed: All variants
    registry.shopifyImages.forEach(product => {
      result.delayed.push(...product.allImages.slice(1))
    })
  }
  
  // Product detail page
  else if (pathname.includes('/products/')) {
    const handle = pathname.split('/').pop()
    
    if (handle && registry.shopifyImages.has(handle)) {
      const product = registry.shopifyImages.get(handle)!
      // Immediate: All images for this product
      result.immediate.push(...product.allImages)
    }
  }
  
  return result
}

// Get images for specific product
export function getProductImages(handle: string): ProductImages | null {
  if (!registryInstance) return null
  return registryInstance.shopifyImages.get(handle) || null
}

// Get all images of a specific type
export function getImagesByType(type: 'local' | 'shopify' | 'external'): ImageMetadata[] {
  if (!registryInstance) return []
  
  const images: ImageMetadata[] = []
  
  if (type === 'local') {
    // Collect all local images
    images.push(...registryInstance.localImages.hero)
    Object.values(registryInstance.localImages.collections).forEach(coll => {
      images.push(...coll)
    })
    Object.values(registryInstance.localImages.products).forEach(prod => {
      images.push(...prod)
    })
    images.push(...registryInstance.localImages.misc)
  } else if (type === 'shopify') {
    // Collect all Shopify images
    registryInstance.shopifyImages.forEach(product => {
      images.push(...product.allImages)
    })
  }
  
  return images
}

// Export registry instance for debugging
export function getRegistry(): ImageRegistry | null {
  return registryInstance
}