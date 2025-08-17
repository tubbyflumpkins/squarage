'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  
  // Fixed delays to prevent hydration mismatch - memoized to prevent re-renders
  const randomDelays = useMemo(() => [0.1, 0.3, 0.6, 0.2, 0.5, 0.4, 0.7, 0.0, 0.8, 0.35, 0.15], [])

  const handleLetterHover = (index: number) => {
    // Only start animation if not already animating and initial animation is done
    if (!hoverAnimatingLetters.has(index) && initialAnimationCompleted) {
      setHoverAnimatingLetters(prev => new Set(prev).add(index))
    }
  }

  const handleAnimationEnd = (index: number, isInitial: boolean = false) => {
    if (isInitial) {
      // Check if all initial animations are complete
      const maxDelay = Math.max(...randomDelays)
      setTimeout(() => {
        setInitialAnimationCompleted(true)
      }, maxDelay * 1000 + 1000) // Add buffer for animation duration
    } else {
      // Remove letter from hover animating set when hover animation completes
      setHoverAnimatingLetters(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  // Preload collection page images for instant loading
  const preloadCollectionImages = useCallback((collectionId: string) => {
    let imagesToPreload: string[] = []
    
    if (collectionId === 'warped') {
      imagesToPreload = [
        '/images/collection-warped.jpg', // 4MB - Hero background (needs optimization!)
        '/images/warped/curved_shelf_light_05.png', // 2.2MB - Featured image
      ]
    } else if (collectionId === 'tiled') {
      imagesToPreload = [
        '/images/collection-tiled.jpg', // 5.7MB - Hero background (needs optimization!)
      ]
    }
    
    if (imagesToPreload.length === 0) return
    
    console.log(`🖼️ Preloading ${collectionId} collection images...`)
    const startTime = performance.now()
    
    imagesToPreload.forEach(src => {
      if (!preloadedImages.has(src)) {
        // Create link preload tag
        const link = document.createElement('link')
        link.rel = 'prefetch' // Use prefetch instead of preload for lower priority
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
        
        // Also use Image constructor for browser cache
        const img = new window.Image()
        img.onload = () => {
          setPreloadedImages(prev => new Set(prev).add(src))
          const loadTime = performance.now() - startTime
          console.log(`✅ Cached ${src.split('/').pop()} in ${loadTime.toFixed(0)}ms`)
        }
        img.onerror = () => {
          console.error(`❌ Failed: ${src.split('/').pop()}`)
        }
        img.src = src
      }
    })
  }, [preloadedImages])
  
  // Preload collection images after homepage loads
  useEffect(() => {
    // Wait for homepage to fully load before preloading
    const preloadTimer = setTimeout(() => {
      // Preload both collections in the background
      preloadCollectionImages('warped')
      setTimeout(() => preloadCollectionImages('tiled'), 1000) // Stagger the loads
    }, 3000) // Wait 3 seconds after homepage loads
    
    return () => clearTimeout(preloadTimer)
  }, [preloadCollectionImages])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationStarted(true)
      // Set completion after estimated time for all animations to finish
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
        <div className="pt-4 pb-4 px-4 sm:pt-6 sm:pb-6 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center items-center w-full">
                <div className="tracking-[0.3em]">
                  {'COLLECTIONS'.split('').map((letter, index) => (
                    <span
                      key={index}
                      className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-neue-haas font-black leading-none relative cursor-pointer inline-block ${
                        (hoverAnimatingLetters.has(index) || (initialAnimationStarted && !initialAnimationCompleted)) ? 'animate-bounce-settle' : ''
                      }`}
                      style={{
                        animationDelay: hoverAnimatingLetters.has(index) ? '0s' : `${randomDelays[index]}s`
                      }}
                      onMouseEnter={() => handleLetterHover(index)}
                      onAnimationEnd={() => handleAnimationEnd(index, !initialAnimationCompleted)}
                    >
                      <span className="text-white">{letter}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections - Full width alternating layout */}
      <div className="space-y-0 overflow-x-hidden">
        {collections.map((collection, index) => (
          <Link
            key={collection.id}
            href={collection.href}
            className="group block"
            onMouseEnter={() => {
              // Preload collection images on hover
              preloadCollectionImages(collection.id)
            }}
          >
            <div className={`grid grid-cols-1 md:flex ${index % 2 === 0 ? '' : 'md:flex-row-reverse'} items-stretch w-full`}>
              {/* Image Section - 70% height aspect ratio on mobile, fixed height on desktop */}
              <div className="relative aspect-[100/70] md:aspect-auto md:h-[500px] md:w-1/2">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              
              {/* Content Section - 25% viewport height on mobile */}
              <div className={`${index === 1 ? 'bg-squarage-yellow md:bg-squarage-green' : collection.bgColor} h-[25vh] md:h-auto md:aspect-auto p-4 sm:p-10 md:p-16 lg:p-20 md:w-1/2 flex items-center w-full`}>
                <div className="w-full max-w-xl mx-auto text-center md:text-left">
                  <h3 className="text-3xl sm:text-5xl md:text-6xl font-neue-haas font-black mb-1 md:mb-2 text-white">
                    {collection.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 md:mb-6 text-white opacity-90">
                    {collection.subtitle}
                  </p>
                  <p className="text-sm sm:text-base md:text-lg mb-4 md:mb-8 leading-snug md:leading-relaxed text-white">
                    {collection.description}
                  </p>
                  <div className="flex justify-center md:justify-start">
                    <div className={`inline-block font-bold font-neue-haas text-lg sm:text-xl md:text-2xl py-2 px-4 md:py-3 md:px-6 border-2 hover:bg-squarage-blue hover:border-squarage-blue hover:scale-105 transition-all duration-300 text-white ${
                      index === 1 
                        ? 'bg-squarage-green border-squarage-green md:bg-squarage-yellow md:border-squarage-yellow' 
                        : 'bg-squarage-green border-squarage-green'
                    }`}>
                      View Collection
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