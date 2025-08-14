'use client'

import Image from 'next/image'

export default function HeroStatic() {
  return (
    <section className="relative h-[250px] sm:h-[350px] md:h-[76.5vh] w-full overflow-hidden">
      {/* Static Hero Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-2-processed.jpg"
          alt="Squarage Studio - Functional Art & Design"
          fill
          className="object-cover object-[center_66%] scale-[1.4] md:scale-150"
          priority
          sizes="100vw"
          quality={85}
        />
      </div>
    </section>
  )
}