'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function AboutSection() {
  return (
    <section className="py-20 px-6 bg-cream">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* About Content */}
          <div>
            <h2 className="text-4xl md:text-6xl font-bold font-neue-haas text-squarage-black mb-8">
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
            <div className="mt-8">
              <Link
                href="/about"
                className="inline-block px-6 py-3 border border-squarage-black text-lg font-medium font-neue-haas text-squarage-black hover:bg-squarage-green hover:text-white transition-all duration-300"
              >
                Learn More About Our Story
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

        {/* Custom Projects CTA */}
        <div className="mt-20 pt-16 border-t border-brown-light text-center">
          <h3 className="text-3xl md:text-4xl font-bold font-neue-haas text-squarage-black mb-6">
            Ready for a Custom Project?
          </h3>
          <p className="text-lg font-medium font-neue-haas text-brown-light mb-8 max-w-2xl mx-auto">
            We work closely with clients to bring their vision to life through 
            custom furniture and design solutions.
          </p>
          <Link
            href="/custom-projects"
            className="inline-block px-8 py-3 border border-squarage-black text-squarage-black font-medium font-neue-haas hover:bg-squarage-green hover:text-white transition-all duration-300"
          >
            Start a Custom Project
          </Link>
        </div>
      </div>
    </section>
  )
}