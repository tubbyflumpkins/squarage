import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Squarage Studio for custom furniture inquiries, collaborations, or to visit our Los Angeles workshop. We create bespoke pieces tailored to your space.',
  alternates: {
    canonical: 'https://squaragestudio.com/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}