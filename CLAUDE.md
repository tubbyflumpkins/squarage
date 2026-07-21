# CLAUDE.md

## Image Handling Rules

1. **READ [PRELOADING.md](./PRELOADING.md) FIRST** before touching any image code
2. **USE `FastProductImage`** for ALL product images (never regular `Image` for color-switching)
3. **NEVER preload local `/images/` paths** — they render via the Next.js optimizer, so raw preloads never match and blow iOS Safari's memory budget; only Shopify CDN URLs go in the preload cache
4. **TEST on mobile AND desktop** — different optimizations apply
5. **NEVER remove SimplePreloader** from layout.tsx

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** with custom Neue Haas Grotesk font family
- **Shopify Buy SDK** (`shopify-buy`) for storefront/checkout
- **React Three Fiber** + **drei** + **Three.js** for 3D shelf designer + Posé chairs
- **Rust/WASM** (`wasm-shelf-geometry` crate) for shelf geometry algorithms; chair geometry is pure TypeScript
- **Zustand** for saved designs store; React Context for cart, image cache, cookie consent, email capture
- **react-hook-form** + **zod** for form validation
- **Nodemailer** (Zoho SMTP) for contact/quote emails
- **Swiper.js** for Warped product page carousels
- **Google Analytics** with cookie consent gating

## Routes

### Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage (static hero, collections, about, custom CTA) |
| `/products` | All products grid (server-rendered catalog, ISR 10 min) |
| `/products/[handle]` | Individual product page (ProductPage / WarpedProductPage / MateoProductPage by collection) |
| `/collections/tiled` | Tiled collection |
| `/collections/warped` | Warped collection |
| `/collections/warped/designer` | 3D shelf designer |
| `/collections/pose` | Posé collection (Mateo chair — Posé / Tabouret / Dîner variants, real-time 3D) |
| `/custom` | Custom project request flow |
| `/contact` | Contact page |
| `/customer-service` | Customer service (shipping, returns, FAQ) |
| `/coming-soon` | Coming soon placeholder |
| `/easter-egg-game` | Easter egg game |

### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/contact` | POST | Contact form via Zoho SMTP |
| `/api/quote` | POST | Quote request via Zoho SMTP |

## Project Structure

```
app/                          # Next.js App Router
  layout.tsx                  # Root layout (SimplePreloader, providers, nav, footer)
  page.tsx                    # Homepage
  products/                   # Product pages (page.tsx = server component fetching Shopify catalog, revalidate 600)
  collections/                # Collection pages (tiled, warped, pose)
    pose/                     # Posé chair collection (real-time 3D hero + variant stack)
  custom/                     # Custom project flow
  contact/                    # Contact page
  customer-service/           # Customer service
  api/contact/                # Contact API endpoint
  api/quote/                  # Quote API endpoint

components/                   # React components
  Navigation.tsx              # Main nav + mobile menu
  Footer.tsx                  # Site footer
  HeroStatic.tsx              # Homepage hero (static image + sr-only h1)
  CollectionsSection.tsx      # Homepage collections grid
  AboutSection.tsx            # Homepage about
  CustomProjectSection.tsx    # "Want a Custom Piece?" CTA
  ProductPage.tsx             # Tiled product detail page
  WarpedProductPage.tsx       # Warped product detail page
  MateoProductPage.tsx        # Mateo chair product page (/products/mateo-chair)
  ProductsPageClient.tsx      # /products client UI (receives server-fetched catalog as props)
  ProductGrid.tsx             # Product listing grid
  FastProductImage.tsx        # Instant-render cached product images
  SimplePreloader.tsx         # Route-based image preloader (in layout)
  MobileCollectionPreloader.tsx # Mobile collection image preloader
  CartDrawer.tsx / CartIcon.tsx / CartItem.tsx / CartSummary.tsx
  StickyAddToCart.tsx          # Fixed add-to-cart bar on scroll
  ProductDetailsAccordion.tsx / ProductFAQ.tsx / ProductTrustBadges.tsx
  ShippingEstimator.tsx        # Shipping cost calculator
  CookieBanner.tsx / ManageCookiesModal.tsx / CookieConsentWrapper.tsx
  GoogleAnalytics.tsx / ConsentAwareAnalytics.tsx
  EmailCapturePopup.tsx        # Email subscription popup
  AnimatedLogo.tsx             # Animated logo
  StructuredData.tsx           # JSON-LD SEO data
  Warped* / Carro*             # Warped & Carro collection components
  PoseHeroSection.tsx          # Posé hero (orbiting 5-chair circle + title blob)
  PoseVariantsStack.tsx        # Posé variant rows (Posé / Tabouret / Dîner, alternating)
  PoseBlob.tsx                 # SVG-path organic title blob (used by Posé)
  chair/                       # Posé chair geometry + rendering (parallel to shelf/)
    ChairVisualizer/           # Pure TS: types + generateChairGeometry()
    RenderedChairView/         # R3F Canvas wrapper, ChairMeshes, ChairFloor,
                               #   CameraOrbitingLight (key light follows camera)

lib/
  shopify.ts                  # Shopify Buy SDK client + raw GraphQL fetch; SHOPIFY_API_VERSION constant (bump yearly, used by both paths)
  email.ts                    # Shared Zoho SMTP transport (pooled, timeouts), HTML escaping, per-instance rate limiting
  productTypes.ts             # SerializedProduct shape shared by the serializer + all product templates
  formatPrice.ts              # Shared whole-dollar price formatter
  useStickyCartVisibility.ts  # Shared sticky add-to-cart scroll hook
  productImagePreload.ts      # Grid/card image preloading over window.__simpleImageCache
  shelfGeometryWasm.ts        # WASM wrapper — lazy loading, React hook, THREE.js helpers
  wasm-pkg/                   # Compiled WASM output (committed, built from wasm-shelf-geometry/)
  simplePreloader.ts          # Core preloading (preloadImage, preloadImages, isImageCached)
  shopifyPreloader.ts         # Shopify product image caching
  cookieCategories.ts         # Cookie consent category definitions
  emailCapture.ts             # Email capture service
  policies.ts                 # Legal policy content (privacy, shipping, returns)
  posePresets.ts              # Posé chair preset params (Posé / Tabouret / Dîner)
  poseColors.ts               # Labs COLOR_FINISH_HEX palette + random picker

wasm-shelf-geometry/            # Rust crate → compiled to WASM
  src/
    lib.rs                    # wasm_bindgen exports (4 functions)
    types.rs                  # Vec2, Vec3, input/output structs
    catmull_rom.rs            # Barry-Goldman centripetal interpolation
    flat.rs                   # Flat shelf surface eval + geometry
    corner.rs                 # Corner shelf surface eval + geometry
    mesh_builder.rs           # Triangle-strip extrusion, UVs, golden-ratio offset
    projection.rs             # Isometric projection, SVG path generation
    derived_params.rs         # Amplitude, offsets, angle, price (COST_PER_SQFT lives here)

context/
  CartContext.tsx              # Shopping cart state + Shopify checkout
  CookieConsentContext.tsx     # Cookie consent state
  EmailCaptureContext.tsx      # Email capture state

stores/
  useSavedDesigns.ts          # Zustand store for saved 3D shelf designs
```

## Design System

- **Cream background**: `#fffaf4` (`bg-cream`)
- **Orange accent**: `#ff962d` (`squarage-orange`)
- **Orange light**: `#f7a24d` (`squarage-yellow`)
- **Green**: `squarage-green`
- **Blue**: `squarage-blue`
- **Black text**: `squarage-black`
- **Typography**: Neue Haas Grotesk (self-hosted woff2 with ttf fallback, all weights, `font-display: swap`; Roman/Medium/Bold preloaded in layout.tsx)
- **Font class**: `font-neue-haas`

## Active Systems

### Image Preloading
- **SimplePreloader** in layout.tsx preloads Shopify product images per route (local images are never preloaded — they render via the Next.js optimizer)
- **FastProductImage** uses native `<img>` for cached images (<1ms), Next.js Image for uncached
- **MobileCollectionPreloader** handles mobile collection pages
- **`window.__simpleImageCache`** is the single global cache Set — ProductGrid/ProductCard preload through `lib/productImagePreload.ts` into it (no React-context cache layer; preload progress must never re-render the tree)
- `/products` seeds `window.__shopifyProducts` from its server-fetched props (no client catalog re-fetch)
- See [PRELOADING.md](./PRELOADING.md) for full details

### E-commerce
- Shopify Buy SDK for products, collections, and checkout (runs on the Cart API under the hood)
- Storefront API version pinned as `SHOPIFY_API_VERSION` in lib/shopify.ts — used by BOTH the SDK client and the raw GraphQL fetch; bump within Shopify's 12-month support window
- Catalog fetches request 250 items (SDK silently defaults to 20 — never call fetchAll/fetchAllWithProducts bare)
- Cart persisted via localStorage (`shopify_checkout_id`); cleared on checkout handoff so completed carts don't resume
- Cart mutation failures throw from lib/shopify.ts and surface via `state.error` in CartDrawer — don't reintroduce return-null-on-error
- CartContext wraps the app in layout.tsx

### Contact & Quote
- Forms submit to `/api/contact` and `/api/quote`
- Server-side Nodemailer sends via Zoho SMTP
- react-hook-form + zod for client validation

### Shelf Geometry (WASM)
- All geometry algorithms (Catmull-Rom, surface eval, mesh extrusion, projection, pricing) live in `wasm-shelf-geometry/` Rust crate
- Compiled to `.wasm` binary — no geometry source in JS bundle
- **`lib/shelfGeometryWasm.ts`** is the TS wrapper with lazy loading and `useShelfWasm()` hook
- **`lib/wasm-pkg/`** contains committed build output (avoids needing Rust on Vercel)
- To rebuild: `npm run wasm:build` (release) or `npm run wasm:dev` (debug) — requires Rust + wasm-pack
- Consumers (`FlatShelfMeshes`, `CornerShelfMeshes`, `page.tsx`) must gate on `useShelfWasm()` before calling WASM functions
- WASM exports: `generate_flat_mesh_data`, `generate_corner_mesh_data`, `generate_svg_projection`, `compute_derived_params`

### SEO
- **Canonical host is `https://www.squarage.com`** — every absolute URL (canonicals, OG urls, sitemap, robots, JSON-LD) must use www; apex redirects to it
- `app/sitemap.ts` (static routes + Shopify products) and `app/robots.ts` — **add new routes to the sitemap**
- Social share images are dedicated 1200×630 crops in `public/images/og/` — never point OG tags at full-res page images
- Every route needs metadata: server pages export `metadata`; `'use client'` pages use a sibling `layout.tsx` (see `/products`, `/custom`, `/contact`)
- JSON-LD in `components/StructuredData.tsx` (Organization/LocalBusiness/WebSite site-wide; Product + BreadcrumbList on product detail pages)
- Product pages must keep exactly one `<h1>` (responsive duplicates are `<p>` styled identically)

### Cookie Consent
- CookieConsentContext manages consent state
- Google Analytics only loads after consent
- See [COOKIE_CONSENT_DOCUMENTATION.md](./COOKIE_CONSENT_DOCUMENTATION.md)

### Meta Pixel + Conversions API
- **Gated on `marketing` cookie consent** — pixel never loads, and no CAPI event is sent (client or server), without it. Consent constants (`CONSENT_STORAGE_KEY`/`CONSENT_VERSION`) live in `lib/cookieCategories.ts`
- `components/MetaPixel.tsx` (mounted in CookieConsentWrapper) loads the pixel after consent and fires PageView per route change
- **Every event goes out on BOTH channels** — browser `fbq` + Conversions API — sharing one `eventID` so Meta dedupes. Never fire one channel without the other
- `lib/metaPixel.ts` = client half (`trackMetaEvent`, `useMetaViewContent`); `lib/metaCapi.ts` = server half (Graph API `v25.0` pinned as `META_GRAPH_API_VERSION`, bump like SHOPIFY_API_VERSION); `/api/meta-events` = relay for browser-initiated CAPI events
- Events: PageView (MetaPixel), ViewContent (product templates), AddToCart (CartContext), InitiateCheckout (CartSummary), Contact + Lead (contact/quote routes send CAPI directly with hashed email; client passes `metaEventId` in the form body)
- **Purchase is NOT tracked here** — checkout lives on Shopify; connect the pixel in Shopify admin (Facebook & Instagram sales channel) for Purchase events

### Posé Chair Rendering (R3F, no WASM)
- Pure-TypeScript parametric chair geometry in `components/chair/ChairVisualizer/geometry.ts` (ported from sister labs project). Generates closed-polygon outlines for sideFrame×2, front/rear crosspieces, seat slats LR + FB, back slats; centered on actual bbox.
- `components/chair/RenderedChairView/`:
  - `ChairMeshes.tsx` extrudes pieces via `buildClosedPolygonGeo` (lives in `components/shelf/RenderedShelfView/buildExtrudedGeometry.ts`) and applies wood + edge PBR materials.
  - For colored finishes, `useColorChairMaterial(color)` (in `useWoodMaterial.ts`) tints over Birch's roughness + normal maps so the plywood grain still reads through the paint; cut edges use `useEdgeMaterial('Birch')`.
  - `ChairFloor.tsx` is a circular shadow-receiving disc with a radial alpha fade so the shadow blends into bg-cream.
  - `CameraOrbitingLight.tsx` re-derives the key light's position from the camera's azimuth each frame so the chair appears lit from a constant on-screen direction during orbit.
  - `BoomerangCamera` (in shelf/) takes optional `autoRotate` + `autoRotateSpeed` for the slow camera orbits.
- Hero scene `HeroChairTrio.tsx`: 5 Posé chairs on a circle, each in a different palette color, facing radially outward, slow camera orbit. Used in `PoseHeroSection` (collection page hero) and the Posé tile in `CollectionsSection` (homepage).
- Variant scene `RenderedChairView/index.tsx`: a single chair (Posé / Tabouret / Dîner) auto-rotating with its own floor disc.
- Wood textures (`.webp` for color/roughness, `.png` for normal) are loaded; chairs share the same `useWoodMaterial` / `useEdgeMaterial` hooks as shelves.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SHOPIFY_DOMAIN` | Shopify store domain |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Shopify Storefront API token |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID |
| `NEXT_PUBLIC_ADMIN_API_URL` | Admin API URL |
| `NEXT_PUBLIC_EMAIL_API_KEY` | Email service API key |
| `SMTP_USER` | Zoho SMTP username |
| `SMTP_PASS` | Zoho SMTP password |
| `CONTACT_EMAIL` | Recipient for contact/quote forms |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel / dataset ID (Events Manager) |
| `META_CONVERSIONS_API_ACCESS_TOKEN` | Meta Conversions API token (server-side events) |
| `META_TEST_EVENT_CODE` | Optional — routes CAPI events to Events Manager Test Events; unset in production |

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm run wasm:build   # Rebuild WASM (release, requires Rust + wasm-pack)
npm run wasm:dev     # Rebuild WASM (debug, requires Rust + wasm-pack)
```

## Documentation

- [PRELOADING.md](./PRELOADING.md) — Image preloading system
- [CACHE_SYSTEM_DOCUMENTATION.md](./CACHE_SYSTEM_DOCUMENTATION.md) — Cache implementation details
- [COOKIE_CONSENT_DOCUMENTATION.md](./COOKIE_CONSENT_DOCUMENTATION.md) — Cookie consent system
- [CONTACT_SETUP.md](./CONTACT_SETUP.md) — Contact form & SMTP setup
- [WARPED_STYLE_GUIDE.md](./WARPED_STYLE_GUIDE.md) — Warped collection design guide
- [squarage-design-language.md](./squarage-design-language.md) — Brand design language

## Deployment

Live on Vercel. Pushes to `main` trigger production deploys.
