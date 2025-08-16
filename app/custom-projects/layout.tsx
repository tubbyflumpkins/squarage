import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom Projects',
  description: 'Commission custom furniture from Squarage Studio. Our 4-step process takes your vision from concept to completion with personalized design, premium materials, and expert craftsmanship.',
  alternates: {
    canonical: 'https://squaragestudio.com/custom-projects',
  },
  openGraph: {
    title: 'Custom Furniture Projects | Squarage Studio',
    description: 'Create your dream furniture piece with our custom design process. Made in Los Angeles with premium materials.',
  },
}

export default function CustomProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}