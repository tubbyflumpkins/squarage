# Universal Image Preloading System Documentation

## Overview

Squarage Studio uses a simplified universal image preloading system that ensures instant image loading across the entire site, with special optimizations for mobile devices. This document explains the new streamlined approach.

## Why We Changed

The previous system was overcomplicated with:
- 3 different preloading strategies that could conflict
- React Context-based caching that didn't survive navigation
- Collection-specific logic that was hard to maintain
- Poor mobile performance with 1-2 second delays

## The New Universal System

### Core Philosophy
**"Preload everything accessible from the current page"**

Instead of complex collection-specific logic, we now aggressively preload ALL images that could be accessed from the current location. With only 77 images totaling 49MB, this approach is both simple and effective.

### Architecture

#### 1. Universal Preloader Component
**Location**: `/components/UniversalPreloader.tsx`

- Runs on every page via the root layout
- Determines what to preload based on current pathname
- Uses a single, consistent preloading strategy

#### 2. Core Preloading Library
**Location**: `/lib/universalImagePreloader.ts`

Key features:
- Global `window.__imageCache` that persists across navigation
- Single `Image()` constructor approach (works everywhere)
- Mobile-optimized with automatic size reduction
- Batch loading with concurrency control

### How It Works

#### On Homepage (`/`)
```javascript
// Preloads ALL 77 images in the site
// High priority: Hero images, collection previews
// Low priority: Product variants, gallery images
```

#### On Collection Pages (`/collections/*`)
```javascript
// Preloads all products in that specific collection
// Includes all color variants for each product
```

#### On Product Pages (`/products/*`)
```javascript
// Images already visible, no additional preloading needed
// Cache already warm from previous page
```

## Mobile Optimizations

The system automatically detects mobile devices and applies optimizations:

### 1. Smaller Images
- Mobile: 400px width
- Desktop: 600-1200px width

### 2. Reduced Concurrency
- Mobile: 3 concurrent loads
- Desktop: 8 concurrent loads

### 3. Staggered Loading
- High priority images load immediately
- Low priority images load after 2 second delay

### 4. Memory Management
```javascript
// Force images into memory on mobile
if (isMobile && img.decode) {
  img.decode().catch(() => {})
}
```

## Performance Metrics

### Desktop Performance
- Initial load: ~2-3 seconds for all 77 images
- Color switching: <10ms (instant)
- Navigation: Instant (images already cached)

### Mobile Performance
- Initial load: ~4-5 seconds for high priority
- Color switching: <50ms (near instant)
- Navigation: Instant after initial cache

## Implementation Details

### Global Cache Structure
```javascript
window.__imageCache = Map<string, HTMLImageElement>
window.__imageCacheStats = {
  total: number,
  loaded: number,
  failed: number,
  startTime: number
}
```

### Cache Key Format
```javascript
const cacheKey = `${imageSrc}_${width}`
// Example: "/images/hero-1.jpg_1200"
```

### Shopify CDN Optimization
```javascript
// Automatic WebP conversion with quality settings
url.searchParams.set('format', 'webp')
url.searchParams.set('quality', '85')
url.searchParams.set('width', targetWidth)
```

## Usage in Components

### Checking Cache Status
```javascript
// Check if image is cached
const isMobile = window.innerWidth < 1024
const cacheKey = `${imageSrc}_${isMobile ? 400 : 600}`
const isCached = window.__imageCache?.has(cacheKey)
```

### Manual Preloading (if needed)
```javascript
import { preloadImages } from '@/lib/universalImagePreloader'

const images = [
  { imageSrc: '/images/product.jpg', width: 600, priority: 'high' }
]
await preloadImages(images)
```

## Benefits of the New System

1. **Simplicity**: One system, one strategy, easy to understand
2. **Persistence**: Cache survives navigation using global window object
3. **Mobile-First**: Automatic optimizations for mobile devices
4. **Performance**: True instant switching after initial load
5. **Maintainability**: No collection-specific logic to maintain

## Debugging

### Console Output
The system provides detailed console logging:
```
🌐 Universal Preloader: Starting aggressive preload from /
📱 Device: Mobile
🔥 Preloading 10 high-priority images...
✅ Preloading complete in 2341ms
📊 Cache status: 77 images, 75 loaded, 2 failed
```

### Cache Statistics
```javascript
import { getCacheStats } from '@/lib/universalImagePreloader'

const stats = getCacheStats()
// { cacheSize: 77, stats: {...}, uptime: 12345 }
```

### Clearing Cache (for testing)
```javascript
import { clearImageCache } from '@/lib/universalImagePreloader'
clearImageCache() // Clears all cached images
```

## Migration Notes

### Removed Systems
- `ImageCacheContext` - No longer needed
- Collection-specific preloaders - Replaced by universal system
- Link tag preloading - Doesn't work reliably on mobile
- Service worker caching - Too complex for this use case

### Components Updated
- `WarpedProductPage` - Simplified to use global cache
- `ProductPage` - Simplified to use global cache
- `CollectionsSection` - No longer needs manual preloading
- Root layout - Now includes UniversalPreloader

## Future Improvements

Potential optimizations if needed:
1. Progressive JPEG/WebP for even faster initial display
2. Intersection Observer for viewport-based loading
3. Local storage persistence for offline support
4. Bandwidth detection for quality adjustment

## Summary

The new universal preloading system is dramatically simpler while providing better performance, especially on mobile devices. By preloading everything upfront and using a persistent global cache, we ensure instant navigation and color switching throughout the entire site.