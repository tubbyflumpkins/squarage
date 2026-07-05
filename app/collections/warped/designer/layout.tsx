import type { Metadata } from 'next'
import StructuredData, { generateBreadcrumbSchema } from '@/components/StructuredData'

export const metadata: Metadata = {
  title: '3D Shelf Designer - Design Custom Warped Shelves',
  description: 'Design custom shelving to your exact dimensions with our free 3D tool. Choose height, width, depth, wood finish, and shelf count — modular designs that fit any space. Request a quote, handcrafted in LA.',
  keywords: ['squarage designer', 'custom shelf designer', '3D shelf configurator', 'warped shelf builder', 'design custom shelves online', 'custom furniture tool', 'interactive shelf designer', 'custom dimension shelving', 'modular shelves', 'shelving for any space', 'made to measure shelves', 'custom size shelf', 'modular wall shelving'],
  openGraph: {
    title: '3D Shelf Designer - Design Custom Warped Shelves | Squarage Studio',
    description: 'Design your own custom warped shelf with our free interactive 3D configurator. Choose dimensions, wood finishes, and request a quote.',
    images: ['/images/collection-warped.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D Shelf Designer - Design Custom Warped Shelves',
    description: 'Design your own custom warped shelf with our free interactive 3D configurator.',
    images: ['/images/collection-warped.jpg'],
  },
  alternates: {
    canonical: 'https://www.squarage.com/collections/warped/designer',
  },
}

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Squarage Warped Shelf Designer',
  description: 'Interactive 3D tool for designing custom warped shelves. Choose dimensions, wood finishes, and shelf count, then request a quote.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  url: 'https://www.squarage.com/collections/warped/designer',
  provider: {
    '@type': 'Organization',
    name: 'Squarage Studio',
    url: 'https://www.squarage.com',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://www.squarage.com' },
  { name: 'Warped Collection', url: 'https://www.squarage.com/collections/warped' },
  { name: 'Designer', url: 'https://www.squarage.com/collections/warped/designer' },
])

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={webApplicationSchema} />
      <StructuredData data={breadcrumbSchema} />
      {children}
    </>
  )
}
