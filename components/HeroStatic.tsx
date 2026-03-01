'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function HeroStatic() {
  return (
    <section className="relative h-[250px] sm:h-[350px] md:h-[75vh] w-full overflow-hidden">
      {/* Mobile Hero Image */}
      <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src="/images/home_hero_mobile.jpeg"
          alt="Squarage Studio - Functional Art & Design"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={85}
        />
      </div>
      {/* Desktop Hero Image */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <Image
          src="/images/home_hero.png"
          alt="Squarage Studio - Functional Art & Design"
          fill
          className="object-cover object-[center_10%]"
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