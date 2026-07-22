'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface FAQItem {
  question: string
  answer: string
}

interface ProductFAQProps {
  productType?: 'tiled' | 'warped' | 'pose'
}

export default function ProductFAQ({ productType = 'tiled' }: ProductFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqItems: FAQItem[] = productType === 'pose' ? [
    {
      question: "Can I customize the size or color?",
      answer: "Absolutely. The Mateo Chair comes in three variants (Posé, Tabouret, and Dîner) with nine colors. We can also adjust dimensions within structural limits or apply a finish outside our standard palette as a custom order. Select \"Custom Order\" or contact us with the details you'd like."
    },
    {
      question: "How long will it take to receive my order?",
      answer: "Each piece is handmade in Los Angeles. Standard lead time is 2–3 weeks. Rush options may be available. Contact us if you need a faster turnaround."
    },
    {
      question: "Do you offer local pickup or delivery?",
      answer: "Yes. We offer free pickup in Los Angeles and can arrange white-glove delivery within the area. Nationwide shipping is also available at checkout."
    },
    {
      question: "What if something arrives damaged?",
      answer: "If your chair arrives damaged, we'll repair or replace it at no cost. Just email us photos within 48 hours of delivery."
    },
    {
      question: "How much weight can the chairs support?",
      answer: "Each chair is built from Baltic birch plywood with finger-slot joinery that distributes load across the entire frame. Safe weight capacity is 250 lbs."
    },
    {
      question: "How durable is the Mateo chair?",
      answer: "The Mateo chair is made from Baltic birch plywood. Baltic birch is one of the most stable plywoods made (multi-layer construction with no internal voids), and the finger-slot joinery is structurally sound for daily use. The chair is not designed for prolonged exposure to the weather. Store indoors after outdoor use."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 30 days of delivery on standard pieces in original condition. Custom orders are final sale."
    },
    {
      question: "Do you offer financing?",
      answer: "Yes. You can split payments at checkout through Shop Pay Installments or other listed providers."
    }
  ] : productType === 'tiled' ? [
    {
      question: "How long will it take to receive my order?",
      answer: "Each piece is handmade in Los Angeles. Standard lead time is 2–3 weeks. Rush options may be available. Contact us if you need a faster turnaround."
    },
    {
      question: "Do you offer local pickup or delivery?",
      answer: "Yes. We offer free pickup in Los Angeles and can arrange white-glove delivery within the area. Nationwide shipping is also available at checkout."
    },
    {
      question: "What if something arrives damaged?",
      answer: "If your table or shelf arrives damaged, we'll repair or replace it at no cost. Just email us photos within 48 hours of delivery."
    },
    {
      question: "How much weight can the tables support?",
      answer: "Each table is built on a reinforced plywood core designed for strength. Our tiled tables safely support up to 200 lbs, sturdy for everyday use, books, lamps, and even someone sitting on the surface."
    },
    {
      question: "Are the tiles and grout durable?",
      answer: "Yes. All pieces use sealed grout and ceramic tiles designed for everyday use. Surfaces can be wiped clean with any household surface cleaner."
    },
    {
      question: "Can I customize the size or color?",
      answer: "Absolutely. We offer custom dimensions and tile colors for most designs. Select \"Custom Order\" or contact us and give us your desired details!"
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 30 days of delivery on standard pieces in original condition. Custom orders are final sale."
    },
    {
      question: "Do you offer financing?",
      answer: "Yes. You can split payments at checkout through Shop Pay Installments or other listed providers."
    }
  ] : [
    {
      question: "How long does it take to receive my order?",
      answer: "Warped shelving is made to order in Los Angeles. Standard lead time is 2–3 weeks before shipping or pickup."
    },
    {
      question: "How much weight can my order support?",
      answer: "Each shelf safely supports 40–60 lbs, depending on width. They're built for everyday storage of books, records, and display items."
    },
    {
      question: "Does my order require assembly?",
      answer: "Yes. The shelving ships flat and assembles in minutes with no tools required. Slot-fit joinery keeps the structure rigid and stable."
    },
    {
      question: "What materials are used in my order?",
      answer: "All pieces are made from locally sourced, sustainable plywood, cut with precision slot-fit joints. The edges are sanded smooth and sealed for durability."
    },
    {
      question: "Can I customize my order?",
      answer: "Yes. Custom dimensions and finishes are available on request. Reach out before ordering to confirm feasibility and pricing."
    },
    {
      question: "What if my order arrives damaged?",
      answer: "If your shelving arrives damaged, we'll repair or replace it at no cost. Send photos within 48 hours of delivery."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 30 days of delivery on standard orders in original condition. Custom orders are final sale."
    }
  ]

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl lg:text-3xl font-bold font-neue-haas text-squarage-black mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-0 border-t border-squarage-black">
        {faqItems.map((item, index) => (
          <div key={index} className="border-b border-squarage-black">
            <button
              onClick={() => toggleItem(index)}
              className="w-full py-4 px-0 flex justify-between items-center text-left hover:bg-cream-dark transition-colors duration-200"
              aria-expanded={openIndex === index}
            >
              <span className="text-base lg:text-lg font-medium font-neue-haas text-squarage-black pr-4">
                {item.question}
              </span>
              <ChevronDownIcon 
                className={`w-5 h-5 text-squarage-black flex-shrink-0 transition-transform duration-200 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="pb-4 px-0">
                <p className="text-sm lg:text-base font-neue-haas text-squarage-black leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}