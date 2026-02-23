'use client'

import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types'
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types'

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[16px] uppercase tracking-[0.1em] text-neutral-400 animate-pulse">
          Loading 3D view...
        </span>
      </div>
    ),
  },
)

// Default shelf parameters (matches designer defaults)
const DEFAULTS = {
  isCorner: false,
  width: 45,
  height: 24,
  depth: 10,
  length: 36,
  shelfCount: 3,
  columnCount: 4,
  roundLeft: false,
  roundRight: false,
}

function computeAmplitude(height: number): number {
  const minH = 24, maxH = 76
  const minAmp = 1.5, maxAmp = 3
  const t = Math.max(0, Math.min(1, (height - minH) / (maxH - minH)))
  return minAmp + t * (maxAmp - minAmp)
}

function computeShelfOffset(height: number): number {
  const t = Math.max(0, Math.min(1, (height - 24) / (76 - 24)))
  return Math.round(2 + t * 4)
}

function computeColumnOffset(width: number): number {
  const t = Math.max(0, Math.min(1, (width - 24) / (76 - 24)))
  return Math.round(2 + t * 4)
}

export default function CustomPage() {
  const [rotation, setRotation] = useState(350 * Math.PI / 180)
  const velocityRef = useRef(0.0008)
  const targetSpeedRef = useRef(-0.0012)
  const tilt = 25

  const amplitude = computeAmplitude(DEFAULTS.height)
  const shelfOffset = computeShelfOffset(DEFAULTS.height)
  const columnOffset = computeColumnOffset(DEFAULTS.width)

  const flatParams: ShelfParams = useMemo(() => ({
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    depth: DEFAULTS.depth,
    length: DEFAULTS.length,
    amplitude,
    shelfCount: DEFAULTS.shelfCount,
    columnCount: DEFAULTS.columnCount,
    shelfOffset,
    columnOffset,
    roundLeft: DEFAULTS.roundLeft,
    roundRight: DEFAULTS.roundRight,
  }), [amplitude, shelfOffset, columnOffset])

  const cornerParams: CornerShelfParams = useMemo(() => ({
    width: DEFAULTS.width,
    length: DEFAULTS.length,
    depth: DEFAULTS.depth,
    height: DEFAULTS.height,
    amplitude,
    shelfCount: DEFAULTS.shelfCount,
    columnCount: DEFAULTS.columnCount,
    shelfOffset,
    columnOffset,
    columnAngle: 45,
    wallAlign: 1,
  }), [amplitude, shelfOffset, columnOffset])

  // Boomerang auto-rotation
  const rotationRef = useRef(rotation)
  const lastFrameTime = useRef(0)
  const rotationSyncRef = useRef(rotation)
  if (rotation !== rotationSyncRef.current) {
    rotationRef.current = rotation
    rotationSyncRef.current = rotation
  }

  const baseSpeed = 0.0012
  const friction = 0.97
  const blendRate = 0.01
  const minAngleDeg = -85
  const maxAngleDeg = -10

  const normalizeAngle = (rad: number): number => {
    let deg = (rad * 180 / Math.PI) % 360
    if (deg > 180) deg -= 360
    if (deg < -180) deg += 360
    return deg
  }

  useEffect(() => {
    let id: number
    let lastStateUpdate = 0
    const mobile = window.innerWidth < 768
    const STATE_INTERVAL = mobile ? 33 : 0

    const tick = (time: number) => {
      const dt = lastFrameTime.current ? Math.min((time - lastFrameTime.current) / 16.667, 3) : 1
      lastFrameTime.current = time

      for (let i = 0; i < dt; i++) {
        velocityRef.current = velocityRef.current * friction + (targetSpeedRef.current - velocityRef.current) * blendRate
      }

      const newRotation = rotationRef.current + velocityRef.current * dt
      const angleDeg = normalizeAngle(newRotation)

      if (angleDeg <= minAngleDeg && targetSpeedRef.current < 0) {
        targetSpeedRef.current = baseSpeed
      } else if (angleDeg >= maxAngleDeg && targetSpeedRef.current > 0) {
        targetSpeedRef.current = -baseSpeed
      }

      rotationRef.current = ((newRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

      if (time - lastStateUpdate > STATE_INTERVAL) {
        setRotation(rotationRef.current)
        lastStateUpdate = time
      }

      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drag interaction for the 3D view
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const lastMouseX = useRef(0)
  const lastTime = useRef(0)
  const dragVelocityRef = useRef(0)

  // Pause auto-rotation while dragging
  useEffect(() => {
    isDraggingRef.current = isDragging
  }, [isDragging])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    lastMouseX.current = e.clientX
    lastTime.current = performance.now()
    dragVelocityRef.current = 0
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    const now = performance.now()
    const dx = e.clientX - lastMouseX.current
    const dt = now - lastTime.current
    if (dt > 0) dragVelocityRef.current = (dx * 0.002) / Math.max(dt, 8)
    setRotation((r) => ((r + dx * 0.005) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2))
    lastMouseX.current = e.clientX
    lastTime.current = now
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      velocityRef.current = Math.max(-0.05, Math.min(0.05, dragVelocityRef.current * 30))
      setIsDragging(false)
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    lastMouseX.current = e.touches[0].clientX
    lastTime.current = performance.now()
    dragVelocityRef.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return
    const now = performance.now()
    const dx = e.touches[0].clientX - lastMouseX.current
    const dt = now - lastTime.current
    if (dt > 0) dragVelocityRef.current = (-dx * 0.004) / Math.max(dt, 8)
    setRotation((r) => ((r - dx * 0.01) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2))
    lastMouseX.current = e.touches[0].clientX
    lastTime.current = now
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (isDraggingRef.current) {
      velocityRef.current = Math.max(-0.05, Math.min(0.05, dragVelocityRef.current * 30))
      setIsDragging(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      {/* Section 1: Warped Shelf Designer Preview */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-neue-haas text-squarage-black text-center mb-4">
            Use Our Warped Shelf Designer
          </h1>
          <p className="text-lg md:text-2xl font-medium font-neue-haas text-squarage-black/70 text-center max-w-3xl mx-auto mb-8 md:mb-12">
            Design your perfect warped shelf with our interactive 3D tool. Customize dimensions, layout, and finish.
          </p>

          {/* 3D Preview */}
          <div className="relative w-full aspect-[4/3] md:aspect-[16/9] max-w-4xl mx-auto mb-8 md:mb-12">
            <div
              className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <RenderedShelfView
                isCorner={false}
                flatParams={flatParams}
                cornerParams={cornerParams}
                rotation={rotation + Math.PI / 4}
                tilt={tilt}
                finish="Oak"
                width={DEFAULTS.width}
                height={DEFAULTS.height}
                depth={DEFAULTS.depth}
                length={DEFAULTS.length}
              />
            </div>
            <span className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 text-[12px] md:text-[14px] font-medium tracking-[0.01em] text-squarage-black/40 select-none pointer-events-none">
              <span className="hidden md:inline">Drag to rotate</span>
              <span className="md:hidden">Swipe to rotate</span>
            </span>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link
              href="/collections/warped/designer"
              className="inline-block bg-squarage-green font-bold font-neue-haas text-lg sm:text-2xl md:text-3xl py-3 px-8 md:py-4 md:px-12 border-2 border-squarage-green hover:bg-squarage-yellow hover:border-squarage-yellow hover:scale-105 transition-all duration-300 text-white"
            >
              Start Designing
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-squarage-black/15" />
      </div>

      {/* Section 2: Get in Touch */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image */}
            <div className="aspect-[4/3] relative overflow-hidden">
              <Image
                src="/images/IMG_6122.jpeg"
                alt="Custom furniture craftsmanship"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-neue-haas text-squarage-black mb-4 leading-tight">
                Need Something More Specific?
              </h2>
              <p className="text-lg md:text-xl font-medium font-neue-haas text-squarage-black/70 mb-8 leading-relaxed">
                Have a unique vision in mind? We work directly with you to design and build custom furniture pieces tailored to your space. Get in touch to start the conversation.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-squarage-yellow font-bold font-neue-haas text-lg sm:text-2xl md:text-3xl py-3 px-8 md:py-4 md:px-12 border-2 border-squarage-yellow hover:bg-squarage-green hover:border-squarage-green hover:scale-105 transition-all duration-300 text-white"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
