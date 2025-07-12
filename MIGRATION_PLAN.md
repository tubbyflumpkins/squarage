# Squarage Studio Website Migration Plan

## Overview
Migrate from Webflow export to a modern, self-hosted website solution with Shopify integration for inventory management, eliminating dependency on Webflow while preserving design aesthetics.

## Technology Stack
- **Frontend Framework**: Next.js 14 with React
- **Styling**: Tailwind CSS for utility-first styling
- **E-commerce**: Shopify integration for inventory and product management
- **Hosting**: Vercel for deployment
- **Version Control**: Git (already initialized)

## Content & Asset Migration

### Text Content
- **About Us Section**: Copy existing text from Webflow export (perfect as-is)
- **Product Names**: Extract product names only (no descriptions yet)
- **Company Information**: Contact details, social links, process descriptions
- **Navigation and UI Text**: Copy all existing copy

### Visual Assets
- **Images**: Copy and optimize all images from `/images` folder
- **Fonts**: Preserve and integrate Neue Haas Grotesk font family (will be pulled/added to project)
- **Logo Assets**: Maintain existing logo variations
- **Icons**: Preserve existing iconography

### Design System Notes
- **Colors**: Will be changed later - don't preserve current color scheme
- **Typography**: Maintain existing typography hierarchy and font usage
- **Spacing**: Document current spacing patterns for recreation

## Core Pages & Features

### Homepage
- **Header**: Small logo positioned at top
- **Hero Section**: 
  - Remove video background entirely
  - Replace with image slideshow of uploadable pictures
  - Maintain hero text and CTA structure
- **Collections Section** (replaces current product list):
  - Display product collections: Tables, Shelves, Chairs
  - Each collection links to filtered product views
  - Separate from main "all products" page
- **Custom Section**: Maintain existing layout and content
- **About Section**: Keep current structure and content

### Products Page
- **Product Grid**: Display all products
- **Collection Filtering**: Add filter by collection (Tables, Shelves, Chairs)
- **Product Cards**: Show product name and images (no descriptions initially)

### Custom Projects Page
- **Process Workflow**: Maintain existing 4-step process showcase
- **Layout**: Keep current alternating image/text layout
- **Content**: Preserve existing process descriptions

### Individual Product Pages
- **Product Details**: Dynamic pages for each product
- **Image Gallery**: Multiple product photos
- **Basic Information**: Name, collection, availability
- **CTA**: Contact for pricing/ordering

### Contact/Forms
- **Contact Information**: Maintain existing contact details
- **Inquiry Forms**: Enhanced forms for general and custom project inquiries
- **Integration**: Connect forms to email system

## Shopify Integration

### Product Management
- **Collections**: Set up Tables, Shelves, Chairs collections in Shopify
- **Product Data**: Sync product names and images
- **Inventory Tracking**: Use Shopify for stock management
- **Pricing**: Handle pricing through Shopify admin

### Content Management
- **Product Updates**: Admin can add/edit products through Shopify
- **Collection Management**: Organize products into collections
- **Image Management**: Upload and manage product photos

## Key Technical Requirements

### Removed Features
- **Custom Cursor**: Remove all branded cursor interactions entirely
- **Video Background**: Replace hero video with image slideshow
- **Webflow Dependencies**: Eliminate all Webflow-specific code

### Preserved Features
- **Responsive Design**: Maintain mobile-first approach
- **GSAP Animations**: Recreate scroll animations and text effects
- **Page Transitions**: Smooth navigation between pages
- **SEO**: Proper meta tags and structured data

### Enhanced Features
- **Collection Navigation**: New collection-based browsing
- **Filtering**: Product filtering by collection
- **Image Slideshow**: Uploadable hero images
- **Admin Interface**: Shopify admin for content management

## Implementation Priority

### Phase 1: Foundation
- Set up Next.js project structure
- Integrate Shopify API
- Set up basic styling with Tailwind CSS
- Add Neue Haas Grotesk font integration

### Phase 2: Core Pages
- Homepage with new hero slideshow and collections
- Products page with collection filtering
- Custom projects page
- Individual product pages

### Phase 3: Shopify Integration
- Connect to Shopify store
- Set up product collections (Tables, Shelves, Chairs)
- Implement product data sync
- Test admin workflow

### Phase 4: Polish & Launch
- Responsive design refinement
- Animation implementation
- SEO optimization
- Performance optimization
- Testing and deployment

## Success Criteria
- ✅ Complete independence from Webflow
- ✅ Shopify-powered inventory management
- ✅ Collection-based product browsing
- ✅ Uploadable hero slideshow
- ✅ Maintained visual design quality
- ✅ Improved admin experience
- ✅ Better performance and SEO

## Progress Tracking

### ✅ Completed
- [x] Migration plan documentation

### 🚧 In Progress
- [ ] Project setup and foundation

### 📋 Planned
- [ ] Content extraction from Webflow
- [ ] Core page development
- [ ] Shopify integration
- [ ] Testing and deployment

---

*Last updated: July 12, 2025*