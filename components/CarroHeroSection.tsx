'use client'

import { useState, useEffect } from 'react'

export default function CarroHeroSection() {
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
            backgroundImage: 'url(/images/carro/header.jpg)',
            backgroundPosition: isMobile ? 'center top' : 'center 25%',
            transform: 'scaleX(-1)'
          }}
        />
      </div>

      {/* Green Blob Overlay with Text */}
      <div 
        className="absolute bottom-0 right-0 w-full z-50 flex items-end justify-end px-6 md:px-12"
        style={{ transform: 'translateY(calc(50% - 2vw)) translateX(-3vw) scale(clamp(1, 1.2, 1.4))' }}
      >
        <div 
          className="bg-squarage-green max-w-xl mr-[6%]"
          style={{
            borderRadius: '35% 65% 55% 45% / 60% 40% 65% 35%',
            padding: 'clamp(0.5rem, 1vw, 0.9rem) clamp(2rem, 3.2vw, 3rem)'
          }}
        >
          <div className="text-center">
            <h1 
              className="font-bold font-neue-haas relative"
              style={{
                fontSize: 'clamp(4rem, 8vw, 8rem)'
              }}
            >
              <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">Tiled</span>
              <span className="relative z-10 text-white">Tiled</span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}