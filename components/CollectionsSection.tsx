'use client'

import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    id: 'tables',
    title: 'Tables',
    description: 'Custom dining and coffee tables crafted with precision',
    image: '/images/product_5_main_angle_blue.jpg',
    href: '/collections/tables',
  },
  {
    id: 'shelves',
    title: 'Shelves',
    description: 'Floating and modular shelving systems',
    image: '/images/DSC05249.jpg',
    href: '/collections/shelves',
  },
  {
    id: 'chairs',
    title: 'Chairs',
    description: 'Ergonomic seating with distinctive design',
    image: '/images/product_6_main_angle_3d.jpg',
    href: '/collections/chairs',
  },
]

export default function CollectionsSection() {
  return (
    <section className="py-20 px-6 bg-cream">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-thin font-neue-haas text-gray-900 mb-6">
            Collections
          </h2>
          <p className="text-lg md:text-xl font-neue-haas text-gray-600 max-w-2xl mx-auto">
            Explore our curated collections of functional art and design pieces, 
            each crafted with meticulous attention to detail.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.href}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden bg-gray-100 aspect-square">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                
                {/* Collection info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                    <h3 className="text-2xl font-neue-haas font-light mb-2">
                      {collection.title}
                    </h3>
                    <p className="text-sm font-neue-haas opacity-90">
                      {collection.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Collection Title Below Image */}
              <div className="mt-6 text-center">
                <h3 className="text-2xl md:text-3xl font-thin font-neue-haas text-gray-900 group-hover:text-orange transition-colors duration-300">
                  {collection.title}
                </h3>
                <div className="w-12 h-px bg-orange mx-auto mt-3 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* View All Collections CTA */}
        <div className="text-center mt-16">
          <Link
            href="/collections"
            className="inline-flex items-center space-x-2 text-lg font-neue-haas text-gray-900 hover:text-orange transition-colors duration-300 group"
          >
            <span>View All Collections</span>
            <Image
              src="/images/Arrow-1.svg"
              alt="Arrow"
              width={16}
              height={16}
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}