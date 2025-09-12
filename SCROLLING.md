# Scrolling Architecture Documentation

## The Problem We Encountered

When implementing a transparent-to-solid header transition on the Warped collection page (`/collections/warped`), we discovered that standard `window` scroll event listeners weren't firing. After extensive debugging, we found that **the `<body>` element was the actual scrolling container**, not the window.

### Root Cause

The issue stems from the CSS styling on the html/body elements:
- **Document height**: 1146px (same as window height)
- **Body height**: 4850px (actual content height)
- **Body overflow**: `hidden auto` (horizontal hidden, vertical auto)
- **HTML overflow**: `hidden auto`

This configuration means:
1. The `<html>` element is constrained to viewport height
2. The `<body>` element is the scrollable container
3. `window.scrollY` always returns 0
4. Standard `window` scroll listeners don't fire

## How We Fixed It

Instead of relying solely on window scroll events, we now listen to multiple scroll sources:

```javascript
// Check multiple scroll sources
const windowScroll = window.scrollY || window.pageYOffset
const docScroll = document.documentElement.scrollTop
const bodyScroll = document.body.scrollTop
const elementScroll = element ? element.scrollTop : 0

const scrollY = Math.max(windowScroll, docScroll, bodyScroll, elementScroll)
```

We add scroll listeners to:
- `window` (for standard pages)
- `document` (fallback)
- `document.body` (for pages like Warped where body scrolls)
- `document.documentElement` (additional fallback)

## Current Scrolling Architecture

### Different Pages, Different Scroll Behaviors

1. **Standard pages** (Home, Products, etc.):
   - Window/document scrolls normally
   - `window.scrollY` works as expected

2. **Warped collection page** (`/collections/warped`):
   - Body element is the scroll container
   - Must listen to `document.body` scroll events
   - `document.body.scrollTop` provides scroll position

3. **Tiled collection page** (`/collections/tiled`):
   - May have different scroll behavior
   - Our solution handles both cases

## Important Notes for Lenis Integration

**Lenis (smooth scrolling library) typically assumes window-level scrolling.** To make it work with our setup:

### Option 1: Configure Lenis for Body Scrolling
```javascript
const lenis = new Lenis({
  wrapper: document.body,  // Specify body as the wrapper
  content: document.body,  // Or the actual content container
  // ... other options
})
```

### Option 2: Fix the Root CSS Issue
If you want standard window scrolling everywhere (recommended for Lenis):

```css
/* Remove these constraints */
html, body {
  height: auto !important;  /* Instead of 100vh or fixed height */
  overflow-x: hidden;
  overflow-y: auto;  /* Or remove overflow entirely */
}

/* Ensure html can scroll */
html {
  overflow-y: auto;
}
```

### Option 3: Detect Scroll Container Dynamically
```javascript
// Find the actual scrolling element
function getScrollContainer() {
  // Check if body scrolls
  if (document.body.scrollHeight > document.body.clientHeight) {
    const bodyStyle = window.getComputedStyle(document.body)
    if (bodyStyle.overflowY === 'auto' || bodyStyle.overflowY === 'scroll') {
      return document.body
    }
  }
  
  // Check if documentElement scrolls
  if (document.documentElement.scrollHeight > window.innerHeight) {
    return document.documentElement
  }
  
  // Default to window
  return window
}

// Initialize Lenis with the correct container
const scrollContainer = getScrollContainer()
const lenis = new Lenis({
  wrapper: scrollContainer === window ? undefined : scrollContainer,
  // ... other options
})
```

## How to Debug Scroll Issues

1. **Check what's actually scrolling**:
```javascript
console.log('Document height:', document.documentElement.scrollHeight)
console.log('Window height:', window.innerHeight)
console.log('Body height:', document.body.scrollHeight)
console.log('Can window scroll:', document.documentElement.scrollHeight > window.innerHeight)
console.log('Body overflow:', window.getComputedStyle(document.body).overflow)
console.log('HTML overflow:', window.getComputedStyle(document.documentElement).overflow)
```

2. **Find scrollable elements**:
```javascript
document.querySelectorAll('*').forEach(el => {
  if (el.scrollHeight > el.clientHeight) {
    const style = window.getComputedStyle(el)
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      console.log('Scrollable element:', el)
    }
  }
})
```

3. **Test scroll event firing**:
```javascript
// Add listeners to everything
window.addEventListener('scroll', () => console.log('Window scrolled'))
document.addEventListener('scroll', () => console.log('Document scrolled'))
document.body.addEventListener('scroll', () => console.log('Body scrolled'))
document.documentElement.addEventListener('scroll', () => console.log('HTML scrolled'))
```

## Recommendations for Future Development

1. **Standardize scrolling behavior**: Consider making all pages use window-level scrolling for consistency and better library compatibility.

2. **If keeping body scrolling**: Document which pages use which scroll container and update any scroll-dependent libraries accordingly.

3. **For smooth scrolling libraries**: 
   - Always check which element is actually scrolling
   - Configure the library to use the correct scroll container
   - Test on all page types (especially Warped and Tiled collections)

4. **Consider a scroll utility**:
```javascript
// utils/scroll.ts
export function getScrollPosition() {
  return Math.max(
    window.scrollY || 0,
    window.pageYOffset || 0,
    document.documentElement.scrollTop || 0,
    document.body.scrollTop || 0
  )
}

export function getScrollContainer() {
  // Implementation from above
}

export function addScrollListener(callback: () => void) {
  const container = getScrollContainer()
  if (container === window) {
    window.addEventListener('scroll', callback)
  } else {
    container.addEventListener('scroll', callback)
  }
  
  return () => {
    if (container === window) {
      window.removeEventListener('scroll', callback)
    } else {
      container.removeEventListener('scroll', callback)
    }
  }
}
```

## Files Affected

- `/components/Navigation.tsx` - Contains the scroll detection logic
- `/collections/warped` pages - Use body scrolling
- Any future smooth scrolling implementations

## Testing Checklist

When implementing scroll-based features:
- [ ] Test on homepage (standard scrolling)
- [ ] Test on /collections/warped (body scrolling)
- [ ] Test on /collections/tiled
- [ ] Test on /contact
- [ ] Test on mobile devices
- [ ] Verify scroll position detection works
- [ ] Verify scroll events fire properly
- [ ] Check performance (no excessive re-renders)

---

**Last Updated**: January 2025
**Issue**: Scroll events not firing on Warped page due to body being scroll container
**Solution**: Listen to multiple scroll sources including body element