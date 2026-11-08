'use client'

import Image from 'next/image'
import Link from 'next/link'
import PoseBlob from '@/components/PoseBlob'
import WarpedSplitRow from './WarpedSplitRow'

interface Collection {
  id: string
  title: string
  // What is inside the collection: the small second line in the title blob
  label: string
  subtitle: string
  description: string
  image: string
  imageAlt: string
  href: string
  bgColor: string         // tailwind class for the right-side panel on desktop
  blobColor: string       // hex color for the title blob
  borderRadius: string    // organic blob shape
  // Blob padding in em of the title size, set per shape so the label line
  // stays clear of the blob's curved lower edge
  blobPadding: string
  mobileBlobPadding: string
  // Mobile blob alignment relative to the image
  mobileBlobAlign: 'left' | 'right'
  // How far the mobile blob is pushed down, to hang over the yellow banner
  mobileBlobOverhang: string
}

// Posé and Tiled. The Warped row between them is WarpedSplitRow.
const pose: Collection = {
  id: 'pose',
  title: 'Posé',
  label: 'Shop chairs',
  subtitle: 'Chairs',
  description: 'The Mateo chair, three ways. Sculptural plywood seating handcrafted in Los Angeles.',
  image: '/images/pose/pose-homepage-v2.jpg',
  imageAlt: 'Posé Collection — Sculptural plywood chairs handcrafted in Los Angeles',
  href: '/collections/pose',
  bgColor: 'bg-squarage-yellow',
  blobColor: '#4A9B4E',
  borderRadius: '55% 65% 70% 60% / 70% 55% 60% 65%',
  blobPadding: '0.26em 0.5em 0.33em',
  mobileBlobPadding: '0.36em 0.87em 0.45em',
  mobileBlobAlign: 'right',
  mobileBlobOverhang: '29%',
}

const tiled: Collection = {
  id: 'tiled',
  title: 'Tiled',
  label: 'Shop tables',
  subtitle: 'Tables & Surfaces',
  description: 'Vibrant tiled surfaces that bring energy, texture, and a playful sense of style to your space.',
  image: '/images/collection-tiled-v2.jpg',
  imageAlt: 'Tiled Collection — Handcrafted custom tables with vibrant tiled surfaces',
  href: '/collections/tiled',
  bgColor: 'bg-squarage-yellow',
  blobColor: '#4A9B4E',
  borderRadius: '35% 65% 55% 45% / 60% 40% 65% 35%',
  blobPadding: '0.36em 0.5em 0.4em',
  mobileBlobPadding: '0.28em 0.87em 0.39em',
  mobileBlobAlign: 'left',
  mobileBlobOverhang: '23%',
}

// Each marquee chunk must be wider than any viewport so the -50% loop
// never shows a gap; non-breaking spaces at the phrase seams keep them
// from collapsing.
const MARQUEE_CHUNK = ('made in los angeles' + '\u00A0\u2022\u00A0').repeat(10)

interface BlobTextProps {
  collection: Collection
  fontSize: string    // the title's size; padding and label are in em of it
  padding: string
  labelSize: string
  colorClass: string
}

// The title and the label under it. Everything is sized from the title, so the
// pair scales as one and sits in the same place in the blob at every width.
function BlobText({ collection, fontSize, padding, labelSize, colorClass }: BlobTextProps) {
  return (
    <div className="text-center" style={{ fontSize, padding }}>
      <h2 className={`font-bold font-neue-haas leading-none ${colorClass}`}>
        {collection.title}
      </h2>
      <p
        className={`font-bold font-neue-haas leading-none whitespace-nowrap ${colorClass}`}
        style={{ fontSize: labelSize }}
      >
        {collection.label}
      </p>
    </div>
  )
}

function CollectionRow({ collection }: { collection: Collection }) {
  const mobileBlobText = (
    <BlobText
      collection={collection}
      fontSize="2.75rem"
      padding={collection.mobileBlobPadding}
      labelSize="0.35em"
      colorClass="text-white"
    />
  )
  const desktopBlobText = (
    <BlobText
      collection={collection}
      fontSize="clamp(4rem, 8vw, 8rem)"
      padding={collection.blobPadding}
      labelSize="0.25em"
      colorClass="text-squarage-white"
    />
  )

  return (
    <Link
      href={collection.href}
      className="group block"
    >
      <div className="relative">
        <div className="w-full">
          <div className="grid grid-cols-1 md:flex items-stretch">
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
                  className={`object-cover ${
                    collection.id === 'pose'
                      ? // Anchor-tied framing (object-position + scale + matching origin).
                        // Base = mobile, md: = desktop. Set in /pose-debug.
                        'object-[50.0%_90.6%] [transform:scale(1.692)] [transform-origin:50.0%_90.6%] md:object-[49.9%_84.6%] md:[transform:scale(1.484)] md:[transform-origin:49.9%_84.6%]'
                      : ''
                  }`}
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
                style={{ transform: `translateY(${collection.mobileBlobOverhang}) scale(0.9)` }}
              >
                {collection.id === 'pose' ? (
                  <PoseBlob color={collection.blobColor}>
                    {mobileBlobText}
                  </PoseBlob>
                ) : (
                  <div
                    style={{
                      backgroundColor: collection.blobColor,
                      borderRadius: collection.borderRadius,
                    }}
                  >
                    {mobileBlobText}
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
                    {desktopBlobText}
                  </PoseBlob>
                ) : (
                  <div className="relative group/blob">
                    <div
                      className="transition-transform duration-300 ease-out group-hover/blob:scale-110"
                      style={{
                        backgroundColor: collection.blobColor,
                        borderRadius: collection.borderRadius,
                      }}
                    >
                      {desktopBlobText}
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
}

export default function CollectionRows() {
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
        <CollectionRow collection={pose} />
        <WarpedSplitRow />
        <CollectionRow collection={tiled} />
      </div>
    </>
  )
}
