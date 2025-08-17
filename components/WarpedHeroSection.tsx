'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function WarpedHeroSection() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="relative w-full overflow-visible bg-cream" style={{ height: isMobile ? '35vh' : 'clamp(50vh, 45vh + 25vw, 90vh)' }}>
      {/* Hero Background Image - Using Next.js Image for optimization */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/collection-warped.jpg"
          alt="Warped Collection Hero"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: isMobile ? 'center 60%' : 'center 60%',
          }}
        />
      </div>

      {/* Organic Blob Overlay with Text */}
      <div 
        className={`absolute bottom-0 z-50 ${isMobile ? 'w-full flex justify-center px-4' : 'left-[25%]'}`}
        style={{ 
          transform: isMobile 
            ? 'translateY(calc(50% - 1rem)) scale(0.7)' 
            : 'translateY(calc(50% - 2vw)) translateX(-50%) scale(clamp(1, 1.1, 1.2))' 
        }}
      >
        <div
          style={{
            backgroundColor: '#4A9B4E',
            borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
            padding: isMobile 
              ? '1.5rem 2.5rem' 
              : 'clamp(1.2rem, 1.8vw, 1.8rem) clamp(3rem, 4vw, 4rem)'
          }}
        >
          <div className="text-center">
            <h1 
              className="font-bold font-neue-haas text-squarage-white"
              style={{
                fontSize: isMobile ? '3.5rem' : 'clamp(4rem, 8vw, 8rem)'
              }}
            >
              Warped
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}