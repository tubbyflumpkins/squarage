'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CustomProjectSection() {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' })
  const [isTouchDevice, setIsTouchDevice] = useState(false)

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

  useEffect(() => {
    // Detect touch device
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    
    checkTouchDevice()
  }, [])

  return (
    <section className="pb-4 sm:pb-8 md:pb-12">
      {/* Full Width Grid - Same structure as collections */}
      <div className="grid grid-cols-1 gap-0">
        <Link
          href="/custom-projects"
          className={isTouchDevice ? "block" : "group cursor-pointer"}
          onMouseMove={!isTouchDevice ? handleMouseMove : undefined}
          onMouseLeave={!isTouchDevice ? handleMouseLeave : undefined}
        >
          <div className={`p-4 sm:p-8 md:p-12 lg:p-16 transition-colors duration-500 bg-squarage-blue ${isTouchDevice ? '' : 'hover:bg-squarage-green'}`}>
            <div className="bg-squarage-white px-6 py-4 sm:px-8 sm:py-6 md:px-12 md:py-8 text-center flex items-center justify-center border-2 md:border-0 border-squarage-black m-4 md:m-0">
              <h3 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold font-neue-haas text-squarage-black">
                Want a Custom Piece?
              </h3>
            </div>
          </div>
        </Link>
        
        {/* Mobile Button - Only shown on touch devices */}
        {isTouchDevice && (
          <div className="px-4 pb-4 pt-1 sm:px-8 sm:pb-8 sm:pt-2 md:px-12 md:pb-12 md:pt-3 lg:px-16 lg:pb-16 lg:pt-4 bg-squarage-blue">
            <div className="flex justify-center">
              <Link
                href="/custom-projects"
                className="px-6 py-3 bg-squarage-white border-2 border-squarage-black font-bold font-neue-haas text-squarage-black text-xl"
              >
                Start designing
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Cursor Following Tooltip - Only shown on non-touch devices */}
      {tooltip.visible && !isTouchDevice && (
        <div 
          className="absolute z-50 px-9 py-6 bg-squarage-white border-4 border-squarage-black font-bold font-neue-haas text-squarage-black text-5xl pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.text}
        </div>
      )}
    </section>
  )
}