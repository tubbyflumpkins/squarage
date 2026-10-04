'use client'

import Link from 'next/link'
import BreathingShelf from '@/components/shelf/BreathingShelf'

export default function DesignerBand() {
  return (
    // The bottom padding holds the part of the button that hangs below the viewer
    <section className="bg-cream px-6 pt-10 md:pt-12 pb-20 md:pb-24">
      {/* The whole band is one link: the button below is a styled span */}
      <Link href="/collections/warped/designer" className="group block max-w-7xl mx-auto">
        {/* Title with Warped blob — sits just over the top of the 3D view.
            At its tallest the shelf comes within 5.6% of the top of its box
            (measured from the geometry), so the overlap stays under that:
            less than on /custom, where the shelf never grows. The sizes keep
            the title on one line from about 1000px wide up. */}
        <h2 className="relative z-10 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black font-neue-haas text-squarage-black text-center mb-[-0.1em] md:mb-[-0.25em] flex flex-wrap items-center justify-center gap-x-3 md:gap-x-4">
          <span>Try Our</span>
          <span
            className="inline-block text-white"
            style={{
              backgroundColor: '#4A9B4E',
              borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
              padding: '0.35em 0.5em 0.4em',
            }}
          >
            Warped
          </span>
          <span>Shelf Designer</span>
        </h2>

        <div className="relative">
          {/* 3D preview — turns, grows and shrinks. The max-height keeps the
              band within one desktop screen: the box only gets wider than
              2/1, and the shelf is framed by the box's height either way. */}
          <BreathingShelf finish="Oak" className="w-full aspect-[4/3] md:aspect-[2/1] md:max-h-[65vh]" />

          {/* CTA Button — floating at the foot of the viewer. Its top edge is
              7% of the box above the bottom: at its tallest the shelf's feet
              stop 9% above it, so the two never meet. */}
          <div className="absolute inset-x-0 top-[93%] z-10 flex justify-center">
            <span className="inline-block whitespace-nowrap bg-squarage-green font-bold font-neue-haas text-lg sm:text-2xl md:text-3xl py-3 px-8 md:py-4 md:px-12 border-2 border-squarage-green group-hover:bg-squarage-yellow group-hover:border-squarage-yellow group-hover:scale-105 transition-all duration-300 text-white">
              Start Designing
            </span>
          </div>
        </div>
      </Link>
    </section>
  )
}
