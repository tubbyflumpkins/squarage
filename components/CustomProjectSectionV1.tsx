'use client'

import Link from 'next/link'

export default function CustomProjectSectionV1() {
  return (
    <section className="bg-squarage-black py-10 md:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
          {/* Left side - Question */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-neue-haas font-medium text-white">
            Want a Custom Piece?
          </h2>
          
          {/* Right side - CTA */}
          <Link
            href="/custom-projects"
            className="group flex items-center gap-3 text-white hover:text-squarage-yellow transition-colors duration-300"
          >
            <span className="text-xl md:text-2xl font-neue-haas">Start Designing</span>
            <svg 
              className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:translate-x-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}