'use client'

import Image from 'next/image'
import Link from 'next/link'
import BreathingShelf from '@/components/shelf/BreathingShelf'

const BLOB_COLOR = '#4A9B4E'
const BLOB_SHAPE = '45% 55% 70% 30% / 60% 40% 60% 40%'

/**
 * The Warped row as two links side by side: the photo opens the collection and the
 * cream half opens the shelf designer. On a phone the photo comes first and the
 * designer part sits under it.
 */
export default function WarpedSplitRow() {
  return (
    <div className="grid grid-cols-1 md:flex md:flex-row-reverse items-stretch">
      {/* Photo half: the collection */}
      {/* w-full is required on mobile: this aspect-ratio box is a grid
          item whose children are ALL absolutely positioned (image wrapper
          + blob), so it has no in-flow content. Without an explicit width,
          Safari/WebKit shrink-wraps it to width:0 → height:0 and the whole
          tile collapses (Chromium stretches it, hiding the bug).
          Do not remove w-full. */}
      <Link
        href="/collections/warped"
        className="group relative block aspect-[100/70] w-full md:aspect-auto md:h-[560px] md:w-1/2"
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/warped_side.jpg"
            alt="Warped Collection — Organic curved wood shelving handcrafted in Los Angeles"
            fill
            // Horizontally flipped on mobile only, as on today's homepage
            className="object-cover -scale-x-100 md:scale-x-100"
            style={{ objectPosition: '65% center' }}
            quality={75}
            // Full-width on mobile, half-width on desktop (md:w-1/2)
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Title blob, wholly inside the photo's lower right corner at every width
            (there is no yellow banner under this row to overhang into). It scales
            from that corner, so neither the mobile 0.9 nor the hover 1.1 can push
            it past the photo's edge. Padding is in em of the title size, set so
            both lines stay clear of the blob's curved edge. */}
        <div
          className="absolute bottom-2.5 right-3 z-10 origin-bottom-right scale-90 p-[0.42em_0.92em_0.54em] text-center text-[2.75rem] text-white transition-transform duration-300 ease-out md:bottom-6 md:right-6 md:scale-100 md:p-[0.45em_0.6em_0.42em] md:text-[length:clamp(3.25rem,5.5vw,5.5rem)] md:text-squarage-white md:group-hover:scale-110"
          style={{ backgroundColor: BLOB_COLOR, borderRadius: BLOB_SHAPE }}
        >
          <h2 className="font-bold font-neue-haas leading-none">Warped</h2>
          <p className="mt-[0.29em] whitespace-nowrap font-bold font-neue-haas text-[0.35em] leading-none md:mt-[0.28em] md:text-[0.29em]">
            Browse the collection
          </p>
        </div>
      </Link>

      {/* Designer half: headline, shelf, button, stacked so nothing overlaps */}
      <Link
        href="/collections/warped/designer"
        className="group flex flex-col items-center bg-cream px-4 pt-7 pb-8 md:h-[560px] md:w-1/2 md:px-6 md:py-8"
      >
        {/* Two lines on a phone, one line beside the photo */}
        <h2 className="text-balance text-center font-black font-neue-haas text-4xl leading-[1.05] text-squarage-black md:text-[length:clamp(1.25rem,2.8vw,3rem)]">
          Try Our Warped
          <br className="md:hidden" /> Shelf Designer
        </h2>

        {/* The shelf fills this box and nearly reaches its top edge when fully
            grown, so the headline and button keep out of it. 4/3 on a phone;
            beside the photo it takes whatever height the other two leave. */}
        <div className="relative mt-1 aspect-[4/3] w-full md:mt-0 md:aspect-auto md:min-h-0 md:flex-1">
          <BreathingShelf finish="Oak" className="absolute inset-0" />
        </div>

        <span className="mt-2 inline-block whitespace-nowrap border-2 border-squarage-green bg-squarage-green px-8 py-3 font-bold font-neue-haas text-lg text-white transition-all duration-300 group-hover:scale-105 group-hover:border-squarage-yellow group-hover:bg-squarage-yellow sm:text-2xl">
          Start Designing
        </span>
      </Link>
    </div>
  )
}
