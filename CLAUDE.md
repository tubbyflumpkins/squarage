# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Image Handling Instructions

**When working with images in this codebase:**

### MUST DO:
1. **READ [PRELOADING.md](./PRELOADING.md) FIRST** - Contains complete system documentation
2. **USE `FastProductImage` component** for ALL product images (never regular `Image`)
3. **UPDATE `/lib/simplePreloader.ts`** when adding new image paths
4. **TEST on mobile AND desktop** - Different optimizations apply

### NEVER DO:
1. **DON'T use Next.js `Image` component** for color-switching images
2. **DON'T modify desktop functionality** - It's perfect as-is
3. **DON'T remove SimplePreloader** from layout.tsx
4. **DON'T skip preloading** - It's critical for <1ms performance

The preloading system is the foundation of the site's performance. Breaking it will cause noticeable delays.

## Project Overview

**Squarage Studio** — a fully launched Next.js e-commerce site for an LA-based design studio creating functional art and design pieces. Originally migrated from Webflow; now a custom Next.js app with Shopify integration. Deployed on Vercel.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **Tailwind CSS 3** — utility-first, no CSS modules or styled-components
- **Shopify Buy SDK 3** — Storefront API for products, collections, checkout
- **Three.js + React Three Fiber + Drei** — 3D shelf visualizer
- **Zustand 5** — saved shelf designs state
- **React Hook Form + Zod** — form validation (contact, quote)
- **Nodemailer** — Zoho SMTP for contact/quote emails
- **Swiper.js** — hero slideshow and product carousels
- **Heroicons** — icon set used across components

## Project Structure

```
app/
├── layout.tsx                      # Root layout (SimplePreloader, LayoutWrapper)
├── page.tsx                        # Homepage
├── globals.css                     # Global styles, font-face, animations
├── robots.ts / sitemap.ts          # SEO generation
├── api/
│   ├── contact/route.ts            # Contact form (Zod + Nodemailer)
│   ├── quote/route.ts              # Shelf quote request (Zod + Nodemailer)
│   └── products/create/route.ts    # Shopify Admin product creation
├── products/
│   ├── page.tsx                    # Product listing with search/filter
│   ├── layout.tsx
│   └── [handle]/page.tsx           # Dynamic product page (routes to ProductPage or WarpedProductPage)
├── collections/
│   ├── tiled/page.tsx              # Tiled tables collection
│   ├── warped/
│   │   ├── page.tsx                # Warped shelves collection
│   │   └── designer/page.tsx       # 3D shelf designer/configurator
│   ├── chairs/page.tsx             # → /coming-soon
│   └── objects/page.tsx            # → /coming-soon
├── custom/page.tsx                 # Custom projects landing
├── contact/page.tsx                # Contact form
├── customer-service/page.tsx       # Customer service/policies
├── coming-soon/page.tsx
└── easter-egg-game/page.tsx        # Hidden game

components/
├── Navigation.tsx                  # Header nav + mobile hamburger menu
├── Footer.tsx                      # Site footer
├── LayoutWrapper.tsx               # Wraps nav, footer, cart drawer
├── HeroSlideshow.tsx               # Homepage hero (Swiper, 6 images)
├── AnimatedLogo.tsx                # Canvas-based animated logo
├── CollectionsSection.tsx          # Homepage collections showcase
├── AboutSection.tsx                # About section
├── ProductPage.tsx                 # Tiled product detail page
├── WarpedProductPage.tsx           # Warped product detail page (Swiper gallery)
├── ProductGrid.tsx                 # Product grid with preloading
├── FastProductImage.tsx            # REQUIRED for all product images (<1ms switching)
├── SimplePreloader.tsx             # Route-based image preloader (in layout.tsx)
├── MobileCollectionPreloader.tsx   # Mobile-only collection image preloader
├── CartDrawer.tsx / CartItem.tsx / CartSummary.tsx / StickyAddToCart.tsx
├── ProductDetailsAccordion.tsx / ProductFAQ.tsx / ProductSpecs.tsx / ProductTrustBadges.tsx
├── ShippingEstimator.tsx           # ZIP-based shipping calculator
├── CookieBanner.tsx / ManageCookiesModal.tsx / ConsentAwareAnalytics.tsx
├── EmailCapturePopup.tsx           # Newsletter signup with discount code
├── StructuredData.tsx              # JSON-LD schema.org markup
├── GoogleAnalytics.tsx             # GA loader
├── Carro*Section.tsx               # Tiled collection page sections
├── Warped*Section.tsx              # Warped collection page sections
├── shelf/                          # 3D shelf system
│   ├── QuoteFlow.tsx               # 4-step shelf quote flow
│   ├── RenderedShelfView/          # Three.js 3D viewer
│   │   ├── index.tsx               # Canvas + lights + camera
│   │   ├── FlatShelfMeshes.tsx     # Flat shelf geometry
│   │   ├── CornerShelfMeshes.tsx   # Corner shelf geometry
│   │   ├── BoomerangCamera.tsx     # Auto-rotating camera
│   │   └── useWoodMaterial.ts      # PBR wood textures (walnut/oak/birch)
│   ├── ShelfVisualizer/geometry.ts # Sin-wave shelf math
│   └── CornerShelfVisualizer/geometry.ts
└── ui/
    ├── ProductCard.tsx
    └── CustomDesignCard.tsx

lib/
├── shopify.ts                      # Shopify Storefront API (Buy SDK + GraphQL)
├── shopify-admin.ts                # Shopify Admin API (product management)
├── simplePreloader.ts              # Core route→image preloading mappings
├── shopifyPreloader.ts             # Shopify product image caching
├── navigationPreloader.ts          # Advanced preloader with performance tracking
├── universalImagePreloader.ts      # Page-specific preload configs
├── universalImageRegistry.ts       # Static image catalog
├── imageOptimizer.ts               # Device-aware image optimization
├── emailCapture.ts                 # Email subscription (calls admin.squarage.com)
├── cookieCategories.ts             # GDPR cookie category definitions
└── policies.ts                     # Policy content (returns, warranty, etc.)

context/
├── CartContext.tsx                  # Cart state + Shopify checkout (useReducer)
├── CookieConsentContext.tsx         # GDPR consent state + Google Consent Mode
├── ImageCacheContext.tsx            # Image cache for Shopify product images
└── EmailCaptureContext.tsx          # Email popup state + submission

stores/
└── useSavedDesigns.ts              # Zustand store for saved shelf designs (localStorage)

public/
├── fonts/                          # Neue Haas Grotesk (16 weights) + Soap Regular
├── images/
│   ├── products/{matis,harper,chuck,arielle,saskia,seba}/  # 7 color variants each
│   ├── colors/                     # Color swatch PNGs
│   ├── warped/                     # Shelf preview images
│   ├── carro/                      # Tiled collection gallery
│   ├── hero-*.jpg, collection-*.jpg, aboutus.jpg, logos
│   └── ...
├── textures/                       # 3D wood textures (walnut/oak/birch)
│   ├── {wood}.webp                 # Color maps
│   ├── {wood}_roughness.webp       # Roughness maps
│   ├── {wood}_normal.png           # Normal maps
│   ├── mobile/                     # 1024px mobile versions
│   └── swatches/                   # UI swatch previews
└── policies/                       # Markdown policy documents
```

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
```

## Environment Variables

```bash
# Shopify Storefront (public, required)
NEXT_PUBLIC_SHOPIFY_DOMAIN=
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=

# Shopify Admin (private, for product management API)
SHOPIFY_ADMIN_ACCESS_TOKEN=

# Email - Zoho SMTP (private, for contact/quote forms)
SMTP_USER=
SMTP_PASS=
CONTACT_EMAIL=                      # Optional override, defaults to SMTP_USER

# Email capture (public, for newsletter popup)
NEXT_PUBLIC_ADMIN_API_URL=          # Production: https://admin.squarage.com
NEXT_PUBLIC_EMAIL_API_KEY=
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Cream / Background | `#fffaf4` | Site background |
| Orange (primary) | `#ff962d` | CTAs, accents |
| Orange Light | `#f7a24d` | Hover states |
| Brown Dark | `#333` | Body text |
| Brown Medium | `#666` | Secondary text |
| Brown Light | `#999` | Tertiary text |

Additional product colors in Tailwind config: `squarage-green`, `squarage-blue`, `squarage-red`, `squarage-yellow`, `squarage-pink`, `squarage-dark-blue`, `squarage-black`.

**Fonts**: Neue Haas Grotesk Display Pro (weights 100–900, self-hosted TTF, `font-display: swap`) + Soap Regular (decorative).

**Styling**: Pure Tailwind utilities. No CSS modules. Custom animations in `globals.css` (bounce-settle, text-wave, fadeSlideIn/Out, wireframePulse).

## Key Systems

### Shopify Integration
- **Storefront API** (`lib/shopify.ts`): Product/collection fetching via `shopify-buy` SDK + GraphQL fallback for metafields
- **Admin API** (`lib/shopify-admin.ts`): Product CRUD via REST API
- **Cart** (`context/CartContext.tsx`): useReducer-based cart with Shopify checkout lifecycle, persists checkout ID to localStorage
- **API Version**: 2024-10

### 3D Shelf Visualizer
The Warped collection includes a custom 3D shelf designer at `/collections/warped/designer`:
- **React Three Fiber** canvas with soft lighting and shadow mapping
- **PBR wood materials** loaded per finish (walnut/oak/birch) with color, roughness, and normal maps
- **Geometry**: Sin-wave curves for flat shelves, complex corner patterns for corner shelves
- **QuoteFlow**: 4-step design process → email quote via `/api/quote`
- **Saved designs**: Persisted to localStorage via Zustand (`stores/useSavedDesigns.ts`)
- **Textures**: Desktop uses 2048px maps, mobile uses 1024px from `/public/textures/mobile/`

### Image Preloading System

The site uses a multi-layer preloading system for instant performance:

| Component | Purpose |
|-----------|---------|
| `SimplePreloader` | Route-based preloader, lives in layout.tsx |
| `FastProductImage` | **Required** for all product images — enables <1ms color switching |
| `MobileCollectionPreloader` | Mobile-only batch preloader for collection pages |
| `simplePreloader.ts` | Core route→image path mappings + global cache (`window.__simpleImageCache`) |
| `shopifyPreloader.ts` | Caches Shopify product images globally |

**When adding new products/images:**
1. Add image paths to `/lib/simplePreloader.ts` under the appropriate route
2. Use `FastProductImage` component (NOT regular `Image`)
3. Test on mobile — MobileCollectionPreloader should handle it
4. Check console for preloading confirmation messages

### Cookie Consent & Analytics
- GDPR-compliant consent system with 4 categories (necessary, functional, analytics, marketing)
- Google Analytics + Microsoft Clarity loaded only after consent via `ConsentAwareAnalytics`
- Integrates with Google Consent Mode v2
- Consent persisted to localStorage with version control

### Email Systems
- **Contact form** (`/api/contact`): Zod-validated, sent via Zoho SMTP (Nodemailer)
- **Quote requests** (`/api/quote`): Shelf specs + estimated price, HTML email template
- **Email capture popup**: Calls separate admin server (`admin.squarage.com`) for newsletter subscriptions with discount codes

## Collections & Products

**Active collections:**
- **Tiled** (`/collections/tiled`) — Custom tiled tables (Matis, Harper, Chuck, Arielle, Saskia, Seba)
- **Warped** (`/collections/warped`) — Custom wavy shelves with 3D designer

**Coming soon:**
- **Chairs** (`/collections/chairs`) → redirects to `/coming-soon`
- **Objects** (`/collections/objects`) → redirects to `/coming-soon`

**Products** (6 total, all with 7 color variants: blue, green, yellow, orange, red, black, white):
- The Matis (coffee table), The Harper (dining table), The Chuck (coffee table)
- The Arielle (side table), The Saskia (accent table), The Seba (modern table)

Product images stored in `/public/images/products/[product-name]/`. Product data fetched from Shopify.

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/contact` | POST | Contact form → Zoho SMTP email |
| `/api/quote` | POST | Shelf quote request → branded HTML email |
| `/api/products/create` | POST | Create product via Shopify Admin API |

## SEO & Performance

- **Structured data**: JSON-LD (Organization, LocalBusiness, Product, Breadcrumb) via `StructuredData.tsx`
- **Dynamic `robots.ts` and `sitemap.ts`** for search engine crawling
- **Image optimization**: AVIF/WebP via Next.js, immutable cache headers (1 year) for fonts and images
- **Security headers**: X-XSS-Protection, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Console removal** in production builds
- **Path alias**: `@/*` maps to project root

## Important Documentation

- **[PRELOADING.md](./PRELOADING.md)** — Image preloading system (read before touching images)
- **[CACHE_SYSTEM_DOCUMENTATION.md](./CACHE_SYSTEM_DOCUMENTATION.md)** — Cache implementation details
- **[squarage-design-language.md](./squarage-design-language.md)** — Design system documentation
- **[WARPED_STYLE_GUIDE.md](./WARPED_STYLE_GUIDE.md)** — Warped collection styling conventions

When working on this project, prioritize the existing design language, maintain the clean aesthetic, and ensure all new features integrate seamlessly with the Shopify e-commerce flow.
