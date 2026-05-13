'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function AboutSection() {
  return (
    <section className="pt-8 sm:pt-12 md:pt-20 pb-20 px-6 bg-cream">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* About Content */}
          <div>
            <h2 className="text-5xl md:text-7xl font-bold font-neue-haas text-squarage-black mb-8 text-center md:text-left">
              About Us
            </h2>
            
            <div className="space-y-6 text-xl md:text-2xl font-medium font-neue-haas text-brown-medium leading-relaxed">
              <p>
                Squarage Studio is an LA based design studio focusing on creating functional art.
                All our pieces are designed in house by co-founder Dylan Selden, and manufactured
                locally.
              </p>

              <p>We aim to bring a sense of playfulness and fantasy into the home.</p>

              <p>
                Squarage was founded by Dylan Selden and Thomas Gareton, friends since pre-k.
                Our journey started in a sandbox in LA, and we're still playing in it.
              </p>
            </div>

            {/* Call to Action */}
            <div className="mt-4 md:mt-8 text-center md:text-left">
              <Link
                href="/contact"
                className="inline-block bg-squarage-green font-bold font-neue-haas text-4xl py-4 px-8 border-2 border-squarage-green hover:bg-squarage-blue hover:border-squarage-blue hover:scale-105 transition-all duration-300 text-white"
              >
                Contact Us
              </Link>
            </div>

          </div>

          {/* About Image */}
          <div className="relative">
            <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
              <Image
                src="/images/aboutus.jpg"
                alt="Squarage Studio Workshop"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            
          </div>
        </div>

      </div>
    </section>
  )
}