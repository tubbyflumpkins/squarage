'use client'

import { useState } from 'react'
import { PlusIcon, MinusIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
}

interface ProductDetailsAccordionProps {
  productType: 'tiled' | 'warped'
  dimensions?: string
  metafields?: Array<{
    namespace: string
    key: string
    value: string
  }>
}

export default function ProductDetailsAccordion({ 
  productType, 
  dimensions,
  metafields 
}: ProductDetailsAccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Get metafield value helper
  const getMetafieldValue = (namespace: string, key: string): string => {
    const metafield = metafields?.find(
      field => field.namespace === namespace && field.key === key
    )
    return metafield?.value || ''
  }

  const productDimensions = dimensions || getMetafieldValue('custom', 'size') || 'Custom sizing available'

  const accordionItems: AccordionItem[] = [
    {
      id: 'dimensions',
      title: 'Dimensions',
      content: (
        <div className="space-y-2">
          <p className="text-base font-neue-haas text-squarage-black">
            {productDimensions}
          </p>
          <p className="text-sm font-neue-haas text-gray-600">
            Custom sizes available upon request. Contact us for details.
          </p>
        </div>
      )
    },
    {
      id: 'details',
      title: 'Details',
      content: (
        <div className="space-y-3">
          {productType === 'tiled' ? (
            <>
              <p className="text-base font-neue-haas text-squarage-black">
                Handcrafted in Los Angeles with meticulous attention to detail. 
                Our entire Tiled Collection is 100% waterproof and suitable for both indoor and outdoor use. 
                These pieces are incredibly durable - you can even use them as stools.
              </p>
              <ul className="space-y-2 text-sm font-neue-haas text-squarage-black">
                <li>• Marine-grade plywood base for durability and waterproofing</li>
                <li>• Hand-cut ceramic mosaic tiles</li>
                <li>• Premium grout work with sealed finish</li>
                <li>• Each piece individually crafted and inspected</li>
                <li>• Weight capacity: 200 lbs</li>
              </ul>
            </>
          ) : (
            <>
              <p className="text-base font-neue-haas text-squarage-black">
                Our Warped collection reimagines flat planes into flowing, wave-like forms. Each piece is machine-cut, designed for strength, easy assembly, and a sculptural presence in any space.
              </p>
              <ul className="space-y-2 text-sm font-neue-haas text-squarage-black">
                <li>• Machine cut for precision slot-fit joinery</li>
                <li>• Natural oil finish for lasting beauty</li>
                <li>• Ships flat, assembles in minutes with no tools required</li>
                <li>• Weight capacity: 40-60lbs per shelf (depending on width)</li>
                <li>• Dimensions and finishes customizable on request</li>
                <li>• Made in Los Angeles</li>
              </ul>
            </>
          )}
        </div>
      )
    },
    {
      id: 'responsible',
      title: 'Responsible Design',
      content: (
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <GlobeAltIcon className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-neue-haas text-squarage-black">
              Our products are made with sustainable wood from forests certified to be responsibly managed, 
              environmentally sound, and socially beneficial.
            </p>
            <p className="text-sm font-neue-haas text-gray-600">
              We're committed to minimizing waste and using eco-friendly finishes and materials whenever possible.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'care',
      title: 'Care',
      content: (
        <div className="space-y-3">
          {productType === 'tiled' ? (
            <>
              <p className="text-base font-neue-haas text-squarage-black font-medium">
                Caring for Your Tiled Piece
              </p>
              <ul className="space-y-2 text-sm font-neue-haas text-squarage-black">
                <li>• Clean with a damp cloth and mild, non-abrasive cleaners</li>
                <li>• Tiles are sealed and water-resistant - built to handle daily use</li>
                <li>• Use bleach on grout to maintain its white color and increase longevity</li>
                <li>• Avoid harsh chemicals or abrasive scrubbers on tile surfaces</li>
                <li>• No coasters needed - these pieces are waterproof and durable</li>
              </ul>
            </>
          ) : (
            <>
              <p className="text-base font-neue-haas text-squarage-black font-medium">
                Caring for Your Wood Furniture
              </p>
              <ul className="space-y-2 text-sm font-neue-haas text-squarage-black">
                <li>• Dust regularly with a soft, dry cloth</li>
                <li>• Use wood-safe cleaner for deeper cleaning</li>
                <li>• Avoid placing in direct sunlight to prevent fading</li>
                <li>• Use coasters and placemats to prevent water rings</li>
              </ul>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="w-full">
      <div className="space-y-0 border-t border-squarage-black">
        {accordionItems.map((item) => (
          <div key={item.id} className="border-b border-squarage-black">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full py-4 px-0 flex justify-between items-center text-left hover:bg-cream-dark transition-colors duration-200"
              aria-expanded={openItems.includes(item.id)}
            >
              <span className="text-lg font-medium font-neue-haas text-squarage-black">
                {item.title}
              </span>
              {openItems.includes(item.id) ? (
                <MinusIcon className="w-5 h-5 text-squarage-black flex-shrink-0" />
              ) : (
                <PlusIcon className="w-5 h-5 text-squarage-black flex-shrink-0" />
              )}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openItems.includes(item.id) ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="pb-4 px-0">
                {item.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}