import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon | Squarage Studio',
  description: 'New collections are coming soon. Stay tuned for handcrafted furniture and distinctive design pieces.',
  keywords: ['coming soon', 'handcrafted furniture', 'Los Angeles', 'Squarage Studio', 'collections'],
  openGraph: {
    title: 'Coming Soon | Squarage Studio',
    description: 'New collections coming soon from Squarage Studio.',
    type: 'website',
  },
}

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mb-8">
          {/* Mobile: Two lines */}
          <div className="md:hidden">
            <div className="inline-flex items-center gap-2 mb-2">
              {'Coming'.split('').map((letter, index) => (
                <span
                  key={index}
                  className="text-5xl font-neue-haas font-black leading-none relative"
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">{letter}</span>
                  <span className="relative z-10 text-squarage-black">{letter}</span>
                </span>
              ))}
            </div>
            <div className="inline-flex items-center gap-2">
              {'Soon'.split('').map((letter, index) => (
                <span
                  key={index + 6}
                  className="text-5xl font-neue-haas font-black leading-none relative"
                  style={{
                    animationDelay: `${(index + 7) * 0.1}s`
                  }}
                >
                  <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">{letter}</span>
                  <span className="relative z-10 text-squarage-black">{letter}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Desktop: One line */}
          <div className="hidden md:inline-flex items-center gap-2">
            {'Coming Soon'.split('').map((letter, index) => {
              if (letter === ' ') {
                return <div key={index} className="w-6"></div>
              }
              return (
                <span
                  key={index}
                  className="text-8xl font-neue-haas font-black leading-none relative"
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
        
        <p className="text-xl md:text-3xl font-medium font-neue-haas text-squarage-black mb-8 max-w-3xl mx-auto">
          Whoa! You&apos;re a little bit early.<br className="md:hidden" /> Check back soon.
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-3">
          <p className="text-lg md:text-2xl font-neue-haas text-brown-medium text-center">
            For updates stay tuned<br className="md:hidden" /> on our Instagram
          </p>
          <a 
            href="https://instagram.com/squaragestudio"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group hover:scale-125 transition-all duration-300"
            aria-label="Follow us on Instagram"
          >
            <svg className="absolute w-8 h-8 md:w-10 md:h-10 text-squarage-yellow transform translate-x-1 translate-y-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <svg className="w-8 h-8 md:w-10 md:h-10 text-brown-medium group-hover:text-squarage-red relative z-10 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z"/>
            </svg>
          </a>
        </div>
      </div>
    </main>
  )
}