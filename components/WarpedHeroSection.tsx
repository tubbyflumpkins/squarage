'use client'

import { useState, useEffect } from 'react'

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
    <section className="relative h-[42vh] md:h-[70vh] w-full overflow-visible bg-cream">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/collection-shelves.jpg)',
            backgroundPosition: isMobile ? 'center center' : 'center center',
          }}
        />
      </div>

      {/* Organic Blob Overlay with Text */}
      <div 
        className="absolute bottom-0 right-0 w-full z-50 flex items-end justify-end px-6 md:px-12"
        style={{ transform: 'translateY(calc(50% - 2vw)) translateX(-3vw) scale(clamp(1, 1.2, 1.4))' }}
      >
        <div 
          className="mr-[6%]"
          style={{
            backgroundColor: '#60432F',
            borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
            padding: 'clamp(1.2rem, 1.8vw, 1.8rem) clamp(3rem, 4vw, 4rem)'
          }}
        >
          <div className="text-center">
            <h1 
              className="font-bold font-neue-haas text-white"
              style={{
                fontSize: 'clamp(4rem, 8vw, 8rem)'
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