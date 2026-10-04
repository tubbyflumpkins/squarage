import Link from 'next/link'
import BreathingShelf from '@/components/shelf/BreathingShelf'

// The Warped title blob, as on the collection rows
const BLOB_COLOR = '#4A9B4E'
const BLOB_RADIUS = '45% 55% 70% 30% / 60% 40% 60% 40%'

/**
 * Version A's Warped row: the shelf designer takes the half the photo had, and the blob's
 * half leads on to the collection. The halves are two links side by side (never one inside
 * the other), on the same sides as today's reversed Warped row.
 */
export default function WarpedDesignerRow() {
  return (
    <div className="grid grid-cols-1 md:flex md:flex-row-reverse items-stretch">
      {/* Designer half — first on a phone, the right half on desktop */}
      <Link
        href="/collections/warped/designer"
        className="group/designer flex flex-col items-center bg-cream py-5 md:h-[500px] md:w-1/2 md:py-6"
      >
        {/* Two lines until the half is wide enough for one */}
        <h2 className="px-4 md:px-6 text-center text-balance text-4xl leading-[1.05] lg:text-[length:clamp(1.75rem,2.8vw,3.25rem)] lg:leading-none font-black font-neue-haas text-squarage-black">
          Try Our Warped{' '}
          <br className="lg:hidden" />
          Shelf Designer
        </h2>

        {/* At its tallest the shelf fills this box top to bottom, so the headline and the
            button get their own space instead of floating over it. w-full for the same
            reason as the photo boxes in the other rows: the box's only child is absolutely
            positioned, and Safari would shrink it to nothing. */}
        <div className="relative w-full aspect-[4/3] md:aspect-auto md:flex-1 md:min-h-0">
          <BreathingShelf finish="Oak" className="absolute inset-0" />
        </div>

        {/* The /custom button, as a span: the whole half is the link */}
        <span className="mt-2 inline-block whitespace-nowrap bg-squarage-green font-bold font-neue-haas text-xl md:text-2xl lg:text-3xl py-3 px-8 lg:px-10 border-2 border-squarage-green group-hover/designer:bg-squarage-yellow group-hover/designer:border-squarage-yellow group-hover/designer:scale-105 transition-all duration-300 text-white">
          Start Designing
        </span>
      </Link>

      {/* Collection half — a compact strip on a phone (line on the left, blob on the right),
          the blob over the line on desktop */}
      <Link
        href="/collections/warped"
        className="group/browse flex flex-row-reverse flex-wrap items-center justify-center gap-x-[3vw] gap-y-1 bg-squarage-yellow px-[4vw] py-3 md:h-[500px] md:w-1/2 md:flex-col md:flex-nowrap md:gap-6 md:p-0"
      >
        <div
          className="px-[5vw] py-2 md:px-[clamp(2.5rem,4vw,4rem)] md:py-[clamp(1rem,1.6vw,1.8rem)] transition-transform duration-300 ease-out md:group-hover/browse:scale-110"
          style={{ backgroundColor: BLOB_COLOR, borderRadius: BLOB_RADIUS }}
        >
          <h2 className="text-center font-bold font-neue-haas text-white md:text-squarage-white text-[length:min(9.5vw,2.75rem)] md:text-[length:clamp(4rem,8vw,8rem)]">
            Warped
          </h2>
        </div>
        <p className="text-left md:text-center font-bold font-neue-haas text-white leading-[1.1] text-[length:min(6.4vw,1.875rem)] md:text-[length:clamp(1.75rem,2.6vw,2.75rem)]">
          or browse{' '}
          <br className="md:hidden" />
          the collection
        </p>
      </Link>
    </div>
  )
}
