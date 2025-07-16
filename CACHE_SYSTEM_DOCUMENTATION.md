# Squarage Studio - Image Cache & Preloading System Documentation

## Overview

This document describes the comprehensive image caching and preloading system implemented for the Squarage Studio website to eliminate loading delays and provide instant color switching on product pages.

## System Architecture

### Core Components

1. **ImageCacheContext** (`/context/ImageCacheContext.tsx`)
2. **CartContext** (`/context/CartContext.tsx`) 
3. **ProductGrid** (`/components/ProductGrid.tsx`)
4. **ProductPage** (`/components/ProductPage.tsx`)
5. **Image Optimization Utils** (`/utils/imageOptimizations.ts`)
6. **Shopify API** (`/lib/shopify.ts`)

## Image Cache System (`ImageCacheContext.tsx`)

### Purpose
Manages global image caching state and provides optimized preloading functions to eliminate the 2-second delay when switching product colors.

### Key Features

#### State Management
```typescript
interface ImageCacheState {
  cachedImages: Set<string>           // URLs of cached images
  loadingImages: Set<string>          // URLs currently loading
  preloadedProducts: Set<string>      // Product IDs fully preloaded
  preloadingProgress: { loaded: number; total: number }
  cacheStats: { totalImages: number; cachedCount: number; failedCount: number }
}
```

#### Optimizations Implemented
- **Ref-based state access**: Uses `cacheStateRef` to avoid setState reading patterns
- **Larger batch sizes**: Increased from 3 to 6 images per batch
- **RequestAnimationFrame**: Replaced setTimeout delays for smoother performance
- **Efficient state updates**: Eliminated multiple setState calls within functions

#### Key Functions
- `preloadProductImages(product)`: Preloads all images for a product
- `preloadImageBatch(imageSrcs)`: Batch preloads array of image URLs
- `isImageCached(src)`: Instantly checks if image is cached
- `isProductPreloaded(id)`: Checks if product is fully preloaded

### Performance Characteristics
- **Batch size**: 6 images processed simultaneously
- **Delay between batches**: `requestAnimationFrame` (0ms effective delay)
- **State access**: Instant via refs (no re-renders)

## Product Grid Preloading (`ProductGrid.tsx`)

### Two-Tier Preloading Strategy

#### Priority 1: Visible Products (Immediate)
```typescript
const visibleProducts = products.slice(0, 6) // First 6 products
// Preloaded immediately with no delay
```

#### Priority 2: Background Products (Non-blocking)
```typescript
const backgroundProducts = products.slice(6)
// Preloaded using requestAnimationFrame for smooth UX
```

### Optimizations Applied
- **Removed 500ms delay**: Background preloading now starts immediately
- **RequestAnimationFrame**: Non-blocking background preloading
- **Console logging**: Detailed progress tracking for debugging

## Product Page Performance (`ProductPage.tsx`)

### Enhanced Color Switching

#### Performance Tracking
```typescript
const handleColorSelect = (variantIndex: number) => {
  const startTime = performance.now()
  // ... switching logic
  console.log(`⚡ INSTANT color switch to ${colorName} in ${switchTime.toFixed(2)}ms (cached)`)
}
```

#### Visual Indicators
- `⚡ INSTANT` - Cached image loaded in <10ms
- `📡 Network load` - Image loaded from network with timing
- `🐌 SLOW` - Warning for loads >500ms
- `❌ Failed` - Error loading image

#### Performance Marks
- Browser performance marks for detailed analysis
- Separate tracking for cached vs network loads

## Cart Persistence System (`CartContext.tsx`)

### Checkout Persistence

#### Before Optimization
- Always created new checkouts
- Lost cart items on page reload/navigation

#### After Optimization
- **Retrieves existing checkouts**: `shopifyApi.getCheckout(checkoutId)`
- **Validates checkout state**: Checks if checkout is still active
- **Fallback creation**: Creates new checkout only if existing one is invalid
- **LocalStorage integration**: Persists checkout ID across sessions

### Implementation
```typescript
const initializeCheckout = async () => {
  const storedCheckoutId = localStorage.getItem('shopify_checkout_id')
  
  if (storedCheckoutId) {
    const existingCheckout = await shopifyApi.getCheckout(storedCheckoutId)
    if (existingCheckout) {
      // Restore existing cart with items
      dispatch({ type: 'SET_CHECKOUT', payload: existingCheckout })
      return
    }
  }
  
  // Create new checkout only if needed
  const checkout = await shopifyApi.createCheckout()
  // ...
}
```

## Image Optimization Utils (`imageOptimizations.ts`)

### Optimizations Applied

#### Cleanup Delays
- **Before**: 1000ms cleanup delay
- **After**: 100ms cleanup delay
- **Impact**: 10x faster DOM cleanup

#### Batch Processing
- **Before**: 50ms setTimeout delays
- **After**: `requestAnimationFrame` for smooth batching
- **Impact**: Non-blocking, frame-aligned processing

#### Performance Monitoring
```typescript
export const trackImagePerformance = (imageSrc: string, startTime: number) => {
  return {
    markLoaded: () => console.log(`Image loaded in ${loadTime}ms`),
    markError: () => console.warn(`Image failed after ${failTime}ms`)
  }
}
```

## Shopify API Extensions (`shopify.ts`)

### Added Checkout Retrieval
```typescript
async getCheckout(checkoutId: string) {
  const checkout = await client.checkout.fetch(checkoutId)
  // Check if checkout is still valid (not completed)
  if (checkout && !checkout.completedAt) {
    return checkout
  }
  return null
}
```

### Error Handling
- **Null checks**: Added comprehensive null filtering in product serialization
- **Graceful fallbacks**: Empty arrays/strings for missing data
- **Type safety**: String conversion with fallbacks for all properties

## Performance Benchmarks

### Before Optimizations
- Color switching: ~2000ms delay
- Background preloading: 500ms+ delay
- Cart persistence: Items lost on reload
- Batch processing: 50-1000ms artificial delays

### After Optimizations
- Color switching: <10ms for cached images
- Background preloading: Immediate start
- Cart persistence: Full restoration across sessions
- Batch processing: Frame-aligned, non-blocking

## Debug Console Output

### Expected Log Messages
```
🎨 Starting color switch to Blue
⚡ INSTANT color switch to Blue in 2.45ms (cached)
🎯 Cache hit for Blue variant
📡 Network load for Red completed in 245.67ms
🐌 SLOW: Yellow took 567.89ms to load
❌ Failed to load Green after 1234.56ms
```

### Performance Marks
- `color-switch-cached-${colorName}`
- `color-switch-network-${colorName}`
- `image-loaded-${imageSrc}`

## Monitoring & Debugging

### Cache Statistics
```typescript
const stats = getCacheStats()
// { totalImages: 45, cachedCount: 32, failedCount: 1 }
```

### Performance Analysis
1. **Console logs**: Real-time performance feedback
2. **Browser DevTools**: Performance marks and measures
3. **Cache hit rates**: Track effectiveness of preloading
4. **Network timing**: Identify slow-loading images

## Configuration

### Batch Sizes
- **ImageCacheContext**: 6 images per batch
- **ProductGrid**: 6 visible products prioritized
- **Image Utils**: 8 images per batch

### Timing
- **Cleanup delay**: 100ms
- **Batch delays**: `requestAnimationFrame` (0ms effective)
- **Performance warning threshold**: 500ms

## Troubleshooting

### If Color Switching is Still Slow
1. Check console for cache hit/miss indicators
2. Verify preloading is starting early enough
3. Look for `🐌 SLOW` warnings indicating network bottlenecks
4. Check if images are being properly cached

### If Cart Items Disappear
1. Verify `shopify_checkout_id` in localStorage
2. Check console for checkout retrieval logs
3. Ensure Shopify credentials are configured
4. Verify checkout hasn't expired (Shopify 3-day limit)

### If Preloading Isn't Working
1. Check `getCacheStats()` output
2. Verify products have valid image URLs
3. Look for failed image loads in console
4. Check network tab for actual image requests

## Future Enhancements

### Potential Improvements
1. **Service Worker**: Offline caching capability
2. **WebP/AVIF**: Modern image format optimization
3. **Intersection Observer**: Load images when entering viewport
4. **Memory management**: Clear cache when memory pressure is high
5. **Analytics integration**: Track cache performance metrics

### Monitoring Additions
1. **Real User Monitoring**: Track actual user experience
2. **Error reporting**: Automated failed load tracking
3. **Performance budgets**: Alert on regression
4. **A/B testing**: Compare cache strategies

## Code Organization

### Context Providers
Both ImageCacheProvider and CartProvider should wrap the app in `layout.tsx`:

```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ImageCacheProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ImageCacheProvider>
      </body>
    </html>
  )
}
```

### Usage Patterns
```typescript
// In any component
const { preloadProductImages, isImageCached } = useImageCache()
const { state, addToCart } = useCart()
```

## Maintenance Notes

### Regular Tasks
1. **Monitor cache hit rates**: Should be >80% for good UX
2. **Check performance logs**: Watch for degradation
3. **Update batch sizes**: Adjust based on user feedback
4. **Review Shopify checkout expiration**: Handle expired checkouts gracefully

### Version Dependencies
- Next.js 15+: For app router and Image component
- Shopify Buy SDK: For checkout management
- React 18+: For concurrent features

---

**Last Updated**: December 2024  
**System Status**: ✅ Optimized and Production Ready  
**Performance**: Color switching <10ms, Cart persistence active