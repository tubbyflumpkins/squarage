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
              Natural Craftsmanship
            </h3>
            <div className="space-y-6 text-xl md:text-2xl font-medium font-neue-haas leading-relaxed text-squarage-black">
              <p>
                The Warped collection celebrates the organic beauty of wood in its most natural form. Each shelving system showcases the unique character of carefully selected timber, with curves and grains that tell the story of the tree&apos;s growth.
              </p>
              
              <p>
                Our artisans work with the wood&apos;s natural tendencies, embracing warps and curves to create functional art pieces that bring warmth and organic elegance to any space. Every shelf is a testament to sustainable craftsmanship and thoughtful design.
              </p>
            </div>
          </div>

          {/* Featured Image - Right side */}
          <div className="relative w-full">
            <Image
              src="/images/warped/curved_shelf_dark_05.png"
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