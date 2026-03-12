import { Metadata } from 'next'
import { Suspense } from 'react'
import CustomerServicePage from '@/components/CustomerServicePage'

export const metadata: Metadata = {
  title: 'Customer Service',
  description: 'Shipping, returns, warranty, and FAQ for Squarage Studio custom furniture. Handcrafted in Los Angeles with premium materials — learn about our policies and care instructions.',
  alternates: {
    canonical: 'https://squarage.com/customer-service',
  },
  openGraph: {
    title: 'Customer Service | Squarage Studio',
    description: 'Shipping, returns, warranty, and FAQ for Squarage Studio custom furniture.',
    images: ['/images/hero-main.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Service | Squarage Studio',
    description: 'Shipping, returns, warranty, and FAQ for Squarage Studio custom furniture.',
    images: ['/images/hero-main.jpg'],
  },
}

function CustomerServiceContent() {
  return <CustomerServicePage />
}

export default function CustomerService() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream pt-24 md:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <h1 className="text-4xl md:text-5xl font-black font-neue-haas text-squarage-black mb-2">
            Customer Service
          </h1>
          <p className="text-gray-500 font-neue-haas mb-8 md:mb-12">Loading policies...</p>
        </div>
      </div>
    }>
      <CustomerServiceContent />
    </Suspense>
  )
}