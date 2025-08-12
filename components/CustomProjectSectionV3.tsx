'use client'

import Link from 'next/link'

export default function CustomProjectSectionV3() {
  return (
    <section className="bg-cream py-12 md:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-squarage-green p-8 md:p-12 lg:p-16 relative">
          {/* Offset border effect */}
          <div className="absolute -top-2 -left-2 md:-top-3 md:-left-3 w-full h-full border-4 border-squarage-black"></div>
          
          {/* Content */}
          <div className="relative bg-squarage-green">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              {/* Left - Title */}
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-neue-haas font-black text-white leading-tight">
                  Want a<br />
                  Custom<br />
                  Piece?
                </h2>
              </div>
              
              {/* Right - Description and CTA */}
              <div className="text-white space-y-6">
                <p className="text-lg md:text-xl leading-relaxed">
                  Every space deserves furniture as unique as you are. Let's create something extraordinary together.
                </p>
                
                <Link
                  href="/custom-projects"
                  className="inline-flex items-center gap-4 group"
                >
                  <span className="bg-squarage-yellow text-white font-neue-haas font-bold text-lg md:text-xl py-3 px-6 border-2 border-squarage-yellow hover:bg-white hover:text-squarage-black hover:border-white transition-all duration-300">
                    Start Designing
                  </span>
                  <span className="text-3xl md:text-4xl animate-pulse">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}