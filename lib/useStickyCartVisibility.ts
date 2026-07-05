'use client'

import { useState, useEffect, type RefObject } from 'react'

// Shows the sticky add-to-cart bar once the real add-to-cart section has
// scrolled above the viewport.
export function useStickyCartVisibility(ref: RefObject<HTMLElement | null>): boolean {
  const [showStickyCart, setShowStickyCart] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        setShowStickyCart(rect.bottom < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [ref])

  return showStickyCart
}
