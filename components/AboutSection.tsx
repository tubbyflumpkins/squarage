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
            
            {/* About Text - Preserved from original */}
            <div className="space-y-6 text-xl md:text-2xl font-medium font-neue-haas text-brown-medium leading-relaxed">
              <p>
                Squarage Studio is a Los Angeles-based design studio focused on creating 
                functional art and design pieces. Founded by Dylan and Thomas, we specialize 
                in custom furniture that bridges the gap between form and function.
              </p>
              
              <p>
                Our approach combines traditional craftsmanship with contemporary design 
                principles, resulting in pieces that are both aesthetically striking and 
                built to last. Every item is carefully considered and meticulously crafted 
                in our Los Angeles workshop.
              </p>
              
              <p>
                We believe that good design should enhance daily life while telling a story. 
                Each piece we create reflects our commitment to quality, sustainability, and 
                the timeless appeal of well-made objects.
              </p>
            </div>

            {/* Call to Action */}
            <div className="mt-4 text-center md:text-left">
              <Link
                href="/contact"
                className="inline-block bg-squarage-green font-bold font-neue-haas text-4xl py-4 px-8 border-2 border-squarage-green hover:bg-squarage-blue hover:border-squarage-blue hover:scale-105 transition-all duration-300 relative"
              >
                <span className="absolute inset-0 flex items-center justify-center text-squarage-yellow transform translate-x-0.5 translate-y-0.5">
                  Contact Us
                </span>
                <span className="relative z-10 text-white">
                  Contact Us
                </span>
              </Link>
            </div>

          </div>

          {/* About Image */}
          <div className="relative">
            <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
              <Image
                src="/images/IMG_1286.jpg"
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