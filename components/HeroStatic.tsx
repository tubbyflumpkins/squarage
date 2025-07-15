'use client'

import Image from 'next/image'

export default function HeroStatic() {
  return (
    <section className="relative h-[300px] sm:h-[350px] md:h-[85vh] w-full overflow-hidden">
      {/* Static Hero Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-main.jpg"
          alt="Squarage Studio - Functional Art & Design"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={85}
        />
      </div>
    </section>
  )
}