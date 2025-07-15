'use client'

import Image from 'next/image'

export default function CarroContentSection() {
  return (
    <section className="pt-20 pb-10 lg:pt-20 lg:pb-20 px-6 bg-squarage-yellow">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Content - First on mobile, second on desktop */}
          <div className="lg:order-2">
            <h3 className="text-3xl md:text-4xl font-bold font-neue-haas text-squarage-black mb-6">
              Design Philosophy
            </h3>
            <div className="space-y-6 text-xl md:text-2xl font-medium font-neue-haas text-squarage-black leading-relaxed">
              <p>
                The Tiled collection embodies our commitment to creating pieces that serve as both functional furniture and artistic statements. Each table begins with carefully selected materials and evolves through a process of thoughtful design and expert craftsmanship.
              </p>
              
              <p>
                From intimate coffee tables to grand dining pieces, every Tiled table is built to become a centerpiece in your space, facilitating connection and creating lasting memories.
              </p>
            </div>
          </div>

          {/* Featured Image - Second on mobile, first on desktop */}
          <div className="max-w-sm mx-auto border-squarage-red lg:order-1" style={{ borderWidth: '40px' }}>
            <Image
              src="/images/carro/yellow-table-styled.jpg"
              alt="Tiled Collection - Yellow Styled Tables"
              width={320}
              height={427}
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 25vw"
            />
          </div>

        </div>
      </div>
    </section>
  )
}