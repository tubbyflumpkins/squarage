'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function HeroSlideshow() {
  return (
    <section className="relative h-[300px] sm:h-[350px] md:h-[85vh] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-2-processed.jpg"
          alt="Squarage Studio custom furniture and functional art pieces"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
        />
      </div>

      {/* Clickable overlay */}
      <Link
        href="/products"
        className="absolute inset-0 z-50 block cursor-pointer"
        aria-label="View all products"
      >
        <span className="sr-only">View all products</span>
      </Link>
    </section>
  )
}
