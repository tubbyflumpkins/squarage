import { Metadata, Suspense } from 'next'
import CustomerServicePage from '@/components/CustomerServicePage'

export const metadata: Metadata = {
  title: 'Customer Service | Squarage Studio',
  description: 'Customer service policies including returns, warranty, shipping, and more for Squarage Studio custom furniture.',
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