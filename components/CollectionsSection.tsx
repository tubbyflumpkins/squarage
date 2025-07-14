'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    id: 'tables',
    title: 'Carro',
    description: 'Custom dining and coffee tables crafted with precision',
    image: '/images/collection-tables.jpg',
    href: '/collections/tables',
    bgColor: 'bg-squarage-green',
    hoverColor: 'hover:bg-squarage-yellow',
  },
  {
    id: 'shelves',
    title: 'Shelves',
    description: 'Floating and modular shelving systems',
    image: '/images/collection-shelves.jpg',
    href: '/collections/shelves',
    bgColor: 'bg-cream',
    hoverColor: 'hover:bg-squarage-yellow',
  },
  {
    id: 'chairs',
    title: 'Chairs',
    description: 'Ergonomic seating with distinctive design',
    image: '/images/collection-chairs.jpg',
    href: '/collections/chairs',
    bgColor: 'bg-cream',
    hoverColor: 'hover:bg-squarage-yellow',
  },
  {
    id: 'objects',
    title: 'Objects',
    description: 'Unique decorative and functional objects',
    image: '/images/collection-objects.jpg',
    href: '/collections/objects',
    bgColor: 'bg-squarage-green',
    hoverColor: 'hover:bg-squarage-yellow',
  },
]

export default function CollectionsSection() {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' })
  const [animationStarted, setAnimationStarted] = useState(false)
  // Fixed delays to prevent hydration mismatch
  const randomDelays = [0.1, 0.3, 0.6, 0.2, 0.5, 0.4, 0.7, 0.0, 0.8, 0.35, 0.15]

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
    <section className="bg-squarage-red">
      {/* Section Header */}
      <div className="pt-6 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-6">
              {'Collections'.split('').map((letter, index) => (
                <span
                  key={index}
                  className={`text-7xl md:text-8xl font-neue-haas font-black leading-none relative ${
                    animationStarted ? 'animate-bounce-settle' : ''
                  }`}
                  style={{
                    animationDelay: `${randomDelays[index]}s`
                  }}
                >
                  <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">{letter}</span>
                  <span className="relative z-10 text-white">{letter}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Collections Grid - Full Width */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={collection.href}
            className="group cursor-pointer"
            onMouseMove={(e) => handleMouseMove(e, collection.title)}
            onMouseLeave={handleMouseLeave}
          >
            <div className={`p-16 transition-colors duration-500 ${collection.bgColor} ${collection.hoverColor}`}>
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
        ))}
    </div>

    {/* Cursor Following Tooltip */}
    {tooltip.visible && (
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