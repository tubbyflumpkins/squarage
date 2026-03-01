# Squarage Studio

A custom Next.js website for Squarage Studio, an LA-based design studio creating functional art and design pieces. Live at [squarage.com](https://squarage.com).

## Development

### Running the Dev Server

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

The dev server will automatically reload when you make changes to the code.

### Other Commands

- **Build for production:** `npm run build`
- **Start production server:** `npm start`
- **Run linting:** `npm run lint`

## Project Structure

- `app/` - Next.js 15 App Router pages, layouts, and API routes
- `components/` - React components (product pages, navigation, cart, preloading, etc.)
- `lib/` - Shopify API, preloading, cookie categories, email capture, policies
- `context/` - React context providers (Cart, ImageCache, CookieConsent, EmailCapture)
- `stores/` - Zustand stores (saved designs)
- `public/` - Static assets (images, fonts, textures)

## Features

- Homepage with hero image slideshow
- Product collections (Tiled, Warped, Chairs, Objects)
- Individual product pages with instant color switching
- 3D shelf designer (React Three Fiber)
- Custom project request flow
- Shopping cart with Shopify checkout
- Contact and quote request forms (Nodemailer/Zoho SMTP)
- Cookie consent system with Google Analytics
- Email capture popup
- Customer service page
- Fully responsive mobile design
- Image preloading system for instant navigation

## Tech Stack

- **Framework:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **E-commerce:** Shopify Buy SDK
- **3D:** React Three Fiber, drei, Three.js
- **State:** Zustand, React Context
- **Forms:** react-hook-form, zod
- **Email:** Nodemailer (Zoho SMTP)
- **Slideshow:** Swiper.js
- **Analytics:** Google Analytics
- **Deployment:** Vercel
