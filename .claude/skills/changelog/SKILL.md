---
name: changelog
description: Running log of significant changes to the Squarage site, newest first. Use to understand recent history, why something changed, or what shipped when.
---

# Changelog

## 2026-07-21 — Mobile OOM crash fix: 3D geometry disposal + GPU/bandwidth diet

On staging (`fb01c7f..faace24`), awaiting Dylan's on-device iPhone verification before fast-forwarding main. Root cause of the Mateo-page crash (iOS Safari blank + auto-reload after repeated style switches, phone heat, 85MB Vercel transfer spikes): the style morph regenerated all ~40 chair BufferGeometries every animation frame for 2s per switch and nothing in the repo ever called `.dispose()` — WebGL buffers aren't GC'd, so six switches leaked ~10,400 GPU geometries (measured: 52 → 10,409 via `renderer.info.memory`) until iOS jetsam-killed the tab. The Vercel spike was the crash-reload loop re-downloading textures, not the switches themselves.

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
