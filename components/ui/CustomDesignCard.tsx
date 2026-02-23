'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types'
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types'

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
  { ssr: false },
)

interface CustomDesignCardProps {
  finish?: 'Walnut' | 'Oak' | 'Birch'
}

export default function CustomDesignCard({ finish = 'Oak' }: CustomDesignCardProps) {
  const [rotation, setRotation] = useState(15 * Math.PI / 180)
  const [animHeight, setAnimHeight] = useState(24)
  const [animShelfCount, setAnimShelfCount] = useState(3)
  const rotationRef = useRef(rotation)
  const velocityRef = useRef(0.002)
  const targetSpeedRef = useRef(-0.003)
  const lastFrameTime = useRef(0)
  const phaseRef = useRef(0)
  const rotationSyncRef = useRef(rotation)

  if (rotation !== rotationSyncRef.current) {
    rotationRef.current = rotation
    rotationSyncRef.current = rotation
  }

  const baseSpeed = 0.003
  const friction = 0.97
  const blendRate = 0.01

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
    const STATE_INTERVAL = mobile ? 50 : 16

    const tick = (time: number) => {
      const dt = lastFrameTime.current ? Math.min((time - lastFrameTime.current) / 16.667, 3) : 1
      lastFrameTime.current = time

      // Rotation boomerang
      for (let i = 0; i < dt; i++) {
        velocityRef.current = velocityRef.current * friction + (targetSpeedRef.current - velocityRef.current) * blendRate
      }

      const newRotation = rotationRef.current + velocityRef.current * dt
      const angleDeg = normalizeAngle(newRotation)

      if (angleDeg <= -30 && targetSpeedRef.current < 0) {
        targetSpeedRef.current = baseSpeed
      } else if (angleDeg >= 20 && targetSpeedRef.current > 0) {
        targetSpeedRef.current = -baseSpeed
      }

      rotationRef.current = ((newRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

      // Height & shelf count oscillation (smooth sine wave, ~8s full cycle)
      phaseRef.current += dt * 0.008
      const t = (Math.sin(phaseRef.current) + 1) / 2 // 0 → 1 → 0
      const h = 24 + t * (50 - 24)
      const sc = Math.round(3 + t * (5 - 3))

      if (time - lastStateUpdate > STATE_INTERVAL) {
        setRotation(rotationRef.current)
        setAnimHeight(h)
        setAnimShelfCount(sc)
        lastStateUpdate = time
      }

      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Compute amplitude from height (same formula as designer)
  const animAmplitude = 2 + Math.max(0, Math.min(1, (animHeight - 24) / (76 - 24)))

  const flatParams: ShelfParams = useMemo(() => ({
    width: 45, height: animHeight, depth: 10, length: 36,
    amplitude: animAmplitude, shelfCount: animShelfCount, columnCount: 4,
    shelfOffset: 2, columnOffset: 8,
    roundLeft: false, roundRight: false,
  }), [animHeight, animAmplitude, animShelfCount])

  const cornerParams: CornerShelfParams = useMemo(() => ({
    width: 45, length: 36, depth: 10, height: animHeight,
    amplitude: animAmplitude, shelfCount: animShelfCount, columnCount: 4,
    shelfOffset: 2, columnOffset: 8,
    columnAngle: 52.5, wallAlign: 1,
  }), [animHeight, animAmplitude, animShelfCount])

  return (
    <Link href="/collections/warped/designer" className="block">
      <div className="relative aspect-[4/5] mb-4 border border-squarage-black">
        <div className="w-full h-full pointer-events-none">
          <RenderedShelfView
            isCorner={true}
            flatParams={flatParams}
            cornerParams={cornerParams}
            rotation={rotation + Math.PI / 4}
            tilt={25}
            finish={finish}
            width={45}
            height={animHeight}
            depth={10}
            length={36}
          />
        </div>

        {/* Design Your Own button — overlays bottom of card */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <span className="inline-block text-center bg-squarage-green font-bold font-neue-haas text-lg sm:text-xl md:text-2xl py-2.5 md:py-3 px-6 md:px-8 border-2 border-squarage-green hover:bg-squarage-yellow hover:border-squarage-yellow hover:scale-105 transition-all duration-300 text-white whitespace-nowrap">
            Design Your Own
          </span>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <h3 className="font-neue-haas font-medium text-sm md:text-lg text-gray-900">
          Custom Design
        </h3>
        <span className="font-neue-haas font-medium text-sm md:text-lg text-gray-900 ml-4">
          Custom
        </span>
      </div>
    </Link>
  )
}
