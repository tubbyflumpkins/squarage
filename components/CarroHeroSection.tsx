'use client'

import Image from 'next/image'

export default function CarroHeroSection() {
  return (
    <section className="relative h-[70vh] w-full overflow-visible bg-cream">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/carro/header.jpg"
          alt="Carro Collection - Custom Tables"
          fill
          className="object-cover"
          style={{ objectPosition: 'center 40%' }}
          priority
          sizes="100vw"
          quality={85}
        />
      </div>

      {/* Green Blob Overlay with Text */}
      <div 
        className="absolute bottom-0 left-0 w-full z-50 flex items-end justify-start px-6 md:px-12"
        style={{ transform: 'translateY(calc(50% - 2vw)) translateX(3vw) scale(clamp(1, 1.2, 1.4))' }}
      >
        <div 
          className="bg-squarage-green max-w-xl ml-[6%]"
          style={{
            borderRadius: '65% 35% 45% 55% / 40% 60% 35% 65%',
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