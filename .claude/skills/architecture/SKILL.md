---
name: architecture
description: Full project structure for the Squarage site — routes, components, lib modules, WASM crate, and active systems (preloading, e-commerce, Meta Pixel, SEO/OG, chair rendering). Use when navigating unfamiliar parts of the codebase or making structural changes.
---

# Squarage Architecture

## Routes

### Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage (static hero, marquee banner, collections, about, custom CTA) |
| `/products` | All products grid (server-rendered catalog, ISR 10 min — Shopify edits can take ~10 min to appear). Featured order: Posé → Warped → Tiled; the 3 Mateo chair cards auto-cycle their color images (random start/order, 1.2s, pauses offscreen; touch swaps the single base image instead of mounting the crossfade stack) |
| `/products/[handle]` | Product page (ProductPage default, WarpedProductPage by `warped` collection, MateoProductPage for the virtual `mateo-chair` handle — backed by 3 Shopify products; the real handles `mateo-pose`/`mateo-tabouret`/`mateo-diner` 308-redirect to `/products/mateo-chair?style=…`) |
| `/collections/tiled` | Tiled collection (CarroHeroSection hero) |
| `/collections/warped` | Warped collection |
| `/collections/warped/designer` | 3D shelf designer |
| `/collections/pose` | Posé collection (static poolside hero + blob title, 3 auto-rotating variant chairs) |
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
| `/api/meta-events` | POST | Relay for browser-initiated Meta CAPI events |

## Project Structure

```
app/                          # Next.js App Router
  layout.tsx                  # Root layout (SimplePreloader, providers, nav, footer, site metadata)
  page.tsx                    # Homepage
  products/                   # page.tsx = server component fetching Shopify catalog (revalidate 600)
  collections/                # tiled, warped (+ designer), pose
  api/                        # contact, quote, meta-events

components/
  Navigation.tsx              # Main nav + mobile menu (z-[9980..10005])
  HeroStatic.tsx              # Homepage hero (static image + sr-only h1)
  CollectionsSection.tsx      # Marquee banner ("made in los angeles • …", 60s loop,
                              #   keyframes in globals.css) + collections grid
  ProductPage.tsx             # Tiled product detail page
  WarpedProductPage.tsx       # Warped product detail; pulls the "dimensions" image out of
                              #   the Shopify image list (filename/alt contains "dimensions")
  MateoProductPage.tsx        # Mateo chair page: 3D morphing chair, photo gallery with
                              #   lightbox (posegallery/, mobile order 1-2/4-3/5-6),
                              #   per-style dimension drawing in the Dimensions tab.
                              #   Takes products: Record<PoseVariantId, SerializedProduct|null>
                              #   — the Style toggle switches Shopify PRODUCTS (color-only
                              #   variant matching); null product = disabled style button
  ProductDetailsAccordion.tsx # Dimensions/Details/Responsible Design/Care tabs;
                              #   optional dimensionsImage prop (Warped: from Shopify,
                              #   Mateo: local per-style drawing keyed by selectedStyle)
  PoseHeroSection.tsx         # Posé hero: static /images/pose/posehero.png full-bleed
                              #   + PoseBlob title straddling the bottom edge
  PoseVariantsStack.tsx       # Posé variant rows (Posé / Tabouret / Dîner, alternating)
  PoseBlob.tsx                # SVG-path organic title blob
  FastProductImage.tsx        # Instant-render cached product images
  SimplePreloader.tsx         # Route-based image preloader (in layout)
  CartDrawer/CartIcon/CartItem/CartSummary, StickyAddToCart
  ProductFAQ / ProductTrustBadges / ShippingEstimator
  CookieBanner / ManageCookiesModal / CookieConsentWrapper
  GoogleAnalytics / ConsentAwareAnalytics / MetaPixel
  EmailCapturePopup, AnimatedLogo, StructuredData
  Warped* / Carro*            # Warped & Carro collection components
  chair/                      # Posé chair geometry + rendering (parallel to shelf/)
    ChairVisualizer/          # Pure TS: types + generateChairGeometry()
    RenderedChairView/        # R3F Canvas wrapper, ChairMeshes, ChairFloor,
                              #   CameraOrbitingLight, HeroChairTrio (UNUSED since the
                              #   Posé hero went static — kept for possible revival)

lib/
  shopify.ts                  # Buy SDK client + raw GraphQL; SHOPIFY_API_VERSION constant
  email.ts                    # Zoho SMTP transport (pooled, timeouts), escaping, rate limiting
  productTypes.ts             # SerializedProduct shape shared by serializer + templates
  formatPrice.ts              # Whole-dollar price formatter
  useStickyCartVisibility.ts  # Sticky add-to-cart scroll hook
  productImagePreload.ts      # Grid/card preloading over window.__simpleImageCache
  simplePreloader.ts          # Core preloading (preloadImage, preloadImages, isImageCached)
  shopifyPreloader.ts         # Shopify product image caching
  shelfGeometryWasm.ts        # WASM wrapper — lazy loading, useShelfWasm() hook
  wasm-pkg/                   # Committed WASM build output (no Rust needed on Vercel)
  metaPixel.ts / metaCapi.ts  # Meta Pixel client half / Conversions API server half
  cookieCategories.ts         # Consent categories + CONSENT_STORAGE_KEY/CONSENT_VERSION
  emailCapture.ts, policies.ts
  posePresets.ts              # Posé params; PoseVariantId = 'pose' | 'tabouret' | 'dine'
  poseColors.ts               # COLOR_FINISH_HEX palette + random picker (names match the
                              #   Mateo products' Shopify Color option values, incl. "Rosé")
  mateoProducts.ts            # style<->handle map for the 3 Mateo Shopify products +
                              #   mateoUnifiedUrl(); used by the product route, ProductCard,
                              #   and sitemap

wasm-shelf-geometry/          # Rust crate → WASM (rebuild: npm run wasm:build)
  src/lib.rs                  # 4 wasm_bindgen exports: generate_flat_mesh_data,
                              #   generate_corner_mesh_data, generate_svg_projection,
                              #   compute_derived_params
  src/{types,catmull_rom,flat,corner,mesh_builder,projection,derived_params}.rs

context/                      # CartContext, CookieConsentContext, EmailCaptureContext
stores/useSavedDesigns.ts     # Zustand store for saved shelf designs
```

## Key image assets

```
public/images/
  home_hero.png / home_hero_mobile.jpeg   # Homepage hero
  pose/posehero.png                       # Posé collection hero (3168×1344 panorama)
  pose/pose-homepage-v2.jpg               # Posé tile on homepage collections grid
  pose/posegallery/1..6.jpg               # Mateo product gallery (~2:3 portraits)
  pose/dimensions/{pose,tabouret,diner}_dimensions.png  # Per-style dimension drawings
  carro/header.jpg                        # Tiled collection hero
  og/                                     # Social share crops — see SEO below
```

## Active Systems

### Image Preloading
- SimplePreloader in layout.tsx preloads Shopify product images per route; local images are never preloaded (they render via the Next.js optimizer)
- FastProductImage uses native `<img>` for cached images, Next.js Image for uncached
- `window.__simpleImageCache` is the single global cache Set; ProductGrid/ProductCard preload through `lib/productImagePreload.ts` (no React-context cache layer; preload progress must never re-render the tree)
- `/products` seeds `window.__shopifyProducts` from server-fetched props
- Full details in PRELOADING.md

### E-commerce (Shopify)
- Buy SDK for products/collections/checkout (Cart API under the hood); raw GraphQL fetch for anything the SDK can't do — both use `SHOPIFY_API_VERSION`
- Catalog fetches request 250 items (SDK silently defaults to 20 — never call fetchAll bare)
- Cart persisted via localStorage (`shopify_checkout_id`); cleared on checkout handoff
- Cart mutation failures throw and surface via `state.error` in CartDrawer
- Warped dimension drawings live in Shopify product media (filename contains "dimensions"); Mateo's live in the repo under `public/images/pose/dimensions/`
- **Mateo = 3 Shopify products, 1 page**: `mateo-pose`/`mateo-tabouret`/`mateo-diner` (Color-only variants, all in the `pose` collection) feed the unified `/products/mateo-chair` page — that handle is virtual (the old master product was deleted from Shopify 2026-07-23; never fetch it). Style/handle mapping lives in `lib/mateoProducts.ts`; catalog cards link to `/products/mateo-chair?style=…`; the real handles 308-redirect there (redirect must stay OUTSIDE the route's try/catch — it works by throwing)

### Meta Pixel + Conversions API
- `marketing` consent is opt-out (2026-07-27): pixel + CAPI fire by default, client and server; only an explicit banner/preferences rejection blocks them
- Every event goes out on BOTH channels (browser `fbq` + CAPI) sharing one `eventID` for dedupe — never fire one channel without the other
- Events: PageView (MetaPixel), ViewContent (product templates), AddToCart (CartContext), InitiateCheckout (CartSummary), Contact + Lead (contact/quote API routes, hashed email)
- Purchase is NOT tracked here — checkout lives on Shopify; connect the pixel in Shopify admin

### SEO / Social share images
- Canonical host `https://www.squarage.com`; apex redirects to www
- `app/sitemap.ts` (static routes + Shopify products) and `app/robots.ts` — add new routes to the sitemap. The three Mateo product handles are filtered out (they redirect); `/products/mateo-chair` is a static entry
- OG crops in `public/images/og/` (all 1200×630 unless noted):
  - `home.jpg` — Posé poolside hero crop (homepage, contact, custom, customer-service)
  - `products.jpg` — orange Mateo chair at the LA River (Posé homepage tile source)
  - `pose.jpg` + `mateo-chair.jpg` — same 1200×1200 square bottom-anchored crop of gallery photo 1; `mateo-chair.jpg` is special-cased in `app/products/[handle]/page.tsx` generateMetadata (all other products use their first Shopify image)
  - `tiled.jpg` — Carro rainbow tables; `warped.jpg` = `designer.jpg` — homepage wavy-shelf hero
- Generate crops with sharp from node_modules (`node -e "require('sharp')(...).extract(...).resize(...)"`) — macOS `sips --cropOffset` fails silently and squishes instead of cropping
- JSON-LD in `components/StructuredData.tsx`; product pages keep exactly one `<h1>`

### Posé Chair Rendering (R3F, no WASM)
- Pure-TS parametric geometry in `components/chair/ChairVisualizer/geometry.ts` — closed-polygon outlines for sideFrame×2, crosspieces, seat + back slats
- `ChairMeshes.tsx` extrudes via `buildClosedPolygonGeo` (lives in `components/shelf/RenderedShelfView/buildExtrudedGeometry.ts`); colored finishes tint over Birch roughness/normal maps (`useColorChairMaterial`) so grain reads through paint; `ChairFloor` = shadow disc with radial alpha fade; `CameraOrbitingLight` keeps the key light screen-fixed during orbit; `BoomerangCamera` (in shelf/) takes `autoRotate`/`autoRotateSpeed`; wood textures are `.webp` color/roughness + `.png` normal, shared with shelves via `useWoodMaterial`/`useEdgeMaterial`
- Used on: `/collections/pose` variant stack (3 chairs) and `/products/mateo-chair` (morphing between presets via `useChairMorph`; the page mounts exactly ONE canvas, slotted into the mobile or desktop layout branch by matchMedia — never render the chair in both CSS-toggled branches)
- The 5-chair orbit scene `HeroChairTrio.tsx` is no longer mounted anywhere (hero is a static photo since 2026-07-20)
- **Geometry lifecycle (2026-07-21 crash fix)**: the morph regenerates every BufferGeometry per animation frame, so `ChairMeshes`/`FlatShelfMeshes`/`CornerShelfMeshes` dispose superseded sets in an effect cleanup — R3F never disposes `geometry=` props and WebGL buffers aren't GC'd; removing that cleanup re-introduces the iOS OOM crash. Verify with dev-only `__chairGL.info.memory.geometries` (must stay flat across style switches)
- Canvas hygiene: dpr capped `[1, 2]`; frameloop flips to `'never'` while offscreen/tab-hidden (IntersectionObserver + visibilitychange in both `RenderedChairView` and `RenderedShelfView`); wood/edge textures load per finish on demand (`loadFinishTextures`/`loadEdgeTexture`), color-finish chairs pull only the Birch set, `/textures/mobile/` has 1024px variants of everything incl. `*_edge.webp`, and the designer idle-warms all finishes via `preloadAllTextures()`/`preloadAllEdgeTextures()`

### Cookie Consent
- CookieConsentContext manages consent; opt-out model — everything granted by default, tracking stops on explicit rejection (US audience; GDPR opt-in needed before selling into the EU)
- See COOKIE_CONSENT_DOCUMENTATION.md
