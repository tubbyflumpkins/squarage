# Squarage Studio

A custom Next.js website for Squarage Studio, an LA-based design studio creating functional art and design pieces. Migrated from Webflow with Shopify integration.

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

- `app/` - Next.js 15 App Router pages and layouts
- `components/` - Reusable React components
- `lib/` - Utility functions and Shopify API integration
- `context/` - React context providers (Cart, etc.)
- `public/` - Static assets (images, fonts, etc.)

## Features

- ✅ Homepage with hero image slideshow
- ✅ Collections showcase (Tables, Shelves, Chairs)
- ✅ Neue Haas Grotesk font integration
- ✅ Shopify API integration ready
- ✅ Responsive design
- 🚧 Product pages (in progress)
- 🚧 Custom project workflow
- 🚧 Contact forms

## Tech Stack

- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS
- **E-commerce:** Shopify Buy SDK
- **Slideshow:** Swiper.js
- **Deployment:** Vercel (planned)