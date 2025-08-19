# Image Preloading System Documentation

## Overview

**Last Updated: January 2025**

Squarage Studio uses a **simple, direct preloading system** that ensures instant image loading and color switching across the entire site. After extensive testing, we've moved from a complex multi-layered approach to a straightforward system that actually works.

## The Simple System

### Core Components

#### 1. SimplePreloader Component
**Location**: `/components/SimplePreloader.tsx`

The main orchestrator that:
- Preloads local images based on current route
- Fetches and caches Shopify products globally
- Preloads on hover for instant navigation
- Handles both local and Shopify images

#### 2. Simple Preloader Library
**Location**: `/lib/simplePreloader.ts`

Direct preloading functions:
- `preloadImage(src)` - Preloads a single image
- `preloadImages(srcs, maxConcurrent)` - Batch preload with concurrency
- `preloadForPage(pathname)` - Route-based preloading
- Global cache: `window.__simpleImageCache`

#### 3. Shopify Preloader
**Location**: `/lib/shopifyPreloader.ts`

Handles Shopify-specific images:
- `fetchAndCacheShopifyProducts()` - Fetches all products once
- `preloadShopifyCollection(collection)` - Preloads collection images
- `preloadShopifyProduct(handle)` - Preloads product variants
- Global cache: `window.__shopifyProducts`

#### 4. FastProductImage Component
**Location**: `/components/FastProductImage.tsx`

**Critical for instant color switching**:
- Uses native `<img>` for cached images (instant)
- Falls back to Next.js Image for uncached images
- Automatically detects cache status
- Bypasses Next.js optimization overhead

## How It Works

### Route-Based Preloading

#### Homepage (`/`)
```javascript
// Local images preloaded immediately
'/images/hero-2-processed.jpg'
'/images/IMG_0961.jpg'
'/images/collection-tiled.jpg'
'/images/collection-warped.jpg'

// Shopify products fetched for later use
await fetchAndCacheShopifyProducts()
```

#### Collection Pages (`/collections/tiled`)
```javascript
// Collection hero image
'/images/collection-tiled.jpg'

// All product variants for the collection
'/images/products/harper/product_3_*.jpg'
'/images/products/matis/Product_1_*.jpg'
'/images/products/chuck/product_4_*.jpg'

// Shopify images for the collection
await preloadShopifyCollection('tiled')
```

#### Product Pages (`/products/[handle]`)
```javascript
// All color variants preloaded immediately
await preloadShopifyProduct(productHandle)

// Local product images if applicable
'/images/products/[product]/*.jpg'
```

### Instant Color Switching

The key to instant color switching is **FastProductImage**:

```javascript
// Instead of this (slow):
<Image 
  src={imageSrc}
  alt={alt}
  fill
  priority={true}
/>

// Use this (instant):
<FastProductImage
  src={imageSrc}
  alt={alt}
  width={600}
  height={600}
  className="..."
/>
```

FastProductImage automatically:
1. Checks if image is in cache
2. Uses native `<img>` for cached (instant render)
3. Uses Next.js Image only for uncached images

## Implementation Guide

### Adding Images to a New Page

1. **Update Simple Preloader Routes**:
```javascript
// In /lib/simplePreloader.ts
else if (pathname === '/your-new-page') {
  images.push(
    '/images/your-image-1.jpg',
    '/images/your-image-2.jpg'
  )
}
```

2. **Use FastProductImage for Dynamic Images**:
```javascript
import FastProductImage from '@/components/FastProductImage'

<FastProductImage
  src={dynamicImageSrc}
  alt="Product image"
  width={600}
  height={600}
  className="object-contain"
/>
```

3. **Handle Shopify Products**:
```javascript
// In SimplePreloader.tsx
else if (pathname === '/your-new-page') {
  await fetchAndCacheShopifyProducts()
  // or
  await preloadShopifyCollection('your-collection')
}
```

### Adding a New Product

1. **Local Images**: Add to `/public/images/products/[product-name]/`

2. **Update Preloader**:
```javascript
// In /lib/simplePreloader.ts
else if (pathname === '/products/your-product') {
  images.push(
    '/images/products/your-product/variant-1.jpg',
    '/images/products/your-product/variant-2.jpg',
    // ... all variants
  )
}
```

3. **Use FastProductImage in Component**:
```javascript
<FastProductImage
  src={product.images[selectedIndex].src}
  alt={product.title}
  width={600}
  height={600}
  className="w-full h-auto"
/>
```

## Performance Metrics

### Actual Performance
- **Initial page load**: ~2-3s (with preloading)
- **Subsequent navigation**: <20ms (from cache)
- **Color switching**: <1ms (instant with FastProductImage)
- **Mobile**: Similar performance with smaller images

### Console Output
```
🚀 SimplePreloader: Starting for /
📦 Preloading 10 images...
✅ Preloaded: /images/hero-2-processed.jpg
🛍️ Fetching Shopify products...
✅ Loaded 7 Shopify products
📸 Found 84 Shopify images to preload
```

## Debugging

### Browser Console
All preloading happens client-side. Check browser console (F12) for:
- Preloading messages
- Cache hits/misses
- Performance timing

### Common Issues

#### Images Still Loading Slowly
1. **Check if using FastProductImage**: Regular Image component adds overhead
2. **Verify preloading**: Check console for preload messages
3. **Check image paths**: Ensure paths match exactly

#### Color Switching Slow Despite Cache
**Solution**: Must use FastProductImage component:
```javascript
// Replace all product Image components with:
<FastProductImage ... />
```

#### Shopify Images Not Preloading
1. **Check credentials**: Verify NEXT_PUBLIC_SHOPIFY_* env vars
2. **Check console**: Look for Shopify fetch errors
3. **Verify products exist**: Check Shopify admin

## Best Practices

### DO's
- ✅ Always use `FastProductImage` for product images
- ✅ Preload images one click away from current page
- ✅ Use hover preloading for navigation links
- ✅ Keep image dimensions consistent per context

### DON'Ts
- ❌ Don't use regular `Image` component for frequently-switched images
- ❌ Don't preload everything at once (wastes bandwidth)
- ❌ Don't forget to update preloader when adding new images
- ❌ Don't use complex state management for image caching

## Migration from Old System

If migrating from the complex NavigationAwarePreloader:

1. **Replace in layout.tsx**:
```javascript
// Old
import NavigationAwarePreloader from '@/components/NavigationAwarePreloader'

// New
import SimplePreloader from '@/components/SimplePreloader'
```

2. **Update product components**:
```javascript
// Replace Image with FastProductImage
import FastProductImage from '@/components/FastProductImage'
```

3. **Remove old files**:
- `/components/NavigationAwarePreloader.tsx`
- `/lib/universalImageRegistry.ts`
- `/lib/navigationPreloader.ts`
- `/lib/imageOptimizer.ts`

## Summary

The new simple preloading system:
- **Direct approach**: No complex abstractions
- **Actually works**: Images truly preload and render instantly
- **Easy to debug**: Clear console output
- **Performant**: <1ms color switching
- **Maintainable**: Simple to add new images/pages

Key insight: **FastProductImage is critical** - it bypasses Next.js Image optimization for cached images, enabling true instant rendering.