import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom',
  description: 'Design your own warped shelf or commission a custom furniture piece from Squarage Studio. Use our interactive 3D designer or get in touch for something unique.',
  alternates: {
    canonical: 'https://squarage.com/custom',
  },
  openGraph: {
    title: 'Custom | Squarage Studio',
    description: 'Design your own warped shelf or commission a custom furniture piece. Made in Los Angeles with premium materials.',
  },
}

export default function CustomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
