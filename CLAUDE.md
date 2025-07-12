# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
│   └── CartContext.tsx    # Shopping cart state management
├── public/
│   ├── images/            # Product photos, logos, assets
│   └── fonts/             # Neue Haas Grotesk font family
└── MIGRATION_PLAN.md      # Detailed migration documentation
```

### Key Features Implemented
- **Homepage**: Hero slideshow (replaced video), collections showcase, about section
- **Navigation**: Fixed nav with full-screen overlay menu
- **Typography**: Complete Neue Haas Grotesk font integration
- **E-commerce**: Shopify API setup with cart context
- **Responsive Design**: Mobile-first approach with Tailwind

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
The site organizes products into three main collections:
- **Tables**: Custom dining and coffee tables
- **Shelves**: Floating and modular shelving systems  
- **Chairs**: Ergonomic seating with distinctive design

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

### Next Steps (Per Todo List)
1. ✅ Homepage with slideshow - **COMPLETED**
2. 🚧 Products page with collection filtering - **IN PROGRESS**
3. ⏳ Custom projects page (4-step process)
4. ⏳ Individual product pages (dynamic)
5. ⏳ Contact/inquiry forms
6. ⏳ GSAP scroll animations
7. ⏳ Vercel deployment

## External Integrations

- **Analytics**: Google Analytics (to be configured)
- **Email**: Direct mailto links to squaragestudio@gmail.com
- **Social**: Instagram integration (@squaragestudio)
- **Shopify**: E-commerce backend for inventory and checkout

## Performance Considerations

- **Image Optimization**: Next.js Image component with proper sizing
- **Font Loading**: Self-hosted fonts with `font-display: swap`
- **Bundle Size**: Tree-shaking and code splitting enabled
- **SEO**: Proper metadata and semantic HTML structure

When working on this project, prioritize the existing design language, maintain the clean aesthetic, and ensure all new features integrate seamlessly with the Shopify e-commerce flow.