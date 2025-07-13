'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// Simple slideshow without Swiper for now
const SLIDE_INTERVAL = 4000

const heroImages = [
  {
    src: '/images/DSC05249.jpg',
    alt: 'Squarage Studio Design',
  },
  {
    src: '/images/IMG_0961.jpg',
    alt: 'Custom Furniture Design',
  },
  {
    src: '/images/IMG_1286.jpg',
    alt: 'Handcrafted Pieces',
  },
  {
    src: '/images/IMG_6122.jpeg',
    alt: 'Los Angeles Studio',
  },
  {
    src: '/images/product_5_main_angle_blue.jpg',
    alt: 'Featured Product',
  },
  {
    src: '/images/product_6_main_angle_3d.jpg',
    alt: 'Design Process',
  },
]

export default function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, SLIDE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative h-[85vh] w-full overflow-hidden">
      {/* Slideshow Background */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover object-center"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>
    </section>
  )
}