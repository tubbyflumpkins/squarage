'use client'

import Link from 'next/link'

export default function CustomProjectSection() {
  return (
    <section className="bg-squarage-yellow md:bg-squarage-green">
      <div className="bg-squarage-yellow md:bg-squarage-green py-8 md:py-12 lg:py-14 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        {/* Title */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-neue-haas font-black text-white mb-4 md:mb-8">
          Want a Custom Piece?
        </h2>
        
        {/* Button - Green on mobile with blue hover, Yellow on desktop with blue hover */}
        <Link
          href="/custom"
          className="inline-block bg-squarage-green md:bg-squarage-yellow font-bold font-neue-haas text-lg sm:text-3xl md:text-4xl py-2 px-5 md:py-4 md:px-8 border-2 border-squarage-green md:border-squarage-yellow hover:bg-squarage-blue hover:border-squarage-blue hover:scale-105 transition-all duration-300 text-white"
        >
          Start Designing
        </Link>
        </div>
      </div>
    </section>
  )
}