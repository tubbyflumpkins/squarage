import type { Metadata } from 'next'
import Link from 'next/link'
import WarpedHeroSection from '@/components/WarpedHeroSection'
import WarpedContentSection from '@/components/WarpedContentSection'
import WarpedProductsSection from '@/components/WarpedProductsSection'

export const metadata: Metadata = {
  title: 'Warped Collection - Custom Modular Shelving',
  description: 'Custom modular shelving built to your exact dimensions. Warped\'s organic curves fit any space — corners, walls, or freestanding. Choose your size, wood finish, and configuration. Handcrafted in Los Angeles.',
  keywords: ['custom shelving', 'wooden shelves', 'warped wood', 'handcrafted furniture', 'Los Angeles', 'Squarage Studio', 'organic design', 'custom dimension shelving', 'modular shelves', 'shelving for any space', 'made to measure shelves', 'custom size shelf', 'modular wall shelving'],
  alternates: {
    canonical: 'https://squarage.com/collections/warped',
  },
  openGraph: {
    title: 'Warped Collection - Custom Modular Shelving',
    description: 'Custom modular shelving built to your exact dimensions. Organic curves that fit any space. Handcrafted in Los Angeles.',
    images: ['/images/collection-shelves.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Warped Collection - Custom Modular Shelving',
    description: 'Custom modular shelving built to your exact dimensions. Organic curves that fit any space.',
    images: ['/images/collection-shelves.jpg'],
  },
}

export default function WarpedPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <WarpedHeroSection />
      
      {/* Products Section - moved up */}
      <WarpedProductsSection />

      {/* Designer CTA */}
      <section className="py-16 lg:py-20 bg-cream">
        <div className="px-6 md:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-neue-haas mb-4 text-squarage-black">
              Design Your Own
            </h2>
            <p className="text-lg md:text-xl font-neue-haas text-squarage-black/70 mb-8 max-w-2xl mx-auto">
              Use our free 3D designer to customize your perfect warped shelf — pick dimensions, wood finish, and shelf count, then request a quote.
            </p>
            <Link
              href="/collections/warped/designer"
              className="inline-block px-10 py-4 bg-squarage-green text-white text-lg font-semibold font-neue-haas rounded-full hover:opacity-90 transition-opacity"
            >
              Open 3D Designer
            </Link>
          </div>
        </div>
      </section>

      {/* Content Section - moved down */}
      <WarpedContentSection />
    </main>
  )
}