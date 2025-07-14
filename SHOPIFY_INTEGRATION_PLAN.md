# Shopify Integration Plan for Squarage Studio

## UPDATED APPROACH: Custom Collection Pages + Shopify Products

### ✅ Already Implemented:
- **Shopify Storefront API** integration via `shopify-buy` SDK
- **Complete API layer** in `/lib/shopify.ts` with functions for:
  - Fetching products and collections
  - Managing checkout/cart functionality
  - Filtering products by collection and tags
- **TypeScript interfaces** for all Shopify data types
- **Cart context** for state management

### ❌ Missing Configuration:
- **Shopify credentials** need to be set up (currently placeholder tokens)
- **No live products** in the store yet
- **Custom collection pages** not built yet

## New Strategy: Custom Collection Control + Shopify Product Management

### 🎯 Hybrid Approach: Manual Collection Pages + Shopify Products
**Best of both worlds - brand control + easy product management:**

#### 1. Product Management (via Shopify):
- Add products directly in Shopify Admin (`squarage-studio.myshopify.com/admin`)
- Upload product images, descriptions, pricing, inventory
- **Tag products by collection** (tags: "shelves", "tables", "chairs", "objects")
- Set product variants (size, color, finish, etc.)
- Manage availability and stock levels

#### 2. Collection Page Management (Custom Next.js Pages):
- **Custom-designed pages** for each collection with unique layouts
- **Manual control** over branding, storytelling, and page structure
- **Pull Shopify products** into custom layouts via API filtering
- **SEO optimized** with custom meta tags and content per collection

#### 3. Architecture Benefits:
- **Brand Control** - Each collection can have unique personality and design
- **Easy Product Management** - Still get Shopify's inventory/e-commerce benefits
- **Custom Storytelling** - Add videos, custom copy, brand content per collection
- **Better Performance** - Static pages with dynamic product data
- **Scalable** - Add new collections without touching product code

### 🔧 Technical Implementation Plan:

#### File Structure:
```
/app/collections/shelves/page.tsx    # Custom shelves page design
/app/collections/tables/page.tsx     # Custom tables page design  
/app/collections/chairs/page.tsx     # Custom chairs page design
/app/collections/objects/page.tsx    # Custom objects page design
/app/products/page.tsx               # Master products page with filtering
```

#### Product Filtering via Tags:
```typescript
// Example: Shelves collection page
const shelvesProducts = await shopifyApi.getProductsByTag('shelves')

// Master products page with filtering
const allProducts = await shopifyApi.getProducts()
const filteredProducts = filterByCollection(allProducts, selectedCollection)
```

## Why Shopify is Ideal for Squarage Studio

✅ **No technical knowledge needed** - visual interface  
✅ **Inventory management** - automatic stock tracking  
✅ **Payment processing** - secure, PCI compliant  
✅ **Order management** - fulfillment, shipping, taxes  
✅ **SEO optimized** - automatic sitemaps, structured data  
✅ **Mobile optimized** - responsive admin interface  
✅ **Scalable** - handles growth without code changes  

## Implementation Next Steps

### Phase 1: Shopify Store & API Setup
1. Set up your Shopify store with real products
2. **Tag products by collection** (shelves, tables, chairs, objects)
3. Get your Storefront API credentials
4. Update environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SHOPIFY_DOMAIN=squarage-studio.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_actual_token_here
   ```
5. Add `getProductsByTag()` function to `/lib/shopify.ts`

### Phase 2: Custom Collection Pages Development
1. **Build prototype Shelves collection page** (`/app/collections/shelves/page.tsx`)
   - Custom hero section and branding
   - Unique layout and storytelling content
   - Integrate Shopify products via tag filtering
   - Test and refine approach
2. **Scale to remaining collections:**
   - Tables page with custom design
   - Chairs page with custom design  
   - Objects page with custom design
3. **Each page includes:**
   - Custom branding and hero sections
   - Unique content and storytelling
   - Shopify products in custom layouts
   - SEO optimization per collection

### Phase 3: Master Products Page
1. Build `/app/products/page.tsx` with all products
2. Add collection filter buttons (Shelves, Tables, Chairs, Objects)
3. Implement search functionality
4. Add sorting options (price, name, date)

### Phase 4: Individual Product Pages & Cart
1. Create individual product detail pages (`/app/products/[handle]/page.tsx`)
2. Implement shopping cart functionality
3. Add checkout flow integration
4. Configure shipping and payment settings

## Technical Implementation Notes

### Current API Functions Available:
- `getProducts()` - Fetch all products
- `getProductByHandle()` - Get specific product
- `getCollectionByHandle()` - Get collection with products
- `getCollections()` - Get all collections
- `getProductsByCollection()` - Filter products by collection
- `createCheckout()` - Initialize shopping cart
- `addToCheckout()` - Add items to cart
- `updateCheckout()` - Modify cart items
- `removeFromCheckout()` - Remove items from cart

### File Structure:
- `/lib/shopify.ts` - API integration layer
- `/context/CartContext.tsx` - Cart state management
- `.env.local` - Environment configuration
- Future: `/app/products/` - Product listing pages
- Future: `/app/products/[handle]/` - Individual product pages
- Future: `/app/collections/[handle]/` - Collection pages

## Content Management Workflow

### For Dylan (Store Owner):
1. **Adding New Products:**
   - Log into Shopify Admin
   - Add product with images, description, price
   - Assign to appropriate collection
   - Set inventory levels
   - Product automatically appears on website

2. **Managing Collections:**
   - Create/edit collections in Shopify Admin
   - Drag and drop to reorder products
   - Update collection descriptions and images
   - Changes reflect immediately on website

3. **Order Management:**
   - View orders in Shopify Admin
   - Process fulfillment and shipping
   - Handle customer service
   - Track inventory levels

### Benefits for Business:
- **Easy to use** - No coding required for product management
- **Professional e-commerce** - Full payment and order processing
- **Scalable** - Grows with your business
- **SEO optimized** - Products indexed by search engines
- **Mobile friendly** - Works on all devices
- **Secure** - PCI compliant payment processing

---
*Created: July 2025*  
*Status: Planning Phase - Ready for Shopify Store Setup*