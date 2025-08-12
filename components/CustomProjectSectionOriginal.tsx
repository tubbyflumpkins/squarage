'use client'

import Link from 'next/link'

export default function CustomProjectSectionOriginal() {
  return (
    <section className="bg-squarage-blue p-4 md:p-0">
      <div className="bg-squarage-white md:bg-squarage-blue h-[15vh] md:h-auto md:py-12 lg:py-14 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        {/* Title */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-neue-haas font-black text-squarage-black md:text-white mb-2 md:mb-8">
          Want a Custom Piece?
        </h2>
        
        {/* Button - Green on mobile, Yellow on desktop */}
        <Link
          href="/custom-projects"
          className="inline-block bg-squarage-green md:bg-squarage-yellow font-bold font-neue-haas text-lg sm:text-3xl md:text-4xl py-2 px-5 md:py-4 md:px-8 border-2 border-squarage-green md:border-squarage-yellow hover:bg-squarage-yellow md:hover:bg-squarage-green hover:border-squarage-yellow md:hover:border-squarage-green hover:scale-105 transition-all duration-300 text-white"
        >
          Start Designing
        </Link>
        </div>
      </div>
    </section>
  )
}