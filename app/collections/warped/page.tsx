import type { Metadata } from 'next'
import WarpedHeroSection from '@/components/WarpedHeroSection'
import WarpedContentSection from '@/components/WarpedContentSection'
import WarpedProductsSection from '@/components/WarpedProductsSection'

export const metadata: Metadata = {
  title: 'Warped Collection - Custom Shelving | Squarage Studio',
  description: 'Discover our Warped collection of handcrafted wooden shelving systems. Natural, organic designs made in Los Angeles with sustainably sourced materials.',
  keywords: ['custom shelving', 'wooden shelves', 'warped wood', 'handcrafted furniture', 'Los Angeles', 'Squarage Studio', 'organic design'],
  openGraph: {
    title: 'Warped Collection - Custom Shelving | Squarage Studio',
    description: 'Handcrafted wooden shelving systems featuring natural, organic curves and sustainable materials.',
    images: ['/images/collection-shelves.jpg'],
    type: 'website',
  },
}

export default function WarpedPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <WarpedHeroSection />
      
      {/* Content Section */}
      <WarpedContentSection />
      
      {/* Products Section */}
      <WarpedProductsSection />
    </main>
  )
}