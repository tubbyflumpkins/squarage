'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CustomProjectSection() {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' })

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip({
      visible: true,
      x: e.pageX + 15,
      y: e.pageY - 10,
      text: 'Start designing'
    })
  }

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' })
  }

  return (
    <section className="pb-12">
      {/* Full Width Grid - Same structure as collections */}
      <div className="grid grid-cols-1 gap-0">
        <Link
          href="/custom-projects"
          className="group cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-16 transition-colors duration-500 bg-squarage-blue hover:bg-squarage-yellow">
            <div className="bg-squarage-white px-12 py-8 text-center flex items-center justify-center">
              <h3 className="text-5xl md:text-7xl font-bold font-neue-haas text-squarage-black relative">
                <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1">Ready for a Custom Project?</span>
                <span className="relative z-10">Ready for a Custom Project?</span>
              </h3>
            </div>
          </div>
        </Link>
      </div>

      {/* Cursor Following Tooltip */}
      {tooltip.visible && (
        <div 
          className="absolute z-50 px-9 py-6 bg-squarage-white border-4 border-squarage-black font-bold font-neue-haas text-squarage-black text-5xl pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <span className="absolute text-squarage-yellow transform translate-x-1 translate-y-1 top-0 left-0 w-full h-full flex items-center justify-center">{tooltip.text}</span>
          <span className="relative z-10">{tooltip.text}</span>
        </div>
      )}
    </section>
  )
}