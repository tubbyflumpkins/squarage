---
name: changelog
description: Running log of significant changes to the Squarage site, newest first. Use to understand recent history, why something changed, or what shipped when.
---

# Changelog

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
