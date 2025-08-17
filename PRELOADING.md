# Image Preloading System Documentation

## Overview

Squarage Studio implements a comprehensive multi-layer image preloading system that ensures instant image loading and smooth color switching across the entire site. This document explains how the preloading works for different collections and page types.

## System Architecture

### Core Components

1. **ImageCacheContext** (`/context/ImageCacheContext.tsx`)
   - Global image caching state management
   - Batch preloading functions
   - Cache hit/miss tracking
   - Performance statistics

2. **Image Optimization Utils** (`/utils/imageOptimizations.ts`)
   - Next.js Image component helpers
   - Performance tracking utilities
   - Responsive image generation

3. **Collection-Specific Preloaders**
   - WarpedProductPage preloading
   - ProductPage (Tiled) preloading
   - Homepage collection preloading

## Preloading Strategies

### 1. Homepage Collection Preloading

**Location**: `/components/CollectionsSection.tsx`

When users land on the homepage, the system automatically starts preloading collection page images in the background:

```javascript
// Triggers 3 seconds after homepage loads
preloadCollectionImages('warped')  // Loads hero + featured images
preloadCollectionImages('tiled')   // Loads hero image (staggered by 1 second)
```

**Images Preloaded**:
- Warped: `/images/collection-warped.jpg` (4MB - hero)
- Warped: `/images/warped/curved_shelf_light_05.png` (2.2MB - featured)
- Tiled: `/images/collection-tiled.jpg` (5.7MB - hero)

**Strategy**: Uses `prefetch` link tags + Image constructor for dual caching

### 2. Warped Collection Product Preloading

**Location**: `/components/WarpedProductPage.tsx`

The Warped collection uses a **triple-strategy aggressive preloading** system:

#### Strategy 1: Browser Link Preloading
```javascript
// Creates <link rel="preload"> tags for first 2 images of each color
link.rel = 'preload'
link.as = 'image'
link.href = shopifyLoader({ src: img.src, width: 600 })
link.setAttribute('fetchpriority', color === 'Birch' ? 'high' : 'low')
```

#### Strategy 2: Native Image Constructor
```javascript
// Forces browser to cache all variant images
const image = new window.Image()
image.src = shopifyLoader({ src: img.src, width: 600 })
```

#### Strategy 3: ImageCache System
```javascript
// Application-level caching with performance tracking
await preloadImageBatch(allImages)
```

**Color Variants**: Birch, Oak, Walnut (5 images each = 15 total)

**Performance**:
- Initial load: All 15 images preload on page mount
- Color switching: <10ms after caching
- Hover prefetch: Additional safety net for uncached images

### 3. Tiled Collection Product Preloading

**Location**: `/components/ProductPage.tsx`

The Tiled collection uses the standard ImageCache system with optimizations:

```javascript
// Preloads all product images including variants
await preloadProductImages(product)
```

**Features**:
- Automatic variant detection from Shopify data
- Color-sorted display (Blue, Green, Yellow, Orange, Red, Black, White)
- Performance tracking with console output
- Cache status indicators

**Performance**:
- Batch size: 6 images processed simultaneously
- No artificial delays (uses requestAnimationFrame)
- Instant color switching after initial load

## Shopify CDN Optimization

### Image Transformation

All Shopify images are automatically optimized using a custom loader:

```javascript
const shopifyLoader = ({ src, width }) => {
  const url = new URL(src)
  url.searchParams.set('width', width.toString())
  url.searchParams.set('format', 'webp')      // 30-50% smaller
  url.searchParams.set('quality', '85')       // Balance quality/size
  return url.toString()
}
```

**Benefits**:
- WebP format: 30-50% smaller than JPEG
- Dynamic sizing: Only loads required resolution
- Quality optimization: 85% quality for main images, 75% for thumbnails

## Performance Metrics

### Console Indicators

The system provides real-time performance feedback:

- `🎨 Starting aggressive Warped image preload...` - Preloading initiated
- `📦 Preloading 15 images with 3 strategies...` - Batch processing
- `✅ Loaded: Oak image` - Individual image cached
- `⚡ INSTANT color switch from Birch to Oak in 2.45ms (cached)` - Cache hit
- `📡 Network load for Walnut in 245.67ms` - Cache miss
- `🔍 Prefetching Oak images on hover...` - Hover prefetch triggered

### Cache Statistics

The ImageCache system tracks:
- Total images in cache
- Cache hit/miss rates
- Failed image loads
- Preloading progress

## Loading Priority

### Priority Levels

1. **Critical (High Priority)**
   - First image of default variant (Birch for Warped, first color for Tiled)
   - Hero images on collection pages
   - Uses `priority={true}` and `loading="eager"`

2. **Important (Medium Priority)**
   - Remaining images of current variant
   - Uses `loading="lazy"` with preload tags

3. **Background (Low Priority)**
   - Other color variants
   - Collection page images from homepage
   - Uses `prefetch` and delayed loading

## Product Grid Preloading

**Location**: `/components/ProductGrid.tsx`

The product grid implements a two-tier strategy:

1. **Visible Products** (First 6): Preloaded immediately
2. **Background Products** (7+): Preloaded with requestAnimationFrame

This ensures the initial view loads instantly while background products load smoothly.

## Mobile Optimizations

### Responsive Loading
- Mobile: `sizes="100vw"` - Full viewport width
- Desktop: `sizes="(max-width: 768px) 100vw, 50vw"` - Adaptive sizing

### Container Sizing
- Mobile: `aspect-square` containers for consistent layout
- Desktop: Fixed 600px containers for large displays

## Troubleshooting

### If Images Load Slowly

1. **Check Console Output**
   - Look for `🐌 SLOW` warnings (>500ms load time)
   - Verify preloading messages appear
   - Check for failed loads (`❌ Failed`)

2. **Verify Cache Status**
   ```javascript
   // In browser console
   getCacheStats()
   // Should show: { totalImages: 45, cachedCount: 42, failedCount: 0 }
   ```

3. **Common Issues**
   - Original images too large (>5MB) - Need source optimization
   - Slow network - Initial download still required
   - Cache cleared - Browser/user cleared cache

### If Color Switching is Slow

1. **Verify Preloading**
   - Check console for "Warped product images preloaded" message
   - Look for cache hit indicators (`⚡ INSTANT`)

2. **Check Image URLs**
   - Ensure Shopify URLs are valid
   - Verify WebP format is being requested

## Configuration

### Batch Sizes
- **WarpedProductPage**: All images at once (aggressive)
- **ProductPage**: 6 images per batch
- **ProductGrid**: 6 visible, rest in background
- **ImageCache**: 6-8 images per batch

### Timeouts
- **Homepage preload delay**: 3000ms (lets critical content load first)
- **Tiled stagger delay**: 1000ms (prevents overload)
- **Hover prefetch**: Immediate (0ms)

### Image Quality
- **Main images**: 85-90% quality
- **Thumbnails**: 75% quality
- **Format**: WebP preferred, JPEG fallback

## Best Practices

### For New Products

1. **Image Naming**: Include color in filename or alt text
2. **Image Size**: Keep originals under 2MB when possible
3. **Aspect Ratio**: Maintain consistent ratios within product

### For New Collections

1. **Add to Homepage Preloader**: Update `CollectionsSection.tsx`
2. **Implement Cache Integration**: Use `useImageCache` hook
3. **Add Performance Tracking**: Include console logging

### Performance Tips

1. **Optimize Source Images**: Compress before uploading to Shopify
2. **Use Appropriate Formats**: WebP for photos, PNG for graphics
3. **Lazy Load Below Fold**: Only eager load critical images
4. **Monitor Cache Hits**: Aim for >80% cache hit rate

## File Size Recommendations

### Current Status (Needs Optimization)
- `collection-warped.jpg`: 4.1MB ⚠️
- `collection-tiled.jpg`: 5.7MB ⚠️
- `curved_shelf_light_05.png`: 2.2MB ⚠️

### Recommended Sizes
- Hero images: <500KB
- Product images: <200KB
- Thumbnails: <50KB

## Future Enhancements

### Planned Improvements

1. **Service Worker**: Offline caching capability
2. **Blur Placeholders**: Low-quality placeholders during load
3. **Intersection Observer**: Viewport-based loading
4. **Image CDN**: Consider Cloudinary/Imgix for advanced optimization

### Monitoring Additions

1. **Real User Metrics**: Track actual user experience
2. **Performance Budgets**: Alert on regression
3. **A/B Testing**: Compare strategies

## Related Documentation

- [Cache System Documentation](./CACHE_SYSTEM_DOCUMENTATION.md)
- [Migration Plan](./MIGRATION_PLAN.md)
- [Claude Integration](./CLAUDE.md)

---

**Last Updated**: January 2025  
**System Status**: ✅ Fully Operational  
**Performance**: <10ms color switching, 3-strategy preloading active