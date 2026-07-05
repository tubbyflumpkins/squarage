import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Custom Furniture',
  description: 'Shop handcrafted custom furniture from Squarage Studio. Custom-dimension shelving, tables, and design objects — each piece made to order in Los Angeles with premium materials.',
  keywords: ['shop furniture', 'custom tables', 'handcrafted shelves', 'designer furniture', 'custom dimension shelving', 'modular shelves', 'shelving for any space', 'made to measure shelves', 'custom size shelf', 'modular wall shelving'],
  alternates: {
    canonical: 'https://www.squarage.com/products',
  },
  openGraph: {
    title: 'Shop Custom Furniture | Squarage Studio',
    description: 'Shop handcrafted custom furniture. Custom-dimension shelving, tables, and design objects — made to order in Los Angeles.',
    images: ['/images/collection-tables.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Custom Furniture',
    description: 'Custom-dimension shelving, tables, and design objects — made to order in Los Angeles.',
    images: ['/images/collection-tables.jpg'],
  },
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}