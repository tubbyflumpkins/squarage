import { useCallback, useEffect, useRef, useState } from 'react'

interface BoomerangOptions {
  initialRotationDeg: number
  /** The idle sweep bounces between these two angles, so the shelf's back is never shown. */
  minAngleDeg: number
  maxAngleDeg: number
}

const BASE_SPEED = 0.0012
const FRICTION = 0.97
const BLEND_RATE = 0.01

const wrap = (rad: number) => ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

function normalizeAngle(rad: number): number {
  let deg = (rad * 180 / Math.PI) % 360
  if (deg > 180) deg -= 360
  if (deg < -180) deg += 360
  return deg
}

/**
 * The Shelf Builder's rotation: a slow idle sweep between two angles, drag or swipe to turn,
 * and a flick carries momentum before the sweep takes over again. A parameterised copy of the
 * logic in app/collections/warped/designer/page.tsx, for read-only views of a shelf.
 * Spread `handlers` on the element wrapping RenderedShelfView, and pass `rotation + Math.PI / 4`.
 */
export function useBoomerangRotation({ initialRotationDeg, minAngleDeg, maxAngleDeg }: BoomerangOptions) {
  const [rotation, setRotation] = useState(initialRotationDeg * Math.PI / 180)
  const [isDragging, setIsDragging] = useState(false)

  // Animation variables live in refs: the RAF loop must not restart when they change
  const velocityRef = useRef(0.0008)
  const targetSpeedRef = useRef(-BASE_SPEED)
  const isDraggingRef = useRef(isDragging)
  isDraggingRef.current = isDragging
  const minAngleDegRef = useRef(minAngleDeg)
  const maxAngleDegRef = useRef(maxAngleDeg)
  minAngleDegRef.current = minAngleDeg
  maxAngleDegRef.current = maxAngleDeg

  const lastX = useRef(0)
  const lastTime = useRef(0)
  const dragVelocityRef = useRef(0)
  const lastFrameTime = useRef(0)
  const rotationRef = useRef(rotation)
  // Sync the ref when a drag moves the rotation
  const rotationSyncRef = useRef(rotation)
  if (rotation !== rotationSyncRef.current) {
    rotationRef.current = rotation
    rotationSyncRef.current = rotation
  }

  useEffect(() => {
    let id: number
    let lastStateUpdate = 0
    const stateInterval = window.innerWidth < 768 ? 33 : 0 // throttle to ~30fps on mobile only
    const tick = (time: number) => {
      const dt = lastFrameTime.current ? Math.min((time - lastFrameTime.current) / 16.667, 3) : 1
      lastFrameTime.current = time

      if (!isDraggingRef.current) {
        for (let i = 0; i < dt; i++) {
          velocityRef.current = velocityRef.current * FRICTION + (targetSpeedRef.current - velocityRef.current) * BLEND_RATE
        }
        const next = rotationRef.current + velocityRef.current * dt
        const angleDeg = normalizeAngle(next)
        if (angleDeg <= minAngleDegRef.current && targetSpeedRef.current < 0) {
          targetSpeedRef.current = BASE_SPEED
        } else if (angleDeg >= maxAngleDegRef.current && targetSpeedRef.current > 0) {
          targetSpeedRef.current = -BASE_SPEED
        }
        rotationRef.current = wrap(next)
        if (time - lastStateUpdate > stateInterval) {
          setRotation(rotationRef.current)
          lastStateUpdate = time
        }
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  const start = useCallback((x: number) => {
    setIsDragging(true)
    lastX.current = x
    lastTime.current = performance.now()
    dragVelocityRef.current = 0
  }, [])

  // A swipe turns the shelf the way the finger moves it, twice as far per pixel as the mouse
  const move = useCallback((x: number, perPixel: number, velocityPerPixel: number) => {
    const now = performance.now()
    const dx = x - lastX.current
    const dt = now - lastTime.current
    if (dt > 0) dragVelocityRef.current = (dx * velocityPerPixel) / Math.max(dt, 8)
    setRotation((r) => wrap(r + dx * perPixel))
    lastX.current = x
    lastTime.current = now
  }, [])

  const end = useCallback(() => {
    if (!isDraggingRef.current) return
    velocityRef.current = Math.max(-0.05, Math.min(0.05, dragVelocityRef.current * 30))
    setIsDragging(false)
  }, [])

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => start(e.clientX),
    onMouseMove: (e: React.MouseEvent) => { if (isDraggingRef.current) move(e.clientX, 0.005, 0.002) },
    onMouseUp: end,
    onMouseLeave: end,
    onTouchStart: (e: React.TouchEvent) => { if (e.touches.length === 1) start(e.touches[0].clientX) },
    onTouchMove: (e: React.TouchEvent) => { if (isDraggingRef.current && e.touches.length === 1) move(e.touches[0].clientX, -0.01, -0.004) },
    onTouchEnd: end,
    onTouchCancel: end,
  }

  return { rotation, isDragging, handlers }
}
