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
  const [animationStarted, setAnimationStarted] = useState(false)
  // Fixed delays to prevent hydration mismatch
  const randomDelays = [0.1, 0.3, 0.6, 0.2, 0.5, 0.4, 0.7, 0.0, 0.8, 0.35, 0.15, 0.25, 0.45, 0.65]

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      {/* Header Section */}
      <section className="pt-32 pb-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2">
              {'Custom Projects'.split('').map((letter, index) => {
                if (letter === ' ') {
                  return <div key={index} className="w-4"></div>
                }
                return (
                  <div
                    key={index}
                    className={`w-16 h-16 md:w-20 md:h-20 bg-squarage-green flex items-center justify-center relative ${
                      animationStarted ? 'animate-bounce-settle' : ''
                    }`}
                    style={{
                      animationDelay: `${randomDelays[index]}s`
                    }}
                  >
                    <span className="text-6xl md:text-7xl font-soap text-white leading-none absolute inset-0 flex items-center justify-center text-[4.5rem] md:text-[5.5rem]" style={{transform: 'translateY(4px)'}}>
                      {letter}
                    </span>
                  </div>
                )
              })}
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold font-neue-haas text-squarage-black mt-4">
              Our Process:
            </h2>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section>
        {processSteps.map((step, index) => {
          const backgrounds = ['bg-squarage-yellow', 'bg-squarage-dark-blue', 'bg-squarage-orange', 'bg-squarage-red']
          const textColors = ['text-squarage-dark-blue', 'text-squarage-white', 'text-squarage-white', 'text-squarage-yellow']
          return (
            <div key={index} className={`${backgrounds[index]} py-12`}>
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}>
                
                {/* Content */}
                <div className={`px-6 lg:px-12 py-8 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="max-w-2xl mx-auto lg:mx-0">
                    <div className="flex items-center mb-6">
                      <span className="text-7xl md:text-8xl font-black font-neue-haas text-squarage-green mr-6">
                        {step.step}
                      </span>
                      <h2 className={`text-4xl md:text-5xl font-bold font-neue-haas ${textColors[index]}`}>
                        {step.title}
                      </h2>
                    </div>
                    
                    <p className={`text-2xl md:text-3xl font-medium font-neue-haas ${textColors[index]} leading-relaxed`}>
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Image */}
                <div className={`${index % 2 === 1 ? 'lg:order-1 lg:pl-6' : 'lg:order-2 lg:pr-6'}`}>
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
          
          <p className="text-xl md:text-2xl font-neue-haas text-white mb-8 opacity-90">
            Let&apos;s collaborate to create something extraordinary for your space.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/contact"
              className="inline-block w-56 px-12 py-4 bg-white text-squarage-green font-bold font-neue-haas text-lg hover:bg-squarage-blue hover:text-white transition-all duration-300 transform hover:scale-105 text-center"
            >
              Get Started
            </Link>
            
            <Link
              href="/products"
              className="inline-block w-56 px-12 py-4 border-2 border-white text-white font-bold font-neue-haas text-lg hover:bg-white hover:text-squarage-green transition-all duration-300 transform hover:scale-105 text-center"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}