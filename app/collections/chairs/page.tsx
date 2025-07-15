import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chairs Collection - Coming Soon | Squarage Studio',
  description: 'Our handcrafted chairs collection is coming soon. Stay tuned for ergonomic seating with distinctive design.',
  keywords: ['chairs', 'seating', 'ergonomic', 'handcrafted furniture', 'Los Angeles', 'Squarage Studio', 'coming soon'],
  openGraph: {
    title: 'Chairs Collection - Coming Soon | Squarage Studio',
    description: 'Handcrafted chairs with distinctive design coming soon.',
    type: 'website',
  },
}

export default function ChairsPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2">
            {'Coming Soon'.split('').map((letter, index) => {
              if (letter === ' ') {
                return <div key={index} className="w-6"></div>
              }
              return (
                <span
                  key={index}
                  className="text-7xl md:text-8xl font-neue-haas font-black leading-none relative"
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">{letter}</span>
                  <span className="relative z-10 text-squarage-black">{letter}</span>
                </span>
              )
            })}
          </div>
        </div>
        
        <p className="text-2xl md:text-3xl font-medium font-neue-haas text-squarage-black mb-8 max-w-3xl mx-auto">
          Whoa! You&apos;re a little bit early. Check back soon.
        </p>
        
        <div className="flex items-center justify-center gap-3">
          <p className="text-xl md:text-2xl font-neue-haas text-brown-medium">
            For updates stay tuned on our Instagram
          </p>
          <a 
            href="https://instagram.com/squaragestudio"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group hover:scale-125 transition-all duration-300"
            aria-label="Follow us on Instagram"
          >
            <svg className="absolute w-8 h-8 md:w-10 md:h-10 text-squarage-yellow transform translate-x-1 translate-y-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z"/>
            </svg>
            <svg className="w-8 h-8 md:w-10 md:h-10 text-brown-medium group-hover:text-squarage-red relative z-10 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </main>
  )
}