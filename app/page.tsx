import { Metadata } from 'next'
import HeroStatic from '@/components/HeroStatic'
import CollectionsSection from '@/components/CollectionsSection'
import CustomProjectSection from '@/components/CustomProjectSection'
import AboutSection from '@/components/AboutSection'

export const metadata: Metadata = {
  title: { absolute: 'Squarage Studio — Custom Furniture Made in Los Angeles' },
  description: 'Squarage Studio creates handcrafted functional art and custom furniture in Los Angeles. Browse our collections of tables, shelves, chairs, and unique design objects.',
  keywords: ['squarage', 'squarage studio', 'custom furniture LA', 'handmade furniture Los Angeles'],
  alternates: {
    canonical: 'https://www.squarage.com',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Static Section */}
      <HeroStatic />
      
      {/* Collections Section */}
      <CollectionsSection />
      
      {/* Custom Project Section */}
      <CustomProjectSection />
      
      {/* About Section */}
      <AboutSection />
    </main>
  )
}