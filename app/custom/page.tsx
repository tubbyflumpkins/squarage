'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

// Default shelf parameters — corner shelf to match designer defaults
const DEFAULTS = {
  isCorner: true,
  width: 45,
  height: 24,
  depth: 10,
  length: 36,
  shelfCount: 3,
  columnCount: 4,
}

function computeAmplitude(isCorner: boolean, height: number): number {
  const minH = 24, maxH = 76
  const minAmp = isCorner ? 2 : 1.5, maxAmp = 3
  const t = Math.max(0, Math.min(1, (height - minH) / (maxH - minH)))
  return minAmp + t * (maxAmp - minAmp)
}

function computeShelfOffset(height: number): number {
  const t = Math.max(0, Math.min(1, (height - 24) / (76 - 24)))
  return Math.round(2 + t * 4)
}

function computeColumnOffset(isCorner: boolean, width: number, length: number): number {
  if (isCorner) {
    const dim = Math.max(width, length)
    const t = Math.max(0, Math.min(1, (dim - 10) / (76 - 10)))
    return Math.round(6 + t * 4)
  }
  const t = Math.max(0, Math.min(1, (width - 24) / (76 - 24)))
  return Math.round(2 + t * 4)
}

function computeColumnAngle(width: number, length: number): number {
  const ratio = width / length
  const capRatio = 1.5
  if (ratio >= 1) {
    const t = Math.min((ratio - 1) / (capRatio - 1), 1)
    return 45 + t * 15
  } else {
    const t = Math.min((1 / ratio - 1) / (capRatio - 1), 1)
    return 45 - t * 15
  }
}

export default function CustomPage() {
  const router = useRouter()
  const [rotation, setRotation] = useState(15 * Math.PI / 180)
  const velocityRef = useRef(0.0008)
  const targetSpeedRef = useRef(-0.0012)
  const tilt = 25

  const amplitude = computeAmplitude(DEFAULTS.isCorner, DEFAULTS.height)
  const shelfOffset = computeShelfOffset(DEFAULTS.height)
  const columnOffset = computeColumnOffset(DEFAULTS.isCorner, DEFAULTS.width, DEFAULTS.length)
  const columnAngle = computeColumnAngle(DEFAULTS.width, DEFAULTS.length)

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
    roundLeft: false,
    roundRight: false,
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
    columnAngle,
    wallAlign: 1,
  }), [amplitude, shelfOffset, columnOffset, columnAngle])

  // Boomerang auto-rotation — corner shelf angles
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
  const minAngleDeg = -30
  const maxAngleDeg = 20

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

  // Navigate to designer with smooth transition
  const handleStartDesigning = (e: React.MouseEvent) => {
    e.preventDefault()
    sessionStorage.setItem('designer-transition', 'true')

    const navigate = () => router.push('/collections/warped/designer')

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(navigate)
    } else {
      navigate()
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Section 1: Warped Shelf Designer Preview */}
      <section className="pt-24 md:pt-28 pb-2 md:pb-4 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Title with Warped blob — floats over the 3D view */}
          <h1 className="relative z-10 text-4xl md:text-6xl lg:text-7xl font-black font-neue-haas text-squarage-black text-center mb-[-1em] md:mb-[-0.6em] flex flex-wrap items-center justify-center gap-x-3 md:gap-x-4">
            <span>Use Our</span>
            <span
              className="inline-block text-white leading-none"
              style={{
                backgroundColor: '#4A9B4E',
                borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%',
                padding: '0.25em 0.45em 0.3em',
              }}
            >
              Warped
            </span>
            <span>Shelf Designer</span>
          </h1>

          {/* 3D Preview — auto-rotating, no drag interaction */}
          <div
            className="relative w-full aspect-[4/3] md:aspect-[2/1]"
            style={{ viewTransitionName: 'shelf-viewer' } as React.CSSProperties}
          >
            <div className="w-full h-full pointer-events-none">
              <RenderedShelfView
                isCorner={true}
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

            {/* CTA Button — floating above viewer */}
            <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-10">
              <a
                href="/collections/warped/designer"
                onClick={handleStartDesigning}
                className="inline-block bg-squarage-green font-bold font-neue-haas text-lg sm:text-2xl md:text-3xl py-3 px-8 md:py-4 md:px-12 border-2 border-squarage-green hover:bg-squarage-yellow hover:border-squarage-yellow hover:scale-105 transition-all duration-300 text-white cursor-pointer"
              >
                Start Designing
              </a>
            </div>
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
                Have a unique vision in mind? We work directly with you to design and build custom furniture, spaces, and everything in between. Get in touch to start the conversation.
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
