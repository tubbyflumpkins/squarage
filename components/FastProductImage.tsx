'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface FastProductImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  fillContainer?: boolean // New prop to control whether image should fill its container
}

export default function FastProductImage({ 
  src, 
  alt, 
  width, 
  height, 
  className,
  fillContainer = false 
}: FastProductImageProps) {
  const [isPreloaded, setIsPreloaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLImageElement>(null)
  
  useEffect(() => {
    // Check if image is in our simple cache
    if (typeof window !== 'undefined' && window.__simpleImageCache?.has(src)) {
      setIsPreloaded(true)
      // Smooth transition to new src
      setCurrentSrc(src)
    } else {
      setCurrentSrc(src)
    }
  }, [src])
  
  // Once we know images are preloaded, always use native img for instant switching
  if (isPreloaded) {
    return (
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading="eager"
        decoding="sync"
        style={fillContainer ? {
          // For containers that need to be filled (like Warped carousel)
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        } : { 
          // Default behavior for regular product images
          width: '100%', 
          height: 'auto',
          // Prevent layout shift
          aspectRatio: `${width} / ${height}`,
          // Smooth fade between images
          transition: 'opacity 0.1s ease-in-out'
        }}
        onLoad={() => {
          // Ensure image is visible once loaded
          if (imgRef.current) {
            imgRef.current.style.opacity = '1'
          }
        }}
        onError={() => {
          // Handle error gracefully
          if (imgRef.current) {
            imgRef.current.style.opacity = '1'
          }
        }}
      />
    )
  }
  
  // Initial load - use Next.js Image with unoptimized for speed
  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={true}
      unoptimized={true}
      loading="eager"
      onLoad={() => {
        // Mark as preloaded once loaded
        if (typeof window !== 'undefined') {
          window.__simpleImageCache?.add(src)
          setIsPreloaded(true)
        }
      }}
    />
  )
}