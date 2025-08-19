# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Image Handling

**When working with images in this codebase:**
1. **ALWAYS consult [PRELOADING.md](./PRELOADING.md) first**
2. **ALWAYS use `FastProductImage` component for product images** (never regular `Image`)
3. **ALWAYS update `/lib/simplePreloader.ts` when adding new images**
4. **NEVER use Next.js `Image` component for frequently-switched images**

The preloading system is critical for performance. Incorrect implementation will cause slow image loading.

## Project Overview

This is **Squarage Studio**, a custom Next.js website for an LA-based design studio creating functional art and design pieces. The project migrated from Webflow to a custom Next.js solution with Shopify integration for e-commerce functionality.

## Architecture

This is a **modern Next.js 15 application** with the following structure:

### Core Framework
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** for styling with custom font integration
- **Shopify Buy SDK** for e-commerce functionality
- **Swiper.js** for hero image slideshow
- **React Context** for cart state management

### Project Structure
```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles and font imports
├── components/            # React components
│   ├── HeroSlideshow.tsx  # Homepage hero with image slideshow
│   ├── Navigation.tsx     # Main navigation and mobile menu
│   ├── CollectionsSection.tsx # Collections showcase
│   └── AboutSection.tsx   # About section
├── lib/
│   └── shopify.ts         # Shopify API integration
├── context/
│   ├── CartContext.tsx    # Shopping cart state management
│   └── ImageCacheContext.tsx # Image preloading and caching
├── public/
│   ├── images/            # Product photos, logos, assets
│   └── fonts/             # Neue Haas Grotesk font family
├── MIGRATION_PLAN.md      # Detailed migration documentation
├── PRELOADING.md          # Image preloading system documentation
└── CACHE_SYSTEM_DOCUMENTATION.md # Cache system details
```

### Key Features Implemented
- **Homepage**: Hero slideshow (replaced video), collections showcase, about section
- **Navigation**: Fixed nav with full-screen overlay menu
- **Typography**: Complete Neue Haas Grotesk font integration
- **E-commerce**: Shopify API setup with cart context
- **Responsive Design**: Mobile-first approach with Tailwind
- **Product Catalog**: 6+ real products with professional photography
- **Collection Pages**: Custom-designed pages (Tiled, Warped, Chairs, Objects)
- **Contact System**: Full email integration via Zoho SMTP
- **Mobile Optimization**: Complete responsive design across all components
- **Image Preloading**: Comprehensive multi-strategy preloading system (see [PRELOADING.md](./PRELOADING.md))

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Development Workflow
- **Local Development**: `npm run dev` serves on http://localhost:3000
- **Environment Variables**: Configure Shopify credentials in `.env.local`
- **Asset Management**: Images stored in `public/images/`, fonts in `public/fonts/`

## Styling Architecture

### Design System
- **Colors**: 
  - Cream background: `#fffaf4` 
  - Orange accent: `#ff962d`
  - Orange light: `#f7a24d`
- **Typography**: Neue Haas Grotesk font family with multiple weights
- **Layout**: CSS Grid and Flexbox with Tailwind utilities
- **Animations**: CSS transitions and Swiper.js for slideshow

### Font Configuration
- **Local Fonts**: Self-hosted Neue Haas Grotesk (all weights)
- **Font Display**: `swap` for performance
- **Tailwind Integration**: Custom font families in `tailwind.config.ts`

## Shopify Integration

### Configuration
- **Client**: `shopify-buy` SDK with TypeScript support
- **API Version**: 2024-10
- **Environment Variables**: 
  - `NEXT_PUBLIC_SHOPIFY_DOMAIN`
  - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`

### E-commerce Features
- Product fetching and display
- Collection-based navigation (Tables, Shelves, Chairs)
- Shopping cart with context state management
- Checkout integration ready

## Content Strategy

### Collections Focus
The site organizes products into four main collections:
- **Tiled**: Custom dining and coffee tables (primary collection)
- **Shelves**: Floating and modular shelving systems  
- **Chairs**: Ergonomic seating with distinctive design
- **Objects**: Decorative and functional design pieces

### Real Product Catalog
**Ready-to-Deploy Products** (with professional photography):
- **The Matis**: Coffee table with 8 color variants
- **The Harper**: Dining table with 7 color variants + gallery images
- **The Chuck**: Coffee table with 7 color variants
- **The Arielle**: Side table with 7 color variants  
- **The Saskia**: Accent table with 7 color variants
- **The Seba**: Modern table with 7 color variants + 3D renders

All products have professional photography stored in `/public/images/products/[product-name]/`

### Brand Messaging
- **Tagline**: "Functional Art & Design"
- **Location**: "Made in Los Angeles"
- **Focus**: Custom furniture, quality craftsmanship, local production
- **Contact**: squaragestudio@gmail.com, @squaragestudio

## Migration Context

### From Webflow
- **Original**: Static HTML export from Webflow CMS
- **Current**: Custom Next.js with TypeScript and Shopify
- **Key Changes**: 
  - Replaced video background with image slideshow
  - Removed custom cursor interactions
  - Integrated Shopify for inventory management
  - Preserved fonts, content, and visual design approach

### Implementation Status (UPDATED January 2025)
1. ✅ Homepage with slideshow - **COMPLETED**
2. ✅ Products page with collection filtering - **COMPLETED**
3. ✅ Custom projects page (4-step process) - **COMPLETED**
4. ✅ Individual product pages (dynamic) - **COMPLETED**
5. ✅ Contact/inquiry forms - **COMPLETED**
6. ✅ Complete mobile optimization - **COMPLETED**
7. ✅ Real product catalog (6+ products) - **COMPLETED**
8. ⏳ Shopify store configuration - **PENDING** (credentials needed)
9. ⏳ Vercel deployment - **PENDING**

**CURRENT STATUS: ~95% Complete - Ready for deployment**

## External Integrations

- **Analytics**: Google Analytics (to be configured)
- **Email**: Direct mailto links to squaragestudio@gmail.com
- **Social**: Instagram integration (@squaragestudio)
- **Shopify**: E-commerce backend for inventory and checkout

## Performance Considerations

- **Image Optimization**: Comprehensive preloading system with WebP/AVIF support
- **Font Loading**: Self-hosted fonts with `font-display: swap`
- **Bundle Size**: Tree-shaking and code splitting enabled
- **SEO**: Proper metadata and semantic HTML structure

### Image Preloading System

**CRITICAL: Always refer to [PRELOADING.md](./PRELOADING.md) when working with images**

The site uses a **simple, direct preloading system** that ensures instant image loading:

#### Key Components:
1. **SimplePreloader** (`/components/SimplePreloader.tsx`) - Main orchestrator
2. **FastProductImage** (`/components/FastProductImage.tsx`) - **MUST USE for product images**
3. **simplePreloader.ts** (`/lib/simplePreloader.ts`) - Core preloading functions
4. **shopifyPreloader.ts** (`/lib/shopifyPreloader.ts`) - Shopify image handling

#### When Adding Images:
1. **Always update** `/lib/simplePreloader.ts` with new image paths
2. **Always use** `FastProductImage` for product/dynamic images (NOT regular `Image`)
3. **Check** [PRELOADING.md](./PRELOADING.md) for implementation details

#### Performance:
- **Color switching**: <1ms with FastProductImage
- **Navigation**: <20ms between cached pages
- **Initial load**: 2-3s with preloading

## Important Documentation

- **[PRELOADING.md](./PRELOADING.md)**: Complete guide to the image preloading system
- **[CACHE_SYSTEM_DOCUMENTATION.md](./CACHE_SYSTEM_DOCUMENTATION.md)**: Cache implementation details
- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)**: Migration from Webflow details

When working on this project, prioritize the existing design language, maintain the clean aesthetic, and ensure all new features integrate seamlessly with the Shopify e-commerce flow. For any image-related optimizations or preloading questions, refer to PRELOADING.md.