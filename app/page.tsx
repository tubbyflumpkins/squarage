import { Metadata } from 'next'
import HeroStatic from '@/components/HeroStatic'
import CollectionsSection from '@/components/CollectionsSection'
import CustomProjectSection from '@/components/CustomProjectSection'
import AboutSection from '@/components/AboutSection'
import type { ComponentType } from 'react'
import HomeA from '@/components/home-variants/a/HomeA'
import HomeB from '@/components/home-variants/b/HomeB'
import HomeC from '@/components/home-variants/c/HomeC'
import VariantSwitcher from '@/components/home-variants/VariantSwitcher'

export const metadata: Metadata = {
  title: { absolute: 'Squarage Studio — Custom Furniture Made in Los Angeles' },
  description: 'Squarage Studio creates handcrafted functional art and custom furniture in Los Angeles. Browse our collections of tables, shelves, chairs, and unique design objects.',
  keywords: ['squarage', 'squarage studio', 'custom furniture LA', 'handmade furniture Los Angeles'],
  alternates: {
    canonical: 'https://www.squarage.com',
  },
}

// Temporary: the homepage versions under review, at /?v=a, /?v=b, /?v=c.
// Plain / is today's page; the switcher shows on every version. Goes when one is picked.
const VARIANTS: Record<string, ComponentType> = { a: HomeA, b: HomeB, c: HomeC }

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ v?: string | string[] }>
}) {
  const { v } = await searchParams
  const version = typeof v === 'string' ? v.toLowerCase() : undefined
  const Variant = version ? VARIANTS[version] : undefined

  if (Variant) {
    return (
      <main className="min-h-screen bg-cream">
        <Variant />
        <VariantSwitcher current={version!} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <VariantSwitcher current="current" />
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