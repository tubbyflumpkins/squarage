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
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

    </section>
  )
}