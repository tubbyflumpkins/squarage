# Shopify Phase 2: Cart and Checkout Implementation Plan

## Overview
This document outlines the implementation plan for Phase 2 of Shopify integration, focusing on cart functionality, checkout process, and test mode capabilities for the Squarage Studio website.

## Current State Analysis

### What's Already Implemented
1. **CartContext** (`/context/CartContext.tsx`)
   - Full cart state management with reducer pattern
   - Methods: `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`
   - Cart open/close state management
   - Checkout initialization and persistence via localStorage
   - Error handling and loading states

2. **Shopify API** (`/lib/shopify.ts`)
   - Shopify Buy SDK client configuration
   - Product fetching methods
   - Checkout creation and management methods
   - Line item add/update/remove functionality

3. **Product Page** (`/components/ProductPage.tsx`)
   - "Add to Cart" button present but not connected
   - Variant selection logic working
   - Color and price display implemented

4. **Current Gaps**
   - CartProvider not integrated in app layout
   - No cart UI component
   - Add to Cart button not connected to cart context
   - No bag icon in navigation
   - No cart drawer/modal component
   - No test mode configuration

## Implementation Plan

### Phase 1: Core Cart Infrastructure (Priority: High)

#### 1.1 Integrate CartProvider
- Add CartProvider to `/app/layout.tsx`
- Wrap the app with CartProvider alongside ImageCacheProvider
- Ensure cart state is available globally

#### 1.2 Create Cart Icon Component
- Add bag icon to navigation (left of hamburger menu)
- Style: Same green box styling as hamburger menu
- Display cart item count badge
- Position: Fixed positioning like existing nav elements

#### 1.3 Connect Add to Cart Functionality
- Import `useCart` hook in ProductPage
- Replace console.log with actual `addToCart` call
- Show success feedback (cart opens automatically)
- Handle loading and error states

### Phase 2: Cart UI Components (Priority: High)

#### 2.1 Create Cart Drawer Component
- Slide-in drawer from right (similar to menu)
- Full-height overlay with click-outside to close
- Responsive width (mobile: full, desktop: 480px max)
- Match existing design language (green background, white text)

#### 2.2 Cart Item Component
- Display product image, title, variant info
- Quantity selector with +/- buttons
- Remove item button
- Price display per item

#### 2.3 Cart Summary
- Subtotal calculation
- "Proceed to Checkout" button
- Empty cart state with CTA
- Loading states for updates

### Phase 3: Checkout Integration (Priority: Medium)

#### 3.1 Shopify Checkout Redirect
- Use checkout URL from cart state
- Open in same tab (standard e-commerce flow)
- Handle checkout completion tracking

#### 3.2 Test Mode Configuration
- Enable Bogus Gateway in Shopify admin
- Configure test credit card numbers
- Document test workflow for team

### Phase 4: API Migration Considerations (Priority: Low)

#### 4.1 JS Buy SDK Deprecation
- Current SDK deprecated January 2025
- Plan migration to Storefront API Client
- Document v3.0 upgrade as interim solution
- Deadline: July 1, 2025

#### 4.2 Future-Proofing
- Abstract Shopify API calls for easier migration
- Keep cart logic separate from API implementation
- Document all Shopify-specific dependencies

## Technical Implementation Details

### Cart Icon Design Specifications
```
- Size: 48x48px (matching hamburger menu)
- Background: squarage-green (#4A9B4E)
- Icon: White bag/shopping icon
- Badge: Orange circle with white number
- Position: Fixed, top-6, right-20 (accounting for menu button)
- Hover: scale-110 transition
```

### Cart State Integration Flow
1. User clicks "Add to Cart" → 
2. Call `addToCart(variantId)` → 
3. API adds to Shopify checkout → 
4. Update local cart state → 
5. Open cart drawer → 
6. Show success state

### Test Purchase Flow
1. Add items to cart
2. Click "Proceed to Checkout"
3. Redirect to Shopify checkout
4. Use test card: 4111 1111 1111 1111
5. Complete test purchase
6. Verify order in Shopify admin

## File Structure Changes

### New Files to Create
- `/components/CartIcon.tsx` - Cart icon with badge
- `/components/CartDrawer.tsx` - Cart sidebar component
- `/components/CartItem.tsx` - Individual cart item
- `/components/CartSummary.tsx` - Cart totals and checkout button

### Files to Modify
- `/app/layout.tsx` - Add CartProvider
- `/components/Navigation.tsx` - Add CartIcon
- `/components/ProductPage.tsx` - Connect add to cart
- `/context/CartContext.tsx` - Minor improvements if needed

## Testing Strategy

### Unit Testing
- Cart context methods
- Price calculations
- Quantity updates

### Integration Testing
- Add to cart flow
- Cart persistence
- Checkout redirect

### E2E Testing
- Full purchase flow with test mode
- Cart abandonment recovery
- Multiple variant handling

## Success Metrics
- Cart functionality works seamlessly
- Test purchases complete successfully
- No console errors or warnings
- Performance: Cart operations < 300ms
- Mobile responsive and accessible

## Timeline Estimate
- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 1-2 hours
- Phase 4: Planning only (future work)

Total: 6-9 hours of implementation

## Next Steps
1. Review and approve this plan
2. Implement Phase 1 (Cart Infrastructure)
3. Build cart UI components
4. Test thoroughly with Shopify test mode
5. Deploy to staging for review