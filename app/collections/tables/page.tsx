import type { Metadata } from 'next'
import CarroHeroSection from '@/components/CarroHeroSection'
import CarroContentSection from '@/components/CarroContentSection'
import CarroProductsSection from '@/components/CarroProductsSection'

export const metadata: Metadata = {
  title: 'Carro Collection - Custom Tables | Squarage Studio',
  description: 'Explore our Carro collection of handcrafted custom dining and coffee tables. Made in Los Angeles with premium materials and traditional craftsmanship.',
  keywords: ['custom tables', 'dining tables', 'coffee tables', 'handcrafted furniture', 'Los Angeles', 'Squarage Studio', 'Carro'],
  openGraph: {
    title: 'Carro Collection - Custom Tables | Squarage Studio',
    description: 'Handcrafted custom tables combining traditional craftsmanship with contemporary design.',
    images: ['/images/carro/header.jpg'],
    type: 'website',
  },
}

export default function CarroPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <CarroHeroSection />
      
      {/* Content Section */}
      <CarroContentSection />
      
      {/* Products Section */}
      <CarroProductsSection />
    </main>
  )
}