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
    image: '/images/collection-warped.jpg',
    href: '/collections/warped',
    bgColor: 'bg-squarage-yellow',
  },
  {
    id: 'tiled',
    title: 'Tiled',
    subtitle: 'Tables & Surfaces',
    description: 'Vibrant tiled surfaces that bring energy, texture, and a playful sense of style to your space.',
    image: '/images/collection-tiled.jpg',
    href: '/collections/tiled',
    bgColor: 'bg-squarage-green',
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
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationStarted(true)
      const maxDelay = Math.max(...randomDelays)
      setTimeout(() => {
        setInitialAnimationCompleted(true)
      }, maxDelay * 1000 + 1000)
    }, 100)

    return () => clearTimeout(timer)
  }, [randomDelays])

  return (
    <>
      {/* Green animated header section */}
      <section className="bg-squarage-green">
        <div className="flex items-center justify-center min-h-[60px] sm:min-h-[80px] px-4 sm:px-6">
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
      <div className="bg-white">
        {collections.map((collection, index) => (
          <Link
            key={collection.id}
            href={collection.href}
            className="group block"
          >
            <div className="relative">
              <div className="w-full">
                <div className={`grid grid-cols-1 md:flex ${index % 2 === 0 ? '' : 'md:flex-row-reverse'} items-stretch`}>
                  {/* Image - same on desktop, modified mobile */}
                  <div className="relative aspect-[100/70] md:aspect-auto md:h-[500px] md:w-1/2">
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      fill
                      className="object-cover"
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
                            <h1 className="font-bold font-neue-haas text-white" style={{ fontSize: '2.75rem' }}>
                              Warped
                            </h1>
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
                            <h1 className="font-bold font-neue-haas text-white" style={{ fontSize: '2.75rem' }}>
                              Tiled
                            </h1>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Text Side - Mobile: Empty yellow banner, Desktop: Full content */}
                  <div className={`bg-squarage-yellow md:${collection.bgColor} flex items-center justify-center py-3 px-4 md:p-12 lg:p-16 md:w-1/2`}>
                    <div className="w-full text-center">
                      {/* Desktop only */}
                      <div className="hidden md:block md:mb-6">
                        <h3 className="md:text-[4rem] lg:text-[5rem] xl:text-[6rem] font-neue-haas font-black leading-none text-white">
                          {collection.title.split('').map((char, i) => (
                            <span key={i} className="inline-block md:hover:scale-110 transition-transform duration-300">
                              {char}
                            </span>
                          ))}
                        </h3>
                      </div>
                      
                      {/* Discover Collection button - desktop only */}
                      <div className="hidden md:block">
                        <div className="inline-flex items-center space-x-4 text-white font-bold text-lg hover:opacity-80 transition-opacity duration-300">
                          <span>Discover Collection</span>
                          <div className="w-12 h-[2px] bg-current transform origin-left group-hover:scale-x-150 transition-transform duration-500" />
                        </div>
                      </div>
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

