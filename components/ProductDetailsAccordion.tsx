'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PlusIcon, MinusIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
}

interface ProductDetailsAccordionProps {
  productType: 'tiled' | 'warped' | 'pose'
  dimensions?: string
  metafields?: Array<{
    namespace: string
    key: string
    value: string
  }>
  dimensionsImage?: {
    id: string
    src: string
    altText: string
    width: number
    height: number
  } | null
}

export default function ProductDetailsAccordion({
  productType,
  dimensions,
  metafields,
  dimensionsImage
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
  
  // Function to parse simple markdown-like formatting
  const formatText = (text: string): React.ReactNode => {
    // Split by lines first to preserve line breaks
    const lines = text.split('\n')
    
    return lines.map((line, lineIndex) => {
      // Process each line for formatting
      let processedLine: React.ReactNode[] = []
      let currentText = line
      let keyCounter = 0
      
      // Helper function to preserve spaces
      const preserveSpaces = (text: string) => {
        // Replace multiple spaces with non-breaking spaces
        return text.replace(/ {2,}/g, (match) => '\u00A0'.repeat(match.length))
      }
      
      // Replace **text** with bold
      const boldParts = currentText.split(/\*\*(.*?)\*\*/g)
      for (let i = 0; i < boldParts.length; i++) {
        if (i % 2 === 0) {
          // Regular text, now check for underline
          const underlineParts = boldParts[i].split(/__(.*?)__/g)
          for (let j = 0; j < underlineParts.length; j++) {
            if (j % 2 === 0) {
              // Regular text
              if (underlineParts[j]) {
                processedLine.push(
                  <span key={`text-${lineIndex}-${keyCounter++}`}>
                    {preserveSpaces(underlineParts[j])}
                  </span>
                )
              }
            } else {
              // Underlined text
              processedLine.push(
                <span key={`underline-${lineIndex}-${keyCounter++}`} className="underline">
                  {preserveSpaces(underlineParts[j])}
                </span>
              )
            }
          }
        } else {
          // Bold text
          processedLine.push(
            <span key={`bold-${lineIndex}-${keyCounter++}`} className="font-bold">
              {preserveSpaces(boldParts[i])}
            </span>
          )
        }
      }
      
      // Add line break after each line except the last
      return (
        <span key={`line-${lineIndex}`}>
          {processedLine.length > 0 ? processedLine : preserveSpaces(line)}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    })
  }

  const accordionItems: AccordionItem[] = [
    {
      id: 'dimensions',
      title: 'Dimensions',
      content: (
        <div className="space-y-2">
          {dimensionsImage ? (
            // Layout with centered image (2/3 width) and text below
            <div className="flex flex-col gap-4">
              <div className="w-2/3 mx-auto">
                <Image
                  src={dimensionsImage.src}
                  alt={dimensionsImage.altText || 'Product dimensions'}
                  width={dimensionsImage.width}
                  height={dimensionsImage.height}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-2">
                <div className="text-base font-neue-haas text-squarage-black">
                  {formatText(productDimensions)}
                </div>
                <p className="text-sm font-neue-haas text-gray-600">
                  Custom sizes available upon request. Contact us for details.
                </p>
              </div>
            </div>
          ) : (
            // No image - just text (original layout)
            <>
              <div className="text-base font-neue-haas text-squarage-black">
                {formatText(productDimensions)}
              </div>
              <p className="text-sm font-neue-haas text-gray-600">
                Custom sizes available upon request. Contact us for details.
              </p>
            </>
          )}
        </div>
      )
    },
    {
      id: 'details',
      title: 'Details',
      content: (
        <div className="space-y-3">
          {productType === 'pose' ? (
            <>
              <p className="text-base font-neue-haas text-squarage-black">
                Handcrafted in our Los Angeles studio from Baltic birch plywood
                with finger-slot joinery, designed to hold up to everyday use.
              </p>
              <ul className="space-y-2 text-sm font-neue-haas text-squarage-black">
                <li>• Baltic birch plywood construction</li>
                <li>• Finger-slot joinery for structural strength</li>
                <li>• Handmade in our Los Angeles studio</li>
                <li>• Each piece individually crafted and inspected</li>
                <li>• Weight capacity: 250 lbs</li>
              </ul>
            </>
          ) : productType === 'tiled' ? (
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
              We&apos;re committed to minimizing waste and using eco-friendly finishes and materials whenever possible.
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
          {productType === 'pose' ? (
            <>
              <p className="text-base font-neue-haas text-squarage-black font-medium">
                Caring for Your Posé Piece
              </p>
              <ul className="space-y-2 text-sm font-neue-haas text-squarage-black">
                <li>• Dust regularly with a soft, dry cloth</li>
                <li>• Spot-clean with a slightly damp cloth and dry immediately</li>
                <li>• Indoor use only. Not designed for outdoor exposure</li>
                <li>• Avoid prolonged direct sunlight to prevent fading</li>
                <li>• Avoid dragging across rough surfaces</li>
              </ul>
            </>
          ) : productType === 'tiled' ? (
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
                openItems.includes(item.id) ? 'max-h-[1000px]' : 'max-h-0'
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