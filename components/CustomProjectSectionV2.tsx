'use client'

import Link from 'next/link'

export default function CustomProjectSectionV2() {
  return (
    <section className="relative bg-gradient-to-r from-squarage-yellow via-squarage-green to-squarage-blue py-20 md:py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Content */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-neue-haas font-black text-white mb-8 md:mb-12">
          Want a Custom Piece?
        </h2>
        
        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
          Let's bring your vision to life
        </p>
        
        <Link
          href="/custom-projects"
          className="inline-block bg-white text-squarage-black font-neue-haas font-bold text-xl md:text-2xl py-4 px-10 hover:bg-squarage-black hover:text-white transition-all duration-300 transform hover:scale-105"
        >
          Start Your Project
        </Link>
      </div>
    </section>
  )
}