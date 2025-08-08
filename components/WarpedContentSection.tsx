'use client'

import Image from 'next/image'

export default function WarpedContentSection() {
  return (
    <section 
      className="pt-20 pb-10 lg:pt-24 lg:pb-12 px-6"
      style={{ backgroundColor: '#F3CCA5' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Content - First on mobile, second on desktop */}
          <div className="lg:order-2">
            <h3 
              className="text-3xl md:text-4xl font-bold font-neue-haas mb-6 text-squarage-black"
            >
              Natural Craftsmanship
            </h3>
            <div 
              className="space-y-6 text-xl md:text-2xl font-medium font-neue-haas leading-relaxed text-squarage-black"
            >
              <p>
                The Warped collection celebrates the organic beauty of wood in its most natural form. Each shelving system showcases the unique character of carefully selected timber, with curves and grains that tell the story of the tree&apos;s growth.
              </p>
              
              <p>
                Our artisans work with the wood&apos;s natural tendencies, embracing warps and curves to create functional art pieces that bring warmth and organic elegance to any space. Every shelf is a testament to sustainable craftsmanship and thoughtful design.
              </p>
            </div>
          </div>

          {/* Featured Image - Second on mobile, first on desktop */}
          <div 
            className="max-w-md mx-auto lg:max-w-lg lg:order-1" 
            style={{ 
              borderWidth: '40px',
              borderColor: '#60432F',
              borderStyle: 'solid'
            }}
          >
            <Image
              src="/images/collection-shelves.jpg"
              alt="Warped Collection - Natural Wood Shelving"
              width={480}
              height={640}
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

        </div>
      </div>
    </section>
  )
}