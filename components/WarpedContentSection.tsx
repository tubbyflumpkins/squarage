'use client'

import Image from 'next/image'

export default function WarpedContentSection() {
  return (
    <section className="py-20 lg:py-24 bg-squarage-white">
      <div className="px-6 md:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Content - Left side */}
          <div>
            <h3 className="text-3xl md:text-4xl font-bold font-neue-haas mb-6 text-squarage-black">
              Sculptural Storage
            </h3>
            <div className="space-y-6 text-xl md:text-2xl font-medium font-neue-haas leading-relaxed text-squarage-black">
              <p>
                Warped is our line of sculptural shelves where form takes a playful detour from the straight and narrow. Each piece features smooth, wavy curves that feel fresh, modern, and a little unexpected, while still working hard as functional storage.
              </p>
              
              <p>
                Choose from our ready-made corner shelves, full shelves, and wall-mounted designs, or have any shape custom-built to your exact size. Whether you&apos;re filling a tricky corner or creating a statement wall, Warped brings a fluid, wavy touch to everyday storage.
              </p>
            </div>
          </div>

          {/* Featured Image - Right side */}
          <div className="relative w-full">
            <Image
              src="/images/warped/curved_shelf_light_05.png"
              alt="Warped Collection - Natural Wood Shelving"
              width={600}
              height={800}
              className="w-full h-auto"
              priority
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

        </div>
      </div>
    </section>
  )
}