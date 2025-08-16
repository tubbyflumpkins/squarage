import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Custom Furniture',
  description: 'Shop handcrafted tables, shelves, chairs, and design objects from Squarage Studio. Each piece is made to order in Los Angeles with premium materials and attention to detail.',
  alternates: {
    canonical: 'https://squaragestudio.com/products',
  },
  openGraph: {
    title: 'Shop Custom Furniture | Squarage Studio',
    description: 'Discover our collection of handcrafted functional art and furniture. Made in Los Angeles with premium materials.',
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