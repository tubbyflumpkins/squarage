import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold font-neue-haas text-gray-900 mb-8">404</h1>
        <h2 className="text-2xl font-neue-haas text-gray-700 mb-6">Product Not Found</h2>
        <p className="text-lg font-neue-haas text-gray-600 mb-8 max-w-md">
          The product you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="space-x-4">
          <Link 
            href="/collections/tiled"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-neue-haas hover:bg-gray-800 transition-colors"
          >
            Browse Products
          </Link>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-neue-haas hover:border-gray-400 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}