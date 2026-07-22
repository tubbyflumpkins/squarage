# CLAUDE.md

## Image Handling Rules

1. **READ [PRELOADING.md](./PRELOADING.md) FIRST** before touching any image code
2. **USE `FastProductImage`** for ALL product images (never regular `Image` for color-switching)
3. **NEVER preload local `/images/` paths** — they render via the Next.js optimizer, so raw preloads never match and blow iOS Safari's memory budget; only Shopify CDN URLs go in the preload cache
4. **TEST on mobile AND desktop** — different optimizations apply
5. **NEVER remove SimplePreloader** from layout.tsx
6. **Generate crops with sharp** (already in node_modules) — macOS `sips --cropOffset` fails silently and a follow-up resize squishes instead of cropping

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS**
- **Shopify Buy SDK** for storefront/checkout (Cart API under the hood)
- **React Three Fiber** + **drei** + **Three.js** — 3D shelf designer + Posé chair renders
- **Rust/WASM** (`wasm-shelf-geometry`) for shelf geometry; chair geometry is pure TS
- **Zustand** (saved designs); React Context for cart, cookie consent, email capture
- **react-hook-form** + **zod**; **Nodemailer** (Zoho SMTP); **Swiper.js** (Warped carousels)
- **Google Analytics** + **Meta Pixel/CAPI**, both gated on cookie consent

## Key Conventions

- **Canonical host is `https://www.squarage.com`** — every absolute URL (canonicals, OG urls, sitemap, robots, JSON-LD) uses www; apex redirects to it
- **Social share images** are dedicated crops in `public/images/og/` (1200×630; `mateo-chair.jpg`/`pose.jpg` are 1200×1200 squares) — never point OG tags at full-res page images
- **Every route needs metadata** — server pages export `metadata`; `'use client'` pages use a sibling `layout.tsx`. **Add new routes to `app/sitemap.ts`**
- **Product pages keep exactly one `<h1>`** (responsive duplicates are `<p>` styled identically)
- **API versions pinned**: `SHOPIFY_API_VERSION` (lib/shopify.ts), `META_GRAPH_API_VERSION` (lib/metaCapi.ts) — bump within support windows
- **Catalog fetches request 250 items** — the SDK silently defaults to 20; never call fetchAll/fetchAllWithProducts bare
- **Cart mutation failures throw** from lib/shopify.ts and surface via `state.error` in CartDrawer — don't reintroduce return-null-on-error
- **Meta events fire on BOTH channels** (browser `fbq` + CAPI) with a shared `eventID`; Purchase is tracked in Shopify admin, not here
- **Copy style** (per Dylan): short sentences, no em dashes in customer-facing copy

## Design System

- Cream `#fffaf4` (`bg-cream`), orange `#ff962d` (`squarage-orange`), light orange `#f7a24d` (`squarage-yellow`), `squarage-green`, `squarage-blue`, `squarage-black`
- Neue Haas Grotesk self-hosted (`font-neue-haas`; Roman/Medium/Bold preloaded in layout.tsx); `font-soap` for accent words (e.g. "Mateo")

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SHOPIFY_DOMAIN` | Shopify store domain |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Shopify Storefront API token |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID |
| `NEXT_PUBLIC_ADMIN_API_URL` | Admin API URL |
| `NEXT_PUBLIC_EMAIL_API_KEY` | Email service API key |
| `SMTP_USER` / `SMTP_PASS` | Zoho SMTP credentials |
| `CONTACT_EMAIL` | Recipient for contact/quote forms |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel / dataset ID |
| `META_CONVERSIONS_API_ACCESS_TOKEN` | Meta CAPI token (server-side events) |
| `META_TEST_EVENT_CODE` | Optional — routes CAPI to Test Events; unset in production |

## Development Commands

```bash
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run wasm:build   # Rebuild WASM (release, requires Rust + wasm-pack)
```

## Project Skills

- `.claude/skills/architecture` — routes, project structure, key image assets, and active systems (preloading, e-commerce, Meta Pixel, SEO/OG inventory, chair rendering)
- `.claude/skills/changelog` — running log of significant changes

## Documentation

- [PRELOADING.md](./PRELOADING.md) — Image preloading system
- [CACHE_SYSTEM_DOCUMENTATION.md](./CACHE_SYSTEM_DOCUMENTATION.md) — Cache implementation details
- [COOKIE_CONSENT_DOCUMENTATION.md](./COOKIE_CONSENT_DOCUMENTATION.md) — Cookie consent system
- [CONTACT_SETUP.md](./CONTACT_SETUP.md) — Contact form & SMTP setup
- [WARPED_STYLE_GUIDE.md](./WARPED_STYLE_GUIDE.md) — Warped collection design guide
- [squarage-design-language.md](./squarage-design-language.md) — Brand design language

## Deployment

Live on Vercel; pushes to `main` deploy production. Ship flow: work on `staging` → push → wait for the green Vercel preview build → fast-forward `main` → push.
