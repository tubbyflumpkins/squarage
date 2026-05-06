# CLAUDE.md

## Image Handling Rules

1. **READ [PRELOADING.md](./PRELOADING.md) FIRST** before touching any image code
2. **USE `FastProductImage`** for ALL product images (never regular `Image` for color-switching)
3. **UPDATE `/lib/simplePreloader.ts`** when adding new image paths
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
- **Swiper.js** for hero slideshow
- **Google Analytics** with cookie consent gating

## Routes

### Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage (hero slideshow, collections, about, custom CTA) |
| `/products` | All products grid |
| `/products/[handle]` | Individual product page (Tiled collection) |
| `/collections/tiled` | Tiled collection |
| `/collections/warped` | Warped collection |
| `/collections/warped/designer` | 3D shelf designer |
| `/collections/pose` | Posé collection (Mateo chair — Posé / Tabouret / Diné variants, real-time 3D) |
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
  products/                   # Product pages
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
  HeroSlideshow.tsx           # Homepage hero
  CollectionsSection.tsx      # Homepage collections grid
  AboutSection.tsx            # Homepage about
  CustomProjectSection.tsx    # "Want a Custom Piece?" CTA
  ProductPage.tsx             # Tiled product detail page
  WarpedProductPage.tsx       # Warped product detail page
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
  PoseVariantsStack.tsx        # Posé variant rows (Posé / Tabouret / Diné, alternating)
  PoseBlob.tsx                 # SVG-path organic title blob (used by Posé)
  chair/                       # Posé chair geometry + rendering (parallel to shelf/)
    ChairVisualizer/           # Pure TS: types + generateChairGeometry()
    RenderedChairView/         # R3F Canvas wrapper, ChairMeshes, ChairFloor,
                               #   CameraOrbitingLight (key light follows camera)

lib/
  shopify.ts                  # Shopify Buy SDK client + product serialization
  shelfGeometryWasm.ts        # WASM wrapper — lazy loading, React hook, THREE.js helpers
  wasm-pkg/                   # Compiled WASM output (committed, built from wasm-shelf-geometry/)
  simplePreloader.ts          # Core preloading (preloadImage, preloadImages, isImageCached, preloadForPage)
  shopifyPreloader.ts         # Shopify product image caching
  cookieCategories.ts         # Cookie consent category definitions
  emailCapture.ts             # Email capture service
  policies.ts                 # Legal policy content (privacy, shipping, returns)
  posePresets.ts              # Posé chair preset params (Posé / Tabouret / Diné)
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
  ImageCacheContext.tsx        # Image cache context
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
- **Typography**: Neue Haas Grotesk (self-hosted, all weights, `font-display: swap`)
- **Font class**: `font-neue-haas`

## Active Systems

### Image Preloading
- **SimplePreloader** in layout.tsx preloads images per route
- **FastProductImage** uses native `<img>` for cached images (<1ms), Next.js Image for uncached
- **MobileCollectionPreloader** handles mobile collection pages
- **`window.__simpleImageCache`** is the global cache Set
- See [PRELOADING.md](./PRELOADING.md) for full details

### E-commerce
- Shopify Buy SDK for products, collections, and checkout
- Cart persisted via localStorage (`shopify_checkout_id`)
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

### Cookie Consent
- CookieConsentContext manages consent state
- Google Analytics only loads after consent
- See [COOKIE_CONSENT_DOCUMENTATION.md](./COOKIE_CONSENT_DOCUMENTATION.md)

### Posé Chair Rendering (R3F, no WASM)
- Pure-TypeScript parametric chair geometry in `components/chair/ChairVisualizer/geometry.ts` (ported from sister labs project). Generates closed-polygon outlines for sideFrame×2, front/rear crosspieces, seat slats LR + FB, back slats; centered on actual bbox.
- `components/chair/RenderedChairView/`:
  - `ChairMeshes.tsx` extrudes pieces via `buildClosedPolygonGeo` (lives in `components/shelf/RenderedShelfView/buildExtrudedGeometry.ts`) and applies wood + edge PBR materials.
  - For colored finishes, `useColorChairMaterial(color)` (in `useWoodMaterial.ts`) tints over Birch's roughness + normal maps so the plywood grain still reads through the paint; cut edges use `useEdgeMaterial('Birch')`.
  - `ChairFloor.tsx` is a circular shadow-receiving disc with a radial alpha fade so the shadow blends into bg-cream.
  - `CameraOrbitingLight.tsx` re-derives the key light's position from the camera's azimuth each frame so the chair appears lit from a constant on-screen direction during orbit.
  - `BoomerangCamera` (in shelf/) takes optional `autoRotate` + `autoRotateSpeed` for the slow camera orbits.
- Hero scene `HeroChairTrio.tsx`: 5 Posé chairs on a circle, each in a different palette color, facing radially outward, slow camera orbit. Used in `PoseHeroSection` (collection page hero) and the Posé tile in `CollectionsSection` (homepage).
- Variant scene `RenderedChairView/index.tsx`: a single chair (Posé / Tabouret / Diné) auto-rotating with its own floor disc.
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
