'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    id: 'warped',
    title: 'Warped',
    subtitle: 'Shelving & Storage',
    description: 'Natural wood shelving systems with smooth, wavy lines that add warmth and character to any space. Sculptural storage, custom built.',
    image: '/images/warped_side.jpg',
    imageAlt: 'Warped Collection — Organic curved wood shelving handcrafted in Los Angeles',
    href: '/collections/warped',
    bgColor: 'bg-squarage-yellow',
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
  },
]

export default function CollectionsSection() {
  const [hoverAnimatingLetters, setHoverAnimatingLetters] = useState<Set<number>>(new Set())
  const [initialAnimationStarted, setInitialAnimationStarted] = useState(false)
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
    // Skip the bounce animation, just mark as completed so hover still works
    setInitialAnimationCompleted(true)

    // Original animation code:
    // const timer = setTimeout(() => {
    //   setInitialAnimationStarted(true)
    //   const maxDelay = Math.max(...randomDelays)
    //   setTimeout(() => {
    //     setInitialAnimationCompleted(true)
    //   }, maxDelay * 1000 + 1000)
    // }, 100)
    // return () => clearTimeout(timer)
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
                        {letter === ' ' ? '\u00A0' : letter}
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
        {collections.map((collection, index) => (
          <Link
            key={collection.id}
            href={collection.href}
            className={`group block ${index === 0 ? 'order-2 md:order-1' : 'order-1 md:order-2'}`}
          >
            <div className="relative">
              <div className="w-full">
                <div className={`grid grid-cols-1 md:flex ${index % 2 === 0 ? '' : 'md:flex-row-reverse'} items-stretch`}>
                  {/* Image - same on desktop, modified mobile */}
                  <div className="relative aspect-[100/70] md:aspect-auto md:h-[500px] md:w-1/2">
                    <Image
                      src={collection.image}
                      alt={collection.imageAlt}
                      fill
                      className={`object-cover ${collection.id === 'warped' ? '-scale-x-100 md:scale-x-100' : ''}`}
                      style={collection.id === 'warped' ? { objectPosition: '65% center' } : undefined}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    
                    {/* Title Blob - Mobile Only */}
                    {index === 0 ? (
                      // Warped Blob - aligned right
                      <div className="absolute bottom-0 right-0 z-50 md:hidden"
                        style={{ 
                          transform: 'translateY(30%) scale(0.9)'
                        }}
                      >
                        <div className="relative">
                          {/* Blob background - compressed vertically */}
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundColor: '#4A9B4E',
                              borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
                              transform: 'scaleY(0.875)'
                            }}
                          />
                          {/* Text content - normal scale */}
                          <div className="relative z-10" style={{ padding: '0.9rem 2.2rem' }}>
                            <h2 className="font-bold font-neue-haas text-white" style={{ fontSize: '2.75rem' }}>
                              Warped
                            </h2>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Tiled Blob - aligned left
                      <div className="absolute bottom-0 left-0 z-50 md:hidden"
                        style={{ 
                          transform: 'translateY(35%) scale(0.9)'
                        }}
                      >
                        <div className="relative">
                          {/* Blob background - compressed vertically */}
                          <div 
                            className="bg-squarage-green absolute inset-0"
                            style={{
                              borderRadius: '35% 65% 55% 45% / 60% 40% 65% 35%',
                              transform: 'scaleY(0.75)'
                            }}
                          />
                          {/* Text content - normal scale */}
                          <div className="relative z-10" style={{ padding: '0.9rem 2.5rem' }}>
                            <h2 className="font-bold font-neue-haas text-white" style={{ fontSize: '2.75rem' }}>
                              Tiled
                            </h2>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Text Side - Mobile: Empty yellow banner, Desktop: Full content */}
                  <div className={`bg-squarage-yellow md:${collection.bgColor} relative flex items-center justify-center py-3 px-4 md:p-0 md:w-1/2`}>
                    {/* Desktop only - Title Blobs from collection pages */}
                    <div className="hidden md:flex md:items-center md:justify-center md:w-full md:h-full">
                      {index === 0 ? (
                        // Warped Blob - Desktop
                        <div className="relative group/blob">
                          <div
                            className="transition-transform duration-300 ease-out group-hover/blob:scale-110"
                            style={{
                              backgroundColor: '#4A9B4E',
                              borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
                              padding: 'clamp(1.2rem, 1.8vw, 1.8rem) clamp(3rem, 4vw, 4rem)'
                            }}
                          >
                            <div className="text-center">
                              <h2
                                className="font-bold font-neue-haas text-squarage-white"
                                style={{
                                  fontSize: 'clamp(4rem, 8vw, 8rem)'
                                }}
                              >
                                Warped
                              </h2>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Tiled Blob - Desktop
                        <div className="relative group/blob">
                          <div 
                            className="bg-squarage-green transition-transform duration-300 ease-out group-hover/blob:scale-110"
                            style={{
                              borderRadius: '35% 65% 55% 45% / 60% 40% 65% 35%',
                              padding: 'clamp(0.5rem, 1vw, 0.9rem) clamp(2rem, 3.2vw, 3rem)'
                            }}
                          >
                            <div className="text-center">
                              <h2
                                className="font-bold font-neue-haas text-white"
                                style={{
                                  fontSize: 'clamp(4rem, 8vw, 8rem)'
                                }}
                              >
                                Tiled
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
        ))}
      </div>
    </>
  )
}

