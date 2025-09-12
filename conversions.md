# Product Page Conversion Optimization

## Project Overview
Implementing conversion-focused updates to single product pages for both Tiled and Warped collections.

## Current Status
- Branch: `conversions` (from staging)
- Started: January 2025
- Focus: Increase conversion rate from visitors to customers

## Key Requirements

### 1. Variant Selection Redesign
- **Current**: Color swatches below image (Tiled), dropdown (Warped)
- **New**: Toggleable button grid in product details section
  - **Tiled**: "Color" variants (Blue, Green, Yellow, Orange, Red, Black, White)
  - **Warped**: "Finish" variants (Birch, Oak, Walnut)
- Buttons show variant name, selected state highlighted
- Updates product image on selection

### 2. Above-the-Fold Section
- Product title (e.g., "The Matis")
- **NEW**: Collection subtitle with link (e.g., "Part of the [Tiled Collection](/collections/tiled)")
- Price display
- Variant picker buttons
- Lead time: "Made to order in Los Angeles. Ships in 2–3 weeks."
- Shipping estimator with ZIP input
- Primary Add to Cart button
- Express checkout (Shop Pay, Apple Pay)
- Sticky ATC bar on scroll

### 3. Key Info Block
- Product description (2 lines)
- Specifications grid:
  - Dimensions (from metafields)
  - Materials (plywood + mosaic tile + grout for Tiled)
  - Care instructions
  - Assembly info
  - Warranty (30-day returns, 1-year workmanship)

### 4. Detailed Content Section
- FAQ Accordion (5-7 items):
  - Lead times & rush options
  - Custom sizes/colors process
  - Shipping/white-glove delivery
  - Returns & damages
  - Tile durability/grout sealing
- In the box section

### 5. Trust Signals & UX
- Security badges near checkout
- "Handmade in Los Angeles" badge
- Accepted payment icons
- Policy links (open in drawer)
- Inline error handling

## Technical Architecture

### Existing Components to Preserve
- `FastProductImage` - Required for performance
- `CartContext` - Shopping cart integration
- Preloading system - Critical for <1ms performance

### Created Components
1. ✅ `StickyAddToCart.tsx` - Sticky bar component
2. ✅ `ShippingEstimator.tsx` - ZIP code calculator
3. ✅ `ProductFAQ.tsx` - Accordion FAQ
4. ✅ `ProductDetailsAccordion.tsx` - Expandable details sections (replaced ProductSpecs)
5. ⏳ `ExpressCheckout.tsx` - Shop Pay/Apple Pay (pending Shopify integration)
6. ⏳ `PolicyDrawer.tsx` - Policy viewer (future enhancement)

### Files to Modify
1. `ProductPage.tsx` - Complete redesign for Tiled
2. `WarpedProductPage.tsx` - Apply same changes
3. Update preloader paths if new images added

## Implementation Progress

### Completed Tasks ✅
1. ✅ Analyzed current Tiled product page implementation
2. ✅ Analyzed current Warped product page implementation
3. ✅ Created conversions.md documentation
4. ✅ Created ProductFAQ component with collection-specific content
5. ✅ Created ShippingEstimator with ZIP code calculator
6. ✅ Created StickyAddToCart component with mobile/desktop views
7. ✅ Created ProductSpecs component with dynamic specs
8. ✅ Redesigned ProductPage with new toggleable variant selector
9. ✅ Added collection subtitle with clickable link
10. ✅ Updated WarpedProductPage with same conversion features
11. ✅ Added trust signals and security badges
12. ✅ Installed @heroicons/react for icons

### In Progress 🔄
- Testing mobile responsiveness and interactions

### Pending Tasks ⏳
- Add express payment options (Shop Pay/Apple Pay) - requires Shopify integration
- Test with real Shopify data

### Latest Updates
- Removed missing payment method image references
- Updated trust badge area to show "Checkout powered by Shopify"
- Made both ProductPage and WarpedProductPage consistent
- **Updated Tiled collection image display**: Now shows only the image for the selected color variant (similar to Warped collection)
- Each color variant shows its specific image only (typically 1 image per color for Tiled products)
- **Reorganized product details**: Created expandable accordion sections for Dimensions, Details, Responsible Design, and Care
- **Moved FAQ section**: On desktop, FAQ now appears below the two-column layout (after scrolling past the sidebar)
- **Replaced ProductSpecs component** with new ProductDetailsAccordion for better UX
- **Simplified secure payment disclaimer**: Removed large trust badge box, replaced with subtle one-line text under Add to Cart button

## Important Notes

### Shopify Integration
- Products have variants with different IDs
- Tiled products use color-based variants
- Warped products use wood finish variants
- Metafields store custom data (dimensions, etc.)
- Must maintain variant ID mapping for cart

### Performance Considerations
- MUST use `FastProductImage` component
- Update `/lib/simplePreloader.ts` for new images
- Test on mobile AND desktop
- Maintain <1ms color switching

### Design Language
- Colors: Cream (#fffaf4), Orange (#ff962d)
- Font: Neue Haas Grotesk
- Mobile-first responsive design
- Clean, minimal aesthetic

## What's Been Implemented

### Major Changes to Both Product Pages:

1. **New Variant Selector**
   - Toggleable button grid instead of swatches/dropdown
   - Shows color/finish name with visual indicator
   - Selected state clearly highlighted with orange border

2. **Collection Subtitle**
   - Added "Part of the [Collection Name]" under title
   - Clickable link to collection page
   - Works for both Tiled and Warped collections

3. **Above-the-Fold Improvements**
   - Clean title presentation
   - Price prominently displayed
   - Lead time notice ("Made to order • Ships in X weeks")
   - Shipping estimator with ZIP code input
   - Trust badges below Add to Cart button

4. **Sticky Add to Cart Bar**
   - Appears when main button scrolls out of view
   - Shows product image, name, selected variant, price
   - Mobile and desktop optimized layouts

5. **Product Specifications**
   - Grid layout with icons
   - Dynamic specs based on product type
   - Care instructions included
   - Assembly and warranty info

6. **FAQ Accordion**
   - Collection-specific questions
   - 7 FAQs per collection type
   - Smooth expand/collapse animations

7. **Trust Signals**
   - Security badges
   - "Handmade in Los Angeles" messaging
   - Payment method indicators
   - SSL secure checkout badges

## Testing Checklist
- [ ] Test on mobile devices (iOS/Android)
- [ ] Test variant selection and image switching
- [ ] Test shipping estimator with various ZIP codes
- [ ] Test sticky cart bar scroll behavior
- [ ] Test FAQ accordion interactions
- [ ] Test with real Shopify product data
- [ ] Verify cart addition works correctly
- [ ] Check page load performance