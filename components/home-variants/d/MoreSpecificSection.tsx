'use client'

import Image from 'next/image'
import Link from 'next/link'

/** The bottom of /custom ("Need Something More Specific?"): green with a yellow
    button on a phone, yellow with a green button on desktop,
    with the homepage's green button. */
export default function MoreSpecificSection() {
  return (
    <section className="bg-squarage-green md:bg-squarage-yellow py-10 md:py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image */}
          <div className="aspect-[4/3] relative overflow-hidden">
            <Image
              src="/images/IMG_6122.jpeg"
              alt="Custom furniture craftsmanship"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-neue-haas text-white mb-4 leading-tight">
              Need Something More Specific?
            </h2>
            <p className="text-lg md:text-xl font-medium font-neue-haas text-white/90 mb-8 leading-relaxed">
              Have a unique vision in mind? We work directly with you to design and build custom furniture, spaces, and everything in between. Get in touch to start the conversation.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-squarage-yellow md:bg-squarage-green font-bold font-neue-haas text-lg sm:text-2xl md:text-3xl py-3 px-8 md:py-4 md:px-12 border-2 border-squarage-yellow md:border-squarage-green hover:bg-squarage-blue hover:border-squarage-blue hover:scale-105 transition-all duration-300 text-white"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
