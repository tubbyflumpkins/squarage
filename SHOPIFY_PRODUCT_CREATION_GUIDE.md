# Shopify Product Creation Guide

## Overview
This guide documents how to create products programmatically for Squarage Studio's Shopify integration.

## Environment Setup

### Required Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SHOPIFY_DOMAIN=squarage.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=38174a3c7fd8e69285fd1fab3ada0f3f
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_[your_admin_token]
```

### Important Notes
- **Admin Domain**: Use `jgy1w1-3m.myshopify.com` for Admin API calls
- **Storefront Domain**: Use `squarage.myshopify.com` for customer-facing site
- **Sales Channel**: Products MUST be published to "Squarage Website" channel

## Product Creation Process

### 1. Create Products via Admin API

```javascript
const adminDomain = 'jgy1w1-3m.myshopify.com'; // Use actual myshopify domain
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const productData = {
  product: {
    title: 'Product Name',
    body_html: '<p>Product description</p>',
    vendor: 'Squarage Studio',
    product_type: 'Furniture',
    tags: 'tiled, furniture, handcrafted',
    status: 'active',
    variants: [{
      price: '400.00',
      inventory_quantity: 10,
      inventory_management: 'shopify'
    }]
  }
};

// Create product
const response = await fetch(`https://${adminDomain}/admin/api/2024-01/products.json`, {
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': adminToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(productData)
});
```

### 2. Add to Collection

```javascript
// Add product to Tiled collection
const collect = {
  collect: {
    product_id: productId,
    collection_id: tiledCollectionId
  }
};

await fetch(`https://${adminDomain}/admin/api/2024-01/collects.json`, {
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': adminToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(collect)
});
```

### 3. CRITICAL: Publish to Sales Channel

**Products created via API are NOT automatically visible to the Storefront API!**

#### Manual Steps Required:
1. Go to Shopify Admin (squarage.myshopify.com/admin)
2. Navigate to Products
3. Select the products you created
4. Click "More actions" → "Add products to sales channel"
5. Select **"Squarage Website"** (NOT "Online Store")
6. Click "Add products"

#### Why This Matters:
- The Storefront API token is linked to the "Squarage Website" sales channel
- Products must be published to this specific channel to be visible
- This is a manual step that cannot be automated without additional API permissions

## Product Structure for Tiled Collection

### Standard Product Fields
- **Name**: "The [Name]" (e.g., "The Harper", "The Matis")
- **Type**: "Furniture"
- **Vendor**: "Squarage Studio"
- **Tags**: "tiled, furniture, handcrafted, made-to-order"

### Pricing
- The Matis: $400
- The Seba: $400
- The Harper: $450
- The Arielle: $500
- The Chuck: $650
- The Saskia: $500

### Color Variants
Standard colors available:
- Black
- Blue
- Green
- Orange
- Red
- White
- Yellow

### Image Organization
Images stored in: `/Tiled_pics/[product_name]/edited/`
- Use edited JPG versions for web
- Main product image: `product_[number]_main_angle.jpg`
- Color variants: `product_[number]_[color].jpg`

## Troubleshooting

### Products Not Showing on Website
1. **Check Sales Channel**: Ensure products are published to "Squarage Website"
2. **Verify Domain**: Storefront API uses `squarage.myshopify.com`
3. **Restart Dev Server**: After environment changes
4. **Check Collection**: Ensure products are added to correct collection

### API Errors
- **401 Unauthorized**: Check admin token is correct
- **Products return empty**: Check sales channel publishing
- **Domain confusion**: Admin API uses `jgy1w1-3m.myshopify.com`, Storefront uses `squarage.myshopify.com`

## Complete Example Script

```javascript
// See create-products-final.js for full implementation
// Key points:
// 1. Use correct admin domain for API calls
// 2. Create products with proper structure
// 3. Add to collections programmatically
// 4. MANUALLY publish to "Squarage Website" sales channel
```

## Future Improvements

To fully automate, would need:
1. `write_publications` API scope
2. Access to sales channel API
3. Ability to publish products programmatically to "Squarage Website" channel

Until then, manual publishing step is required after programmatic creation.