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

export default function CustomDesignCard() {
  const [rotation, setRotation] = useState(15 * Math.PI / 180)
  const rotationRef = useRef(rotation)
  const velocityRef = useRef(0.0008)
  const targetSpeedRef = useRef(-0.0012)
  const lastFrameTime = useRef(0)
  const rotationSyncRef = useRef(rotation)

  if (rotation !== rotationSyncRef.current) {
    rotationRef.current = rotation
    rotationSyncRef.current = rotation
  }

  const baseSpeed = 0.0012
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

  const flatParams: ShelfParams = useMemo(() => ({
    width: 45, height: 24, depth: 10, length: 36,
    amplitude: 2, shelfCount: 3, columnCount: 4,
    shelfOffset: 2, columnOffset: 8,
    roundLeft: false, roundRight: false,
  }), [])

  const cornerParams: CornerShelfParams = useMemo(() => ({
    width: 45, length: 36, depth: 10, height: 24,
    amplitude: 2, shelfCount: 3, columnCount: 4,
    shelfOffset: 2, columnOffset: 8,
    columnAngle: 52.5, wallAlign: 1,
  }), [])

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
            finish="Oak"
            width={45}
            height={24}
            depth={10}
            length={36}
          />
        </div>

        {/* Start Designing button — overlays bottom of card */}
        <div className="absolute bottom-6 inset-x-6 z-10 pointer-events-auto">
          <span className="block w-full text-center bg-squarage-green font-bold font-neue-haas text-sm sm:text-lg md:text-xl py-2.5 md:py-3 border-2 border-squarage-green hover:bg-squarage-yellow hover:border-squarage-yellow hover:scale-105 transition-all duration-300 text-white">
            Start Designing
          </span>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <h3 className="font-neue-haas font-medium text-sm md:text-lg text-gray-900">
          Your Custom Design
        </h3>
        <span className="font-neue-haas font-medium text-sm md:text-lg text-gray-900 ml-4">
          Custom
        </span>
      </div>
    </Link>
  )
}
