'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    id: 'tables',
    title: 'Tiled',
    description: 'Custom dining and coffee tables crafted with precision',
    image: '/images/collection-tables.jpg',
    href: '/collections/tiled',
    bgColor: 'bg-squarage-yellow',
    hoverColor: 'hover:bg-squarage-green',
  },
  {
    id: 'shelves',
    title: 'Shelves',
    description: 'Floating and modular shelving systems',
    image: '/images/collection-shelves.jpg',
    href: '/collections/shelves',
    bgColor: 'bg-cream',
    hoverColor: 'hover:bg-squarage-green',
  },
  {
    id: 'chairs',
    title: 'Chairs',
    description: 'Ergonomic seating with distinctive design',
    image: '/images/collection-chairs.jpg',
    href: '/collections/chairs',
    bgColor: 'bg-cream',
    hoverColor: 'hover:bg-squarage-green',
  },
  {
    id: 'objects',
    title: 'Objects',
    description: 'Unique decorative and functional objects',
    image: '/images/collection-objects.jpg',
    href: '/collections/objects',
    bgColor: 'bg-squarage-yellow',
    hoverColor: 'hover:bg-squarage-green',
  },
]

export default function CollectionsSection() {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' })
  const [hoverAnimatingLetters, setHoverAnimatingLetters] = useState<Set<number>>(new Set())
  const [initialAnimationStarted, setInitialAnimationStarted] = useState(false)
  const [initialAnimationCompleted, setInitialAnimationCompleted] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  // Create mobile-specific order (swap chairs and objects for mobile only)
  const mobileCollections = [...collections]
  const chairsIndex = mobileCollections.findIndex(c => c.id === 'chairs')
  const objectsIndex = mobileCollections.findIndex(c => c.id === 'objects')
  if (chairsIndex !== -1 && objectsIndex !== -1) {
    [mobileCollections[chairsIndex], mobileCollections[objectsIndex]] = [mobileCollections[objectsIndex], mobileCollections[chairsIndex]]
  }
  
  // Fixed delays to prevent hydration mismatch - memoized to prevent re-renders
  const randomDelays = useMemo(() => [0.1, 0.3, 0.6, 0.2, 0.5, 0.4, 0.7, 0.0, 0.8, 0.35, 0.15], [])

  const handleMouseMove = (e: React.MouseEvent, title: string) => {
    setTooltip({
      visible: true,
      x: e.pageX + 15,
      y: e.pageY - 10,
      text: title
    })
  }

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' })
  }

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


  useEffect(() => {
    // Detect touch device
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    
    checkTouchDevice()
    
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
    <section className="bg-squarage-green">
      {/* Section Header */}
      <div className="pt-4 pb-4 px-4 sm:pt-6 sm:pb-6 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 sm:gap-4 md:gap-6">
              {'Collections'.split('').map((letter, index) => (
                <span
                  key={index}
                  className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-neue-haas font-black leading-none relative cursor-pointer ${
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
    </section>

    {/* Collections Grid - Full Width */}
    {/* Desktop Grid */}
    <div className="hidden md:grid grid-cols-2 gap-0">
        {collections.map((collection) => (
          <div key={collection.id} className="relative">
            <Link
              href={collection.href}
              className="group cursor-pointer block"
              onMouseMove={!isTouchDevice ? (e) => handleMouseMove(e, collection.title) : undefined}
              onMouseLeave={!isTouchDevice ? handleMouseLeave : undefined}
            >
              <div className={`p-4 sm:p-8 md:p-12 lg:p-16 transition-colors duration-500 ${collection.bgColor} ${collection.hoverColor}`}>
                <div className="relative overflow-hidden bg-gray-100 aspect-square">
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </Link>
          </div>
        ))}
    </div>
    
    {/* Mobile Grid */}
    <div className="grid md:hidden grid-cols-1 gap-0">
        {mobileCollections.map((collection) => {
          return (
            <div key={collection.id} className="relative">
              <Link
                href={collection.href}
                className="block"
              >
                <div className={`p-4 sm:p-8 ${collection.bgColor}`}>
                  <div className="relative overflow-hidden bg-gray-100 aspect-square m-4">
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    
                    {/* Mobile Button - Inside image, bottom left */}
                    <div className="absolute bottom-4 left-4 md:hidden">
                      <div className="px-4 py-2 bg-squarage-white border-2 border-squarage-black font-bold font-neue-haas text-squarage-black text-lg transition-colors duration-300 pointer-events-none">
                        {collection.title}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              
            </div>
          )
        })}
    </div>

    {/* Cursor Following Tooltip - Only shown on non-touch devices */}
    {tooltip.visible && !isTouchDevice && (
      <div 
        className="absolute z-50 px-9 py-6 bg-squarage-white border-4 border-squarage-black font-bold font-neue-haas text-squarage-black text-5xl pointer-events-none"
        style={{
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -100%)'
        }}
      >
        {tooltip.text}
      </div>
    )}

    </>
  )
}