'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types'
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types'

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
  { ssr: false },
)

interface BreathingShelfProps {
  finish?: 'Walnut' | 'Oak' | 'Birch'
  /** Sizes the view: it fills this box, so the box needs a width and a height. */
  className?: string
}

const START_ROTATION = 15 * Math.PI / 180
const BASE_SPEED = 0.003
const FRICTION = 0.97
const BLEND_RATE = 0.01
const MIN_ANGLE_DEG = -30
const MAX_ANGLE_DEG = 20
const MIN_HEIGHT = 24
const MAX_HEIGHT = 50
const MIN_SHELVES = 3
const MAX_SHELVES = 5

function normalizeAngle(rad: number): number {
  let deg = (rad * 180 / Math.PI) % 360
  if (deg > 180) deg -= 360
  if (deg < -180) deg += 360
  return deg
}

/**
 * The corner shelf that turns back and forth while it grows and shrinks: the loop from
 * CustomDesignCard, for pages where the shelf is not the first thing on screen. The 3D
 * loads a screen before the shelf scrolls in, the loop only runs while the shelf is on
 * screen, and it holds still for visitors who ask for reduced motion.
 */
export default function BreathingShelf({ finish = 'Oak', className = 'w-full h-full' }: BreathingShelfProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [near, setNear] = useState(false)
  const [pose, setPose] = useState({ rotation: START_ROTATION, height: MIN_HEIGHT, shelfCount: MIN_SHELVES })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const nearIo = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true)
        nearIo.disconnect()
      }
    }, { rootMargin: '100% 0px' })
    nearIo.observe(el)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => nearIo.disconnect()
    }

    const stateInterval = window.innerWidth < 768 ? 50 : 16
    let id = 0
    let lastFrameTime = 0
    let lastStateUpdate = 0
    let rotation = START_ROTATION
    let velocity = 0.002
    let targetSpeed = -BASE_SPEED
    let phase = 0

    const tick = (time: number) => {
      const dt = lastFrameTime ? Math.min((time - lastFrameTime) / 16.667, 3) : 1
      lastFrameTime = time

      // Rotation boomerang
      for (let i = 0; i < dt; i++) {
        velocity = velocity * FRICTION + (targetSpeed - velocity) * BLEND_RATE
      }
      const next = rotation + velocity * dt
      const angleDeg = normalizeAngle(next)
      if (angleDeg <= MIN_ANGLE_DEG && targetSpeed < 0) {
        targetSpeed = BASE_SPEED
      } else if (angleDeg >= MAX_ANGLE_DEG && targetSpeed > 0) {
        targetSpeed = -BASE_SPEED
      }
      rotation = ((next % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

      // Height & shelf count oscillation (smooth sine wave, ~8s full cycle)
      phase += dt * 0.008
      const t = (Math.sin(phase) + 1) / 2 // 0 → 1 → 0

      if (time - lastStateUpdate > stateInterval) {
        setPose({
          rotation,
          height: MIN_HEIGHT + t * (MAX_HEIGHT - MIN_HEIGHT),
          shelfCount: Math.round(MIN_SHELVES + t * (MAX_SHELVES - MIN_SHELVES)),
        })
        lastStateUpdate = time
      }

      id = requestAnimationFrame(tick)
    }

    let onScreen = false
    let hidden = document.visibilityState === 'hidden'
    const sync = () => {
      const run = onScreen && !hidden
      if (run && !id) {
        lastFrameTime = 0
        id = requestAnimationFrame(tick)
      } else if (!run && id) {
        cancelAnimationFrame(id)
        id = 0
      }
    }
    const screenIo = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    screenIo.observe(el)
    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden'
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      nearIo.disconnect()
      screenIo.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (id) cancelAnimationFrame(id)
    }
  }, [])

  const { rotation, height, shelfCount } = pose

  // Compute amplitude from height (same formula as designer)
  const amplitude = 2 + Math.max(0, Math.min(1, (height - 24) / (76 - 24)))

  const flatParams: ShelfParams = useMemo(() => ({
    width: 45, height, depth: 10, length: 36,
    amplitude, shelfCount, columnCount: 4,
    shelfOffset: 2, columnOffset: 8,
    roundLeft: false, roundRight: false,
  }), [height, amplitude, shelfCount])

  const cornerParams: CornerShelfParams = useMemo(() => ({
    width: 45, length: 36, depth: 10, height,
    amplitude, shelfCount, columnCount: 4,
    shelfOffset: 2, columnOffset: 8,
    columnAngle: 52.5, wallAlign: 1,
  }), [height, amplitude, shelfCount])

  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`}>
      {near && (
        <RenderedShelfView
          isCorner={true}
          flatParams={flatParams}
          cornerParams={cornerParams}
          rotation={rotation + Math.PI / 4}
          tilt={25}
          finish={finish}
          width={45}
          height={height}
          depth={10}
          length={36}
          floor
        />
      )}
    </div>
  )
}
