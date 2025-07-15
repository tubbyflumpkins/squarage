'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const processSteps = [
  {
    step: "1",
    title: "Initial Consultation",
    description: "We begin with a detailed conversation about your vision, space, and functional requirements. This collaborative discussion helps us understand your aesthetic preferences, budget, and timeline.",
    image: "/images/IMG_0961.jpg",
    imageAlt: "Initial consultation and design planning"
  },
  {
    step: "2", 
    title: "Design & Concept Development",
    description: "Our team creates detailed sketches and 3D renderings of your custom piece. We refine the design through multiple iterations until it perfectly captures your vision and meets your functional needs.",
    image: "/images/product_6_main_angle_3d.jpg",
    imageAlt: "Design development and 3D modeling"
  },
  {
    step: "3",
    title: "Material Selection & Approval",
    description: "We carefully select premium materials that align with your aesthetic and functional requirements. You'll review and approve all materials, finishes, and hardware before production begins.",
    image: "/images/IMG_6122.jpeg",
    imageAlt: "Material selection and approval process"
  },
  {
    step: "4",
    title: "Craftsmanship & Delivery",
    description: "Our skilled artisans bring your design to life in our Los Angeles workshop. Each piece is meticulously crafted by hand, inspected for quality, and delivered with care to your space.",
    image: "/images/DSC05249.jpg",
    imageAlt: "Craftsmanship and delivery"
  }
]

export default function CustomProjectsPage() {
  const [initialAnimationStarted, setInitialAnimationStarted] = useState(false)
  const [initialAnimationCompleted, setInitialAnimationCompleted] = useState(false)
  const [hoverAnimatingLetters, setHoverAnimatingLetters] = useState<Set<number>>(new Set())
  
  // Fixed delays to prevent hydration mismatch
  const randomDelays = [0.1, 0.3, 0.6, 0.2, 0.5, 0.4, 0.7, 0.0, 0.8, 0.35, 0.15, 0.25, 0.45, 0.65]

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationStarted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleLetterHover = (index: number) => {
    if (!initialAnimationCompleted) return
    
    setHoverAnimatingLetters(prev => new Set(prev).add(index))
  }

  const handleAnimationEnd = (index: number, isInitialAnimation: boolean) => {
    if (isInitialAnimation) {
      // Check if this is the last letter of the initial animation
      if (index === 'Custom Projects'.replace(' ', '').length - 1) {
        setInitialAnimationCompleted(true)
      }
    } else {
      // Remove from hover animating set
      setHoverAnimatingLetters(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header Section */}
      <section className="bg-squarage-red pt-24 md:pt-32 pb-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Mobile: Two-line layout */}
            <div className="flex md:hidden flex-col items-center gap-0">
              <div className="inline-flex items-center gap-2">
                {'Custom'.split('').map((letter, index) => (
                  <span
                    key={index}
                    className={`text-5xl font-neue-haas font-black leading-none relative cursor-pointer ${
                      (hoverAnimatingLetters.has(index) || (initialAnimationStarted && !initialAnimationCompleted)) ? 'animate-bounce-settle' : ''
                    }`}
                    style={{
                      animationDelay: hoverAnimatingLetters.has(index) ? '0s' : `${randomDelays[index]}s`
                    }}
                    onMouseEnter={() => handleLetterHover(index)}
                    onAnimationEnd={() => handleAnimationEnd(index, !initialAnimationCompleted)}
                  >
                    <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">{letter}</span>
                    <span className="relative z-10 text-white">{letter}</span>
                  </span>
                ))}
              </div>
              <div className="inline-flex items-center gap-2">
                {'Projects'.split('').map((letter, index) => {
                  const adjustedIndex = index + 'Custom'.length
                  return (
                    <span
                      key={adjustedIndex}
                      className={`text-5xl font-neue-haas font-black leading-none relative cursor-pointer ${
                        (hoverAnimatingLetters.has(adjustedIndex) || (initialAnimationStarted && !initialAnimationCompleted)) ? 'animate-bounce-settle' : ''
                      }`}
                      style={{
                        animationDelay: hoverAnimatingLetters.has(adjustedIndex) ? '0s' : `${randomDelays[adjustedIndex]}s`
                      }}
                      onMouseEnter={() => handleLetterHover(adjustedIndex)}
                      onAnimationEnd={() => handleAnimationEnd(adjustedIndex, !initialAnimationCompleted)}
                    >
                      <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">{letter}</span>
                      <span className="relative z-10 text-white">{letter}</span>
                    </span>
                  )
                })}
              </div>
            </div>
            
            {/* Desktop: Single-line layout */}
            <div className="hidden md:inline-flex items-center gap-2">
              {'Custom Projects'.split('').map((letter, index) => {
                if (letter === ' ') {
                  return <div key={index} className="w-6"></div>
                }
                return (
                  <span
                    key={index}
                    className={`text-7xl lg:text-8xl font-neue-haas font-black leading-none relative cursor-pointer ${
                      (hoverAnimatingLetters.has(index) || (initialAnimationStarted && !initialAnimationCompleted)) ? 'animate-bounce-settle' : ''
                    }`}
                    style={{
                      animationDelay: hoverAnimatingLetters.has(index) ? '0s' : `${randomDelays[index]}s`
                    }}
                    onMouseEnter={() => handleLetterHover(index)}
                    onAnimationEnd={() => handleAnimationEnd(index, !initialAnimationCompleted)}
                  >
                    <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">{letter}</span>
                    <span className="relative z-10 text-white">{letter}</span>
                  </span>
                )
              })}
            </div>
            
            <p className="text-lg md:text-2xl lg:text-3xl font-medium font-neue-haas text-white mt-3 max-w-6xl mx-auto">
              Work directly with us to create a unique piece. See more about our process below.
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section>
        {processSteps.map((step, index) => {
          const backgrounds = ['bg-squarage-yellow', 'bg-squarage-dark-blue', 'bg-squarage-orange', 'bg-squarage-red']
          const textColors = ['text-squarage-dark-blue', 'text-squarage-white', 'text-squarage-white', 'text-squarage-yellow']
          return (
            <div key={index} className={`${backgrounds[index]} py-4 md:py-12`}>
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}>
                
                {/* Content */}
                <div className={`px-6 lg:px-12 py-2 pb-6 md:py-8 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="max-w-2xl mx-auto lg:mx-0">
                    <div className="flex items-center mb-6">
                      <span className="text-7xl md:text-8xl font-black font-neue-haas text-squarage-green mr-6">
                        {step.step}
                      </span>
                      <h2 className={`text-2xl md:text-4xl lg:text-5xl font-bold font-neue-haas ${textColors[index]} leading-tight md:leading-normal`}>
                        {step.title}
                      </h2>
                    </div>
                    
                    <p className={`text-2xl md:text-3xl font-medium font-neue-haas ${textColors[index]} leading-tight md:leading-relaxed`}>
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Image */}
                <div className={`px-6 pb-2 md:px-0 md:pb-0 ${index % 2 === 1 ? 'lg:order-1 lg:pl-6' : 'lg:order-2 lg:pr-6'}`}>
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-squarage-green">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-neue-haas text-white mb-4">
            Ready to Start Your Custom Project?
          </h2>
          
          <p className="text-xl md:text-2xl font-neue-haas text-white mb-8 opacity-90 leading-tight md:leading-normal">
            Let&apos;s collaborate to create something extraordinary for your space.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Link
              href="/contact"
              className="inline-block px-8 sm:px-12 py-3 sm:py-4 sm:w-56 bg-white text-squarage-green font-bold font-neue-haas text-base sm:text-lg hover:bg-squarage-blue hover:text-white transition-all duration-300 transform hover:scale-105 text-center"
            >
              Get Started
            </Link>
            
            <Link
              href="/products"
              className="inline-block px-8 sm:px-12 py-3 sm:py-4 sm:w-56 border-2 border-white text-white font-bold font-neue-haas text-base sm:text-lg hover:bg-white hover:text-squarage-green transition-all duration-300 transform hover:scale-105 text-center"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}