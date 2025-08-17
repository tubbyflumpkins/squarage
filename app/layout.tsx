import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { ImageCacheProvider } from '@/context/ImageCacheContext'
import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/CartDrawer'
import GA from '@/components/GoogleAnalytics'
import StructuredData, { organizationSchema, localBusinessSchema, websiteSchema } from '@/components/StructuredData'
import SmartPreloader from '@/components/SmartPreloader'

export const metadata: Metadata = {
  metadataBase: new URL('https://squaragestudio.com'),
  title: {
    default: 'Squarage Studio - Made in Los Angeles',
    template: '%s | Squarage Studio'
  },
  description: 'Functional Art & Design - LA-based design studio creating custom furniture and design pieces. Shop unique tables, shelves, and chairs handcrafted in Los Angeles.',
  keywords: ['custom furniture Los Angeles', 'handmade tables', 'design studio LA', 'functional art', 'modern furniture', 'custom shelving', 'designer chairs', 'squarage studio', 'made in LA', 'artisan furniture'],
  authors: [{ name: 'Squarage Studio', url: 'https://squaragestudio.com' }],
  creator: 'Squarage Studio',
  publisher: 'Squarage Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Squarage Studio - Made in Los Angeles',
    description: 'Functional Art & Design - LA-based design studio creating custom furniture and design pieces. Shop unique tables, shelves, and chairs handcrafted in Los Angeles.',
    url: 'https://squaragestudio.com',
    siteName: 'Squarage Studio',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/hero-main.jpg',
        width: 1200,
        height: 630,
        alt: 'Squarage Studio - Custom Furniture Made in Los Angeles',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Squarage Studio - Made in Los Angeles',
    description: 'Functional Art & Design - LA-based design studio creating custom furniture and design pieces.',
    site: '@squaragestudio',
    creator: '@squaragestudio',
    images: ['/images/hero-main.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://squaragestudio.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData data={organizationSchema} />
        <StructuredData data={localBusinessSchema} />
        <StructuredData data={websiteSchema} />
      </head>
      <body className="bg-cream font-neue-haas-text">
        <ImageCacheProvider>
          <CartProvider>
            <SmartPreloader />
            <Navigation />
            <CartDrawer />
            {children}
            <Footer />
            <GA />
          </CartProvider>
        </ImageCacheProvider>
      </body>
    </html>
  )
}