import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import { ImageCacheProvider } from '@/context/ImageCacheContext'

export const metadata: Metadata = {
  title: 'Squarage Studio - Made in Los Angeles',
  description: 'Functional Art & Design - LA-based design studio creating custom furniture and design pieces.',
  keywords: ['furniture', 'design', 'Los Angeles', 'custom', 'studio', 'art'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-cream font-neue-haas-text">
        <ImageCacheProvider>
          <Navigation />
          {children}
        </ImageCacheProvider>
      </body>
    </html>
  )
}