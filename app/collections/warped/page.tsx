import type { Metadata } from 'next'
import WarpedHeroSection from '@/components/WarpedHeroSection'
import WarpedContentSection from '@/components/WarpedContentSection'
import WarpedProductsSection from '@/components/WarpedProductsSection'

export const metadata: Metadata = {
  title: 'Warped Collection - Custom Modular Shelving',
  description: 'Custom modular shelving built to your exact dimensions. Warped\'s organic curves fit any space — corners, walls, or freestanding. Choose your size, wood finish, and configuration. Handcrafted in Los Angeles.',
  keywords: ['custom shelving', 'wooden shelves', 'warped wood', 'handcrafted furniture', 'Los Angeles', 'Squarage Studio', 'organic design', 'custom dimension shelving', 'modular shelves', 'shelving for any space', 'made to measure shelves', 'custom size shelf', 'modular wall shelving'],
  alternates: {
    canonical: 'https://www.squarage.com/collections/warped',
  },
  openGraph: {
    title: 'Warped Collection - Custom Modular Shelving',
    description: 'Custom modular shelving built to your exact dimensions. Organic curves that fit any space. Handcrafted in Los Angeles.',
    images: ['/images/og/warped.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Warped Collection - Custom Modular Shelving',
    description: 'Custom modular shelving built to your exact dimensions. Organic curves that fit any space.',
    images: ['/images/og/warped.jpg'],
  },
}

export default function WarpedPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <WarpedHeroSection />
      
      {/* Products Section - moved up */}
      <WarpedProductsSection />

      {/* Content Section */}
      <WarpedContentSection />
    </main>
  )
}