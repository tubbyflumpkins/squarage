'use client'

import { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import Image from 'next/image'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/autoplay'

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
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Slideshow Background */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          loop={true}
          speed={1000}
          className="w-full h-full"
        >
          {heroImages.map((image, index) => (
            <SwiperSlide key={index} className="relative">
              <div className="relative w-full h-full">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover object-center"
                  priority={index === 0}
                  sizes="100vw"
                />
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black bg-opacity-30" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-8 max-w-4xl">
          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-thin font-neue-haas leading-tight mb-6">
            <span className="block">SQUARAGE</span>
            <span className="block font-light">STUDIO</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-light font-neue-haas tracking-wide mb-8 opacity-90">
            FUNCTIONAL ART & DESIGN
          </p>
          
          {/* Location */}
          <p className="text-sm md:text-base font-neue-haas tracking-wider uppercase opacity-80">
            Made in Los Angeles
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center text-white opacity-70">
          <span className="text-xs font-neue-haas tracking-wider uppercase mb-2">
            Scroll
          </span>
          <div className="w-px h-8 bg-white animate-pulse" />
        </div>
      </div>
    </section>
  )
}