import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom Furniture & Modular Shelf Designer',
  description: 'Commission custom furniture or design modular shelving to your exact dimensions with our 3D configurator. Every piece built to fit your space, handcrafted in Los Angeles by Squarage Studio.',
  keywords: ['custom dimension shelving', 'modular shelves', 'shelving for any space', 'made to measure shelves', 'custom size shelf', 'modular wall shelving', 'custom furniture LA', 'bespoke furniture'],
  alternates: {
    canonical: 'https://squarage.com/custom',
  },
  openGraph: {
    title: 'Custom Furniture & Modular Shelf Designer',
    description: 'Commission custom furniture or design modular shelving to your exact dimensions. Every piece handcrafted in Los Angeles.',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function CustomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
