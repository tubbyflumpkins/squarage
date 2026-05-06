'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PoseBlob from '@/components/PoseBlob'

// Heavy R3F component — load only on the client.
const HeroChairTrio = dynamic(
  () => import('@/components/chair/RenderedChairView/HeroChairTrio'),
  { ssr: false, loading: () => null },
)

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
    image: '/images/collection-warped.jpg',
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
    image: '/images/collection-tiled.jpg',
    imageAlt: 'Tiled Collection — Handcrafted custom tables with vibrant tiled surfaces',
    href: '/collections/tiled',
    bgColor: 'bg-squarage-yellow',
    blobColor: '#4A9B4E',
    borderRadius: '35% 65% 55% 45% / 60% 40% 65% 35%',
    mobileBlobAlign: 'left',
    mobileBlobScaleY: 0.75,
  },
]

export default function CollectionsSection() {
  const [hoverAnimatingLetters, setHoverAnimatingLetters] = useState<Set<number>>(new Set())
  const [initialAnimationStarted] = useState(false)
  const [initialAnimationCompleted, setInitialAnimationCompleted] = useState(false)

  const randomDelays = useMemo(() => [
    0.1, 0.3, 0.6, 0.2, // MADE
    0.0, // space
    0.5, 0.4, // IN
    0.0, // space
    0.7, 0.15, 0.25, // LOS
    0.0, // space
    0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95 // ANGELES
  ], [])

  const handleLetterHover = (index: number) => {
    if (!hoverAnimatingLetters.has(index) && initialAnimationCompleted) {
      setHoverAnimatingLetters(prev => new Set(prev).add(index))
    }
  }

  const handleAnimationEnd = (index: number, isInitial: boolean = false) => {
    if (isInitial) {
      const maxDelay = Math.max(...randomDelays)
      setTimeout(() => {
        setInitialAnimationCompleted(true)
      }, maxDelay * 1000 + 1000)
    } else {
      setHoverAnimatingLetters(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  // Initial bounce animation disabled — keep code for later re-enable
  useEffect(() => {
    setInitialAnimationCompleted(true)
  }, [randomDelays])

  return (
    <>
      {/* Green animated header section */}
      <section className="bg-squarage-green">
        <div className="flex items-center justify-center min-h-0 sm:min-h-[80px] py-2 sm:py-0 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center">
              <div className="flex justify-center items-center w-full whitespace-nowrap">
                <div className="tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.25em] lg:tracking-[0.3em]">
                  {'MADE IN LOS ANGELES'.split('').map((letter, index) => (
                    <span
                      key={index}
                      className={`text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-neue-haas font-black leading-none relative inline-block ${
                        letter !== ' ' ? 'cursor-pointer' : ''
                      } ${
                        letter !== ' ' && (hoverAnimatingLetters.has(index) || (initialAnimationStarted && !initialAnimationCompleted)) ? 'animate-bounce-settle' : ''
                      }`}
                      style={{
                        animationDelay: letter !== ' ' && hoverAnimatingLetters.has(index) ? '0s' : `${randomDelays[index]}s`,
                        marginRight: letter === ' ' ? '0.15em' : '0'
                      }}
                      onMouseEnter={() => letter !== ' ' && handleLetterHover(index)}
                      onAnimationEnd={() => letter !== ' ' && handleAnimationEnd(index, !initialAnimationCompleted)}
                    >
                      <span className="text-white">
                        {letter === ' ' ? ' ' : letter}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
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
                    {/* Image side — for Posé this is the rotating-chair scene
                        from the collection-page hero, dropped straight in. */}
                    <div
                      className={`relative aspect-[100/70] md:aspect-auto md:h-[500px] md:w-1/2 ${
                        collection.id === 'pose' ? 'bg-cream' : ''
                      }`}
                    >
                      {collection.id === 'pose' ? (
                        <HeroChairTrio />
                      ) : (
                        <Image
                          src={collection.image}
                          alt={collection.imageAlt}
                          fill
                          className={`object-cover ${flipImage ? '-scale-x-100 md:scale-x-100' : ''}`}
                          style={flipImage ? { objectPosition: '65% center' } : undefined}
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      )}

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
