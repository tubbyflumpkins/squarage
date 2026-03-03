import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Squarage Studio for custom furniture inquiries, collaborations, or to visit our Los Angeles workshop. We create bespoke pieces tailored to your space.',
  keywords: ['contact squarage', 'furniture inquiry', 'custom furniture quote'],
  alternates: {
    canonical: 'https://squarage.com/contact',
  },
  openGraph: {
    title: 'Contact Us | Squarage Studio',
    description: 'Get in touch for custom furniture inquiries, collaborations, or to visit our Los Angeles workshop.',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}