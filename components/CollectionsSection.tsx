'use client'

import Image from 'next/image'
import Link from 'next/link'
import PoseBlob from '@/components/PoseBlob'

interface Collection {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  imageAlt: string
  href: string
  bgColor: string         // tailwind class for the right-side panel on desktop
  blobColor: string       // hex color for the title blob
  borderRadius: string    // organic blob shape
  // Mobile blob alignment relative to the image
  mobileBlobAlign: 'left' | 'right'
  // Mobile-only vertical compression for the blob (matches existing visual feel)
  mobileBlobScaleY: number
}

const collections: Collection[] = [
  {
    id: 'pose',
    title: 'Posé',
    subtitle: 'Chairs',
    description: 'The Mateo chair, three ways. Sculptural plywood seating handcrafted in Los Angeles.',
    image: '/images/pose/pose-homepage-v2.jpg',
    imageAlt: 'Posé Collection — Sculptural plywood chairs handcrafted in Los Angeles',
    href: '/collections/pose',
    bgColor: 'bg-squarage-yellow',
    blobColor: '#4A9B4E',
    borderRadius: '55% 65% 70% 60% / 70% 55% 60% 65%',
    mobileBlobAlign: 'right',
    mobileBlobScaleY: 0.875,
  },
  {
    id: 'warped',
    title: 'Warped',
    subtitle: 'Shelving & Storage',
    description: 'Natural wood shelving systems with smooth, wavy lines that add warmth and character to any space. Sculptural storage, custom built.',
    image: '/images/warped_side.jpg',
    imageAlt: 'Warped Collection — Organic curved wood shelving handcrafted in Los Angeles',
    href: '/collections/warped',
    bgColor: 'bg-squarage-yellow',
    blobColor: '#4A9B4E',
    borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
    mobileBlobAlign: 'right',
    mobileBlobScaleY: 0.875,
  },
  {
    id: 'tiled',
    title: 'Tiled',
    subtitle: 'Tables & Surfaces',
    description: 'Vibrant tiled surfaces that bring energy, texture, and a playful sense of style to your space.',
    image: '/images/collection-tiled-v2.jpg',
    imageAlt: 'Tiled Collection — Handcrafted custom tables with vibrant tiled surfaces',
    href: '/collections/tiled',
    bgColor: 'bg-squarage-yellow',
    blobColor: '#4A9B4E',
    borderRadius: '35% 65% 55% 45% / 60% 40% 65% 35%',
    mobileBlobAlign: 'left',
    mobileBlobScaleY: 0.75,
  },
]

// Each marquee chunk must be wider than any viewport so the -50% loop
// never shows a gap; non-breaking spaces at the phrase seams keep them
// from collapsing.
const MARQUEE_CHUNK = ('made in los angeles' + '\u00A0\u2022\u00A0').repeat(10)

export default function CollectionsSection() {
  return (
    <>
      {/* Green marquee banner */}
      <section className="bg-squarage-green overflow-hidden" aria-label="Made in Los Angeles">
        <div className="flex h-6 md:h-10 items-center whitespace-nowrap" aria-hidden="true">
          <div className="flex w-max animate-marquee motion-reduce:animate-none">
            <span className="text-lg md:text-4xl font-neue-haas font-black leading-none text-white">
              {MARQUEE_CHUNK}
            </span>
            <span className="text-lg md:text-4xl font-neue-haas font-black leading-none text-white">
              {MARQUEE_CHUNK}
            </span>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <div className="bg-white flex flex-col">
        {collections.map((collection, index) => {
          const reverseRow = index % 2 === 1
          // Warped image was originally horizontally flipped on desktop only
          const flipImage = collection.id === 'warped'
          return (
            <Link
              key={collection.id}
              href={collection.href}
              className="group block"
            >
              <div className="relative">
                <div className="w-full">
                  <div className={`grid grid-cols-1 md:flex ${reverseRow ? 'md:flex-row-reverse' : ''} items-stretch`}>
                    {/* Image side */}
                    {/* w-full is required on mobile: this aspect-ratio box is a grid
                        item whose children are ALL absolutely positioned (image wrapper
                        + blob), so it has no in-flow content. Without an explicit width,
                        Safari/WebKit shrink-wraps it to width:0 → height:0 and the whole
                        tile collapses (Chromium stretches it, hiding the bug). The
                        overflow-hidden that used to mask this was moved to the inner
                        wrapper in 0e9aad7. Do not remove w-full. */}
                    <div className="relative aspect-[100/70] w-full md:aspect-auto md:h-[500px] md:w-1/2">
                      {/* Inner wrapper clips the scaled image without clipping
                          the mobile title blob below, which intentionally
                          overhangs into the yellow banner. */}
                      <div className="absolute inset-0 overflow-hidden">
                        <Image
                          src={collection.image}
                          alt={collection.imageAlt}
                          fill
                          className={`object-cover ${flipImage ? '-scale-x-100 md:scale-x-100' : ''} ${
                            collection.id === 'pose'
                              ? // Anchor-tied framing (object-position + scale + matching origin).
                                // Base = mobile, md: = desktop. Set in /pose-debug.
                                'object-[50.0%_90.6%] [transform:scale(1.692)] [transform-origin:50.0%_90.6%] md:object-[49.9%_84.6%] md:[transform:scale(1.484)] md:[transform-origin:49.9%_84.6%]'
                              : ''
                          }`}
                          style={flipImage ? { objectPosition: '65% center' } : undefined}
                          quality={collection.id === 'pose' ? 90 : 75}
                          // Each tile image is full-width on mobile, half-width on desktop
                          // (md:w-1/2). Posé previously requested 100vw, over-fetching a
                          // full-width variant on desktop; align it with the other tiles.
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>


                      {/* Mobile blob overlay */}
                      <div
                        className={`absolute bottom-0 ${collection.mobileBlobAlign === 'right' ? 'right-0' : 'left-0'} z-50 md:hidden`}
                        style={{ transform: 'translateY(32%) scale(0.9)' }}
                      >
                        {collection.id === 'pose' ? (
                          <PoseBlob color={collection.blobColor}>
                            <div style={{ padding: '1.2rem 2.4rem' }}>
                              <h2 className="font-bold font-neue-haas text-white leading-none" style={{ fontSize: '2.75rem' }}>
                                {collection.title}
                              </h2>
                            </div>
                          </PoseBlob>
                        ) : (
                          <div className="relative">
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundColor: collection.blobColor,
                                borderRadius: collection.borderRadius,
                                transform: `scaleY(${collection.mobileBlobScaleY})`,
                              }}
                            />
                            <div className="relative z-10" style={{ padding: '0.9rem 2.4rem' }}>
                              <h2 className="font-bold font-neue-haas text-white" style={{ fontSize: '2.75rem' }}>
                                {collection.title}
                              </h2>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Text/blob side — mobile shows compact yellow banner, desktop shows blob */}
                    <div className={`bg-squarage-yellow md:${collection.bgColor} relative flex items-center justify-center py-3 px-4 md:p-0 md:w-1/2`}>
                      <div className="hidden md:flex md:items-center md:justify-center md:w-full md:h-full">
                        {collection.id === 'pose' ? (
                          <PoseBlob
                            color={collection.blobColor}
                            className="transition-transform duration-300 ease-out group-hover:scale-110"
                          >
                            <div
                              className="text-center"
                              style={{ padding: 'clamp(1.1rem, 1.6vw, 1.8rem) clamp(2.5rem, 4vw, 4rem)' }}
                            >
                              <h2
                                className="font-bold font-neue-haas text-squarage-white leading-none"
                                style={{ fontSize: 'clamp(4rem, 8vw, 8rem)' }}
                              >
                                {collection.title}
                              </h2>
                            </div>
                          </PoseBlob>
                        ) : (
                          <div className="relative group/blob">
                            <div
                              className="transition-transform duration-300 ease-out group-hover/blob:scale-110"
                              style={{
                                backgroundColor: collection.blobColor,
                                borderRadius: collection.borderRadius,
                                padding: 'clamp(1rem, 1.6vw, 1.8rem) clamp(2.5rem, 4vw, 4rem)',
                              }}
                            >
                              <div className="text-center">
                                <h2
                                  className="font-bold font-neue-haas text-squarage-white"
                                  style={{ fontSize: 'clamp(4rem, 8vw, 8rem)' }}
                                >
                                  {collection.title}
                                </h2>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
