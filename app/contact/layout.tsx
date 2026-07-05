import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Squarage Studio for custom furniture inquiries, collaborations, or to visit our Los Angeles workshop. We create bespoke pieces tailored to your space.',
  keywords: ['contact squarage', 'furniture inquiry', 'custom furniture quote'],
  alternates: {
    canonical: 'https://www.squarage.com/contact',
  },
  openGraph: {
    title: 'Contact Us | Squarage Studio',
    description: 'Get in touch for custom furniture inquiries, collaborations, or to visit our Los Angeles workshop.',
    images: ['/images/hero-main.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Squarage Studio',
    description: 'Get in touch for custom furniture inquiries, collaborations, or to visit our Los Angeles workshop.',
    images: ['/images/hero-main.jpg'],
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}