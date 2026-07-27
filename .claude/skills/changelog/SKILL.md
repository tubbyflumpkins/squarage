---
name: changelog
description: Running log of significant changes to the Squarage site, newest first. Use to understand recent history, why something changed, or what shipped when.
---

# Changelog

## 2026-07-27 — Cookie consent flipped to opt-out; fixes untracked Meta ad clicks

Day 2 of the Mateo ad test surfaced the smoking gun: Meta counted 30 link clicks but 0 Landing Page Views / 0 ViewContent. Root cause was NOT a missing pixel on the product page (it's in the root layout) — it was the opt-in consent defaults: the pixel, CAPI relay, GA, and Clarity were all blocked until a visitor clicked "Accept All", which cold ad traffic in the Instagram/Facebook in-app browser never does. The only recorded events came from already-consented sessions (Dylan + localhost dev). Meta was optimizing AddToCart against an event it could never see.

- `defaultConsentState` (lib/cookieCategories.ts) now grants functional/analytics/marketing by default; the banner still shows and "Reject All"/preferences still work, and stored rejections are respected. US-only rationale documented in the file — GDPR opt-in needed before selling into the EU.
- Every consent reader treats "no stored choice" as granted, only an explicit `marketing: false` blocks: `hasMarketingConsent()` (client blob, lib/metaPixel.ts), `hasMarketingConsentCookie()` (server cookie, lib/metaCapi.ts — the CAPI relay + contact/quote routes previously rejected first-time visitors who have no consent cookie at all), and the Google Consent Mode defaults in CookieConsentContext + ConsentAwareAnalytics (were hardcoded all-denied).
- No CONSENT_VERSION bump on purpose: bumping would wipe stored rejections.
- Verified via Playwright on localhost with cleared storage (the first pass was invalid — the browser profile had stored accept-all consent from 2026-07-21): fresh visitor with banner untouched → fbevents.js + 2× `/tr/` (PageView, ViewContent) + 2× `/api/meta-events` 200; after Reject All + reload → zero Meta requests. Build + lint clean (`4a0d6bf`).
- Note for reading ad metrics: all Meta data before this deploy undercounts landings/ViewContent to ~zero; judge the creative test only on post-deploy data.

Same day, follow-up (`fd5de3c`, `5cf879e`): the cookie banner was retired entirely — under opt-out it gated nothing, and it stacked with the email popup on paid landings. `CookieBanner.tsx` stays in the repo unmounted (EU pivot insurance); the footer "Cookie Preferences" modal is the opt-out path. The privacy policy was rewritten to actually disclose tracking: the old copy claimed "we do not track your activity" and "never provide your information to advertisers" while GA, Clarity, and the Meta Pixel were live — with no banner, the policy is the sole disclosure mechanism, so it now names the tools, explains hashed-email form events, and points to the footer opt-out. Dylan confirmed the US-only posture; small-business thresholds mean CCPA-family laws likely don't apply at current scale.

## 2026-07-23 — Catalog: Posé first + auto color-cycling Mateo cards

Shipped to production same day (`ebcf3ca`), ahead of the Mateo Meta ads launch (ad set optimizes for AddToCart; both pixel channels verified live on production with a shared dedupe eventID before launch).

- `/products` featured sort is now Posé → Warped → Tiled (`ProductsPageClient`).
- The three Mateo chair cards color-cycle on their own (`ProductCard`): every Shopify image is the chair in a different color, so each card starts on a random image and jumps to a random different one every 1.2s — the same `CYCLE_INTERVAL_MS` as the hover slideshow, shared so the rates can't drift. Hover on these cards keeps only the scale effect. Cycling pauses while a card is offscreen (IntersectionObserver).
- iOS guard: touch devices swap the single base image in place instead of mounting the 9-layer crossfade stack (the stack's decoded-image cost is the documented iPhone white-screen risk), so mobile cuts between colors rather than crossfading.
- Same day: the retired "Posé Collection" Shopify product was deleted (its interim catalog card disappeared once the 10-min ISR cache expired), and a dead Datahash CAPI Gateway that had every page logging a 422 console error was removed by cancelling the Datahash subscription — Meta-side config, no code change.

## 2026-07-23 — Mateo split into 3 Shopify products behind the unchanged unified page

Dylan split the single `mateo-chair` Shopify product (Style × Color variants) into three standalone products — `mateo-pose` "Mateo Posé", `mateo-tabouret` "Mateo Tabouret", `mateo-diner` "Mateo Diner" (each Color-only, 9 finishes, $650, all in the `pose` collection, each with its own image set) — so they show as individual catalog listings and for Shopify backend reasons (per-product weight etc.). Shipped to production same day (staging → main, `4b83ebc..8af6970`). The old master product ("Posé Collection") was then deleted from Shopify; the site must never fetch that handle.

- `/products/mateo-chair` is now a **virtual handle**: the route special-cases it, fetches the three real products (`Promise.all` over the cached `getProduct`), and passes `products: Record<PoseVariantId, SerializedProduct | null>` to `MateoProductPage`. The Style toggle switches products; color-only variant matching (`findMateoColorVariant`) picks the add-to-cart GID. A missing product = disabled style button; only all-three-missing 404s.
- New `lib/mateoProducts.ts` is the single source of truth for the style↔handle mapping (`MATEO_UNIFIED_HANDLE`, `MATEO_PRODUCT_HANDLES`, `mateoStyleForHandle`, `mateoUnifiedUrl`), used by the route, `ProductCard`, and the sitemap.
- Direct visits to the three real handles 308-redirect (`permanentRedirect`, kept OUTSIDE the route's try/catch — it works by throwing) to `/products/mateo-chair?style=…`, preserving `?color=`. Catalog cards link straight to the unified URL, so there's no hop from `/products`. `/collections/pose` deep links were already `?style=&color=` and needed no change.
- `generateMetadata` for `mateo-chair` no longer fetches by handle: title pinned to "Posé Collection | Squarage Studio", description borrowed from `mateo-pose`, OG crop `/images/og/mateo-chair.jpg` unchanged. JSON-LD reflects the `?style=` product (default Posé) with URLs pinned to the unified handle.
- Finish rename: `Rose` → `Rosé` in `lib/poseColors.ts` to byte-match the new products' Color option values (exact-match variant lookup; a mismatch renders that swatch "Unavailable").
- Serializer extracted from the route into `serializeShopifyProduct` (`lib/productTypes.ts`). `useMetaViewContent` guard is now a Set, so the Mateo page fires ViewContent once per distinct product viewed (per-product Meta IDs instead of the old first-variant-only event). Sticky bar label changed Style → Color (variant titles are color names now). Sitemap: static `mateo-chair` entry, three real handles filtered out.
- Verified on localhost and again on production: 308s (+color passthrough), per-style cart adds land distinct products/variant GIDs (incl. Rosé), pose deep links, metadata/JSON-LD/sitemap, Warped/Tiled pages unaffected; tsc + lint clean.

## 2026-07-21 — Mobile OOM crash fix: 3D geometry disposal + GPU/bandwidth diet

Shipped to production 2026-07-22 (staging → main, `fb01c7f..8f629ac`). Root cause of the Mateo-page crash (iOS Safari blank + auto-reload after repeated style switches, phone heat, 85MB Vercel transfer spikes): the style morph regenerated all ~40 chair BufferGeometries every animation frame for 2s per switch and nothing in the repo ever called `.dispose()` — WebGL buffers aren't GC'd, so six switches leaked ~10,400 GPU geometries (measured: 52 → 10,409 via `renderer.info.memory`) until iOS jetsam-killed the tab. The Vercel spike was the crash-reload loop re-downloading textures, not the switches themselves.

- `ChairMeshes` / `FlatShelfMeshes` / `CornerShelfMeshes`: effect-cleanup disposal of superseded geometry sets (after: 52 → 52 across ten rapid switches). Shelf designer slider drags had the same leak.
- Mateo page now mounts ONE chair canvas via a matchMedia(1024px) slot instead of two CSS-toggled copies (a breakpoint crossing used to spawn a second permanent WebGL context).
- Canvas dpr capped at `[1, 2]` everywhere (mobile was rendering at up to 3× — more pixels than desktop).
- Frameloop pauses (`'never'`) via IntersectionObserver + visibilitychange when a canvas is offscreen or the tab is hidden; resumes where it left off. Also stops QuoteFlow's always-mounted off-viewport shelf canvases (60fps → 0 measured).
- Textures load per finish on demand (`loadFinishTextures`/`loadEdgeTexture`; `preloadAll*` kept as designer idle warm-up). Mateo/Posé pages fetch only the Birch set: 4 files ≈ 2.4MB mobile, down from 12 files ≈ 12.8MB.
- New 1024px webp mobile edge textures generated with sharp (mobile previously downloaded the 1.8–2.1MB desktop edge PNGs — there was no mobile variant).
- Dev-only `window.__chairGL` / `__shelfGL` expose `renderer.info` for leak checks (also over USB Web Inspector against a LAN dev server).
- Deferred with Dylan's sign-off pending: recompressing the three 8MB desktop 2048² normal-map PNGs to near-lossless webp (needs a side-by-side look first).

## 2026-07-21 — Mateo page content, Posé hero swap, marquee banner, OG image overhaul

All shipped to production (staging → main, commits `daac236..e5bfc0b`).

**Mateo product page (`/products/mateo-chair`)**
- Added Gallery section: six lifestyle photos from `public/images/pose/posegallery/` in a tight 2-col (mobile) / 3-col (desktop) grid with a full-screen lightbox (X, backdrop click, or Escape to close; body scroll locked). Mobile grid order is 1-2 / 4-3 / 5-6; desktop is sequential.
- Dimensions accordion tab now shows an engineering drawing for the selected style (Posé / Tabouret / Dîner), swapping live with the style selector. Drawings live in `public/images/pose/dimensions/` (served locally, unlike Warped whose drawings come from Shopify media). Uses the accordion's existing single `dimensionsImage` prop.
- Details tab copy reworked: kept the intro sentence, replaced repetitive bullets with weight capacity (250 lbs), "Can be used outdoors. Keep stored indoors.", partial-disassembly + boxed instructions, 5-10 minute assembly. House style per Dylan: short sentences, no em dashes.
- FAQ durability question reworded to "How durable is the Mateo chair?" with the answer opening "The Mateo chair is made from Baltic birch plywood…".

**Posé collection page (`/collections/pose`)**
- Hero: replaced the 3D five-chair orbit (HeroChairTrio) with static `posehero.png` poolside panorama. HeroChairTrio is now dead code (kept in repo).
- Posé blob title enlarged (desktop scale 1.65, mobile 1.05 anchored bottom-left with 1rem margin) and positioned to poke slightly below the hero's bottom edge; heading section padding tightened.

**Homepage**
- "MADE IN LOS ANGELES" banner rebuilt: was a full-height bar with per-letter hover-bounce animation; now a half-height (24px/40px) infinite marquee of lowercase "made in los angeles • …" with bullet separators. CSS keyframes `marquee` in globals.css (60s linear loop, two identical chunks sliding -50%); the old `bounce-settle` keyframes and ~125 lines of letter-animation state were removed. Reduced-motion users get a static strip.

**OG / share images (all regenerated as real crops via sharp)**
- `og/mateo-chair.jpg` (new): 1200×1200 bottom-anchored square of gallery photo 1, special-cased for the mateo-chair handle in `app/products/[handle]/page.tsx`.
- `og/home.jpg`: Posé poolside hero crop. `og/pose.jpg`: same square as mateo-chair. `og/products.jpg`: orange chair at the LA River. `og/tiled.jpg`: Carro rainbow tables. `og/warped.jpg` = `og/designer.jpg`: homepage wavy-shelf hero.
- Gotcha discovered: macOS `sips --cropOffset` silently no-ops, so a follow-up `-z` resize squishes instead of cropping. Use sharp from node_modules for crops.

**Also in this push (from the prior session, was parked on staging)**
- Removed 64 unused images and stale local-image preloads; docs updated to note local images are never preloaded (`8b71576`, `daac236`).

## 2026-07-16 → 07-20 (prior sessions, summarized)
- Robustness overhaul (13 commits): security hardening, shared email transport with rate limiting, Shopify error propagation, API version pinning — merged to main.
- Meta Pixel + Conversions API implemented (dual-channel events, consent-gated).
- Posé collection launch: Mateo chair product page with real-time 3D morphing chair, collection page, presets, palette.
