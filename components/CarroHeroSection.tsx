'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

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
    <section className="relative h-[58vh] md:h-[86vh] w-full overflow-visible bg-cream">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/carro/header.jpg"
          alt="Tiled Collection — Handcrafted custom tables with vibrant mosaic tile surfaces"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: isMobile ? 'center top' : 'center 25%',
            transform: 'scaleX(-1)'
          }}
        />
      </div>

      {/* Green Blob Overlay with Text */}
      <div 
        className="absolute bottom-0 right-0 w-full z-50 flex items-end justify-end px-6 md:px-12"
        style={{ transform: 'translateY(calc(50% - 2vw - 96px)) translateX(-3vw) scale(clamp(1, 1.2, 1.4))' }}
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
              className="font-bold font-neue-haas text-white"
              style={{
                fontSize: 'clamp(4rem, 8vw, 8rem)'
              }}
            >
              Tiled
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}