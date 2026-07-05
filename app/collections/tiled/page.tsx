import type { Metadata } from 'next'
import CarroHeroSection from '@/components/CarroHeroSection'
import CarroContentSection from '@/components/CarroContentSection'
import CarroProductsSection from '@/components/CarroProductsSection'

export const metadata: Metadata = {
  title: 'Tiled Collection - Custom Tables',
  description: 'Explore our Tiled collection of handcrafted custom dining and coffee tables. Made in Los Angeles with premium materials and traditional craftsmanship.',
  keywords: ['custom tables', 'dining tables', 'coffee tables', 'handcrafted furniture', 'Los Angeles', 'Squarage Studio', 'Tiled'],
  alternates: {
    canonical: 'https://www.squarage.com/collections/tiled',
  },
  openGraph: {
    title: 'Tiled Collection - Custom Tables',
    description: 'Handcrafted custom tables combining traditional craftsmanship with contemporary design.',
    images: ['/images/carro/header.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tiled Collection - Custom Tables',
    description: 'Handcrafted custom tables combining traditional craftsmanship with contemporary design.',
    images: ['/images/carro/header.jpg'],
  },
}

export default function CarroPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <CarroHeroSection />
      
      {/* Products Section */}
      <CarroProductsSection />
      
      {/* Content Section */}
      <CarroContentSection />
    </main>
  )
}