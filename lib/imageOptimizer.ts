'use client'

export interface OptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'original'
  isMobile?: boolean
}

// Detect device and network conditions
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isSlowNetwork: false,
      saveData: false,
      devicePixelRatio: 1
    }
  }
  
  const isMobile = window.innerWidth < 768
  const connection = (navigator as any).connection
  const isSlowNetwork = connection?.effectiveType === '2g' || connection?.effectiveType === '3g'
  const saveData = connection?.saveData || false
  const devicePixelRatio = window.devicePixelRatio || 1
  
  return {
    isMobile,
    isSlowNetwork,
    saveData,
    devicePixelRatio
  }
}

// Optimize image URL based on source type and device
export function optimizeImageUrl(src: string, options: OptimizationOptions = {}): string {
  // Skip optimization for data URLs
  if (src.startsWith('data:')) {
    return src
  }
  
  const deviceInfo = getDeviceInfo()
  const {
    width = deviceInfo.isMobile ? 400 : 800,
    quality = deviceInfo.saveData ? 70 : (deviceInfo.isMobile ? 75 : 85),
    format = 'webp',
    isMobile = deviceInfo.isMobile
  } = options
  
  // LOCAL IMAGES - Keep as-is (already optimized in build)
  if (src.startsWith('/images/')) {
    // Could potentially use Next.js Image API here in the future
    // For now, return as-is
    return src
  }
  
  // SHOPIFY IMAGES - Apply CDN transformations
  if (src.includes('cdn.shopify.com')) {
    try {
      const url = new URL(src)
      
      // Apply responsive width based on device
      const targetWidth = isMobile ? Math.min(width, 600) : width
      url.searchParams.set('width', targetWidth.toString())
      
      // Set format for better compression
      if (format !== 'original') {
        url.searchParams.set('format', format)
      }
      
      // Set quality
      url.searchParams.set('quality', quality.toString())
      
      // Add crop/scale parameters if needed
      if (options.height) {
        url.searchParams.set('height', options.height.toString())
        url.searchParams.set('crop', 'center')
      }
      
      return url.toString()
    } catch (error) {
      console.error('Failed to optimize Shopify URL:', src, error)
      return src
    }
  }
  
  // EXTERNAL IMAGES - Return as-is
  return src
}

// Get optimized srcset for responsive images
export function getResponsiveSrcSet(src: string, options: OptimizationOptions = {}): string {
  // Only generate srcset for Shopify images
  if (!src.includes('cdn.shopify.com')) {
    return ''
  }
  
  const widths = options.isMobile 
    ? [200, 400, 600]
    : [400, 600, 800, 1200]
  
  const srcset = widths.map(w => {
    const url = optimizeImageUrl(src, { ...options, width: w })
    return `${url} ${w}w`
  }).join(', ')
  
  return srcset
}

// Get sizes attribute for responsive images
export function getResponsiveSizes(isMobile: boolean = false): string {
  if (isMobile) {
    return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 400px'
  }
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px'
}

// Batch optimize multiple images
export function batchOptimizeUrls(
  urls: string[], 
  options: OptimizationOptions = {}
): string[] {
  return urls.map(url => optimizeImageUrl(url, options))
}

// Get preload link attributes for an image
export function getPreloadLinkAttributes(src: string, options: OptimizationOptions = {}) {
  const optimizedSrc = optimizeImageUrl(src, options)
  
  return {
    rel: 'preload',
    as: 'image',
    href: optimizedSrc,
    type: options.format === 'webp' ? 'image/webp' : undefined,
    media: options.isMobile ? '(max-width: 768px)' : undefined,
    fetchpriority: options.quality && options.quality > 80 ? 'high' : 'auto'
  }
}

// Calculate optimal dimensions based on container and device
export function calculateOptimalDimensions(
  containerWidth: number,
  aspectRatio: number = 1,
  isMobile: boolean = false
): { width: number; height: number } {
  const deviceInfo = getDeviceInfo()
  const maxWidth = isMobile ? 600 : 1200
  
  // Account for device pixel ratio for retina displays
  const targetWidth = Math.min(
    containerWidth * deviceInfo.devicePixelRatio,
    maxWidth
  )
  
  // Round to nearest 100 for better CDN caching
  const width = Math.ceil(targetWidth / 100) * 100
  const height = Math.round(width / aspectRatio)
  
  return { width, height }
}

// Check if image should be lazy loaded
export function shouldLazyLoad(
  priority: 'high' | 'medium' | 'low' = 'medium',
  isAboveFold: boolean = false
): boolean {
  // High priority or above-fold images should not be lazy loaded
  if (priority === 'high' || isAboveFold) {
    return false
  }
  
  // On slow networks, be more aggressive with lazy loading
  const deviceInfo = getDeviceInfo()
  if (deviceInfo.isSlowNetwork || deviceInfo.saveData) {
    // Since we already returned false for 'high' priority above,
    // at this point priority is either 'medium' or 'low'
    // Lazy load everything except already-handled high priority
    return true
  }
  
  return true
}

// Get loading strategy based on priority and network
export function getLoadingStrategy(
  priority: 'high' | 'medium' | 'low' = 'medium'
): 'eager' | 'lazy' {
  return shouldLazyLoad(priority) ? 'lazy' : 'eager'
}

// Export for debugging
export function getOptimizationStats(): {
  device: ReturnType<typeof getDeviceInfo>
  recommendations: {
    maxWidth: number
    quality: number
    format: string
    lazyLoadThreshold: string
  }
} {
  const device = getDeviceInfo()
  
  return {
    device,
    recommendations: {
      maxWidth: device.isMobile ? 600 : 1200,
      quality: device.saveData ? 70 : (device.isMobile ? 75 : 85),
      format: 'webp',
      lazyLoadThreshold: device.isSlowNetwork ? 'aggressive' : 'normal'
    }
  }
}