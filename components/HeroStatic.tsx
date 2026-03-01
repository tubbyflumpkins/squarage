'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function HeroStatic() {
  return (
    <section className="relative h-[250px] sm:h-[350px] md:h-[calc(85vh-84px)] md:mt-[84px] w-full overflow-hidden">
      {/* Static Hero Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/home_hero.png"
          alt="Squarage Studio - Functional Art & Design"
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
          quality={85}
        />
      </div>
      
      {/* Clickable overlay */}
      <Link 
        href="/products" 
        className="absolute inset-0 z-10 block cursor-pointer"
        aria-label="View all products"
      />
    </section>
  )
}