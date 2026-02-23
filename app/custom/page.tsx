'use client'

import Image from 'next/image'
import Link from 'next/link'
import ShelfViewerSlot from '@/components/shelf/ShelfViewerSlot'

export default function CustomPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Section 1: Warped Shelf Designer Preview */}
      <section className="pt-24 md:pt-28 pb-8 md:pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Title with Warped blob — floats over the 3D view */}
          <h1 className="relative z-10 text-4xl md:text-6xl lg:text-7xl font-black font-neue-haas text-squarage-black text-center mb-[-1em] md:mb-[-0.6em] flex flex-wrap items-center justify-center gap-x-3 md:gap-x-4">
            <span>Use Our</span>
            <span
              className="inline-block text-white leading-none"
              style={{
                backgroundColor: '#4A9B4E',
                borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
                padding: '0.25em 0.45em 0.3em',
              }}
            >
              Warped
            </span>
            <span>Shelf Designer</span>
          </h1>

          {/* 3D Preview — large, fills width */}
          <ShelfViewerSlot
            className="w-full aspect-[4/3] md:aspect-[2/1] mb-8 md:mb-10"
            config={{
              isCorner: true,
              width: 45,
              height: 24,
              depth: 10,
              length: 36,
              shelfCount: 3,
              columnCount: 4,
              roundLeft: false,
              roundRight: false,
              amplitude: 2,
              shelfOffset: 2,
              columnOffset: 8,
              columnAngle: 52.5,
              finish: 'Oak',
              tilt: 25,
            }}
            rotationBounds={{ min: -30, max: 20 }}
          />

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link
              href="/collections/warped/designer"
              className="inline-block bg-squarage-green font-bold font-neue-haas text-lg sm:text-2xl md:text-3xl py-3 px-8 md:py-4 md:px-12 border-2 border-squarage-green hover:bg-squarage-yellow hover:border-squarage-yellow hover:scale-105 transition-all duration-300 text-white cursor-pointer"
            >
              Start Designing
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-squarage-black/15" />
      </div>

      {/* Section 2: Get in Touch */}
      <section className="py-12 md:py-20 px-6">
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-neue-haas text-squarage-black mb-4 leading-tight">
                Need Something More Specific?
              </h2>
              <p className="text-lg md:text-xl font-medium font-neue-haas text-squarage-black/70 mb-8 leading-relaxed">
                Have a unique vision in mind? We work directly with you to design and build custom furniture pieces tailored to your space. Get in touch to start the conversation.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-squarage-yellow font-bold font-neue-haas text-lg sm:text-2xl md:text-3xl py-3 px-8 md:py-4 md:px-12 border-2 border-squarage-yellow hover:bg-squarage-green hover:border-squarage-green hover:scale-105 transition-all duration-300 text-white"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
