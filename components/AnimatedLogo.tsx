'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// --- Constants (matching the original animation) ---
const LETTERS = ['s', 'q', 'u', 'a', 'r', 'a', 'g', 'e']
const TILE_W = 70
const TILE_H = 71
const GAP = 5
const STEP = TILE_W + GAP // 75
const STAGE_W = LETTERS.length * TILE_W + (LETTERS.length - 1) * GAP // 595
const STAGE_H = TILE_H // 71
const FONT_SIZE = 78
const TEXT_Y = 40.5
const ROLL_MS = 300
const PAUSE_MS = 100
const LIFT_PEAK = (TILE_W / 2) * (Math.SQRT2 - 1) // ~14.5px
const GREEN = '#4A9B4E'
const WHITE = '#FFFFFF'

// Module-level flag: resets on hard reload (JS re-executes), persists across client-side navigations
let hasAnimatedThisPageLoad = false

// SSR-safe layout effect
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function sleep(ms: number, timeouts: ReturnType<typeof setTimeout>[]): Promise<void> {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms)
    timeouts.push(id)
  })
}

interface AnimatedLogoProps {
  inverted: boolean
  className?: string
  instanceId?: string
  /** When set, renders visible text on top of the knockout in this color (ignored when inverted) */
  textColor?: string
}

export default function AnimatedLogo({
  inverted,
  className = '',
  instanceId = 'default',
  textColor,
}: AnimatedLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const rollerTrackRef = useRef<HTMLDivElement>(null)
  const rollerRef = useRef<HTMLDivElement>(null)
  const letterRefs = useRef<(SVGSVGElement | null)[]>([])
  const shouldAnimateRef = useRef(false)
  const hasRunRef = useRef(false)

  const [scaleFactor, setScaleFactor] = useState(0)

  const fillColor = inverted ? WHITE : GREEN

  // Determine if animation should play (before first paint)
  useIsomorphicLayoutEffect(() => {
    if (hasRunRef.current) return
    if (hasAnimatedThisPageLoad) return

    // Check if this instance is visible (avoid animating hidden desktop/mobile)
    if (!containerRef.current || containerRef.current.clientHeight === 0) return

    shouldAnimateRef.current = true

    // Hide all letters before paint
    letterRefs.current.forEach(el => {
      if (el) el.style.opacity = '0'
    })
  }, [])

  // Measure container and compute scale
  useEffect(() => {
    if (!containerRef.current) return

    const updateScale = () => {
      if (containerRef.current) {
        const h = containerRef.current.clientHeight
        if (h > 0) setScaleFactor(h / STAGE_H)
      }
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Run animation
  useEffect(() => {
    if (!shouldAnimateRef.current) return
    if (hasRunRef.current) return
    if (scaleFactor === 0) return

    // Only animate once
    hasRunRef.current = true

    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []
    let rafId = 0

    const animateTumble = (
      fromX: number, toX: number,
      fromRot: number, toRot: number,
      duration: number
    ): Promise<void> => {
      return new Promise(resolve => {
        const startTime = performance.now()

        const frame = (now: number) => {
          if (cancelled) { resolve(); return }

          const t = Math.min((now - startTime) / duration, 1)
          const et = easeInOutCubic(t)

          const x = fromX + (toX - fromX) * et
          const rot = fromRot + (toRot - fromRot) * et
          const lift = LIFT_PEAK * Math.sin(Math.PI * et)

          if (rollerTrackRef.current) {
            rollerTrackRef.current.style.transform = `translate(${x}px, ${-lift}px)`
          }
          if (rollerRef.current) {
            rollerRef.current.style.transform = `rotate(${rot}deg)`
          }

          if (t < 1) {
            rafId = requestAnimationFrame(frame)
          } else {
            if (rollerTrackRef.current) {
              rollerTrackRef.current.style.transform = `translate(${toX}px, 0px)`
            }
            if (rollerRef.current) {
              rollerRef.current.style.transform = `rotate(${toRot}deg)`
            }
            resolve()
          }
        }

        rafId = requestAnimationFrame(frame)
      })
    }

    const runAnimation = async () => {
      // Wait for Soap font
      try {
        await document.fonts.ready
        let attempts = 0
        while (!document.fonts.check('78px "Soap Regular"') && attempts < 50) {
          await sleep(50, timeouts)
          attempts++
          if (cancelled) return
        }
      } catch { /* proceed anyway */ }

      if (cancelled) return

      // Calculate off-screen start position
      const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 24
      const svgLeftOffset = containerLeft / scaleFactor

      // How many empty STEP-sized rolls to get from off-screen to the original start (-STEP)
      const emptySteps = Math.max(1, Math.ceil((svgLeftOffset + TILE_W - STEP) / STEP))
      const startX = -(1 + emptySteps) * STEP

      // Reset state: hide letters, position roller at start
      letterRefs.current.forEach(el => {
        if (el) {
          el.style.opacity = '0'
          el.style.transform = ''
        }
      })

      let x = startX
      let rot = 0

      if (rollerTrackRef.current) {
        rollerTrackRef.current.style.transform = `translate(${x}px, 0px)`
      }
      if (rollerRef.current) {
        rollerRef.current.style.transform = `rotate(0deg)`
        rollerRef.current.style.opacity = '1'
      }

      // Phase 1: Initial delay
      await sleep(600, timeouts)
      if (cancelled) return

      // Phase 2: Empty rolls (off-screen to original start position)
      for (let i = 0; i < emptySteps; i++) {
        const nextX = startX + (i + 1) * STEP
        const nextRot = rot + 90

        await animateTumble(x, nextX, rot, nextRot, ROLL_MS)
        x = nextX
        rot = nextRot
        if (cancelled) return

        if (i < emptySteps - 1) {
          await sleep(PAUSE_MS, timeouts)
          if (cancelled) return
        }
      }

      // Phase 3: Letter rolls
      for (let i = 0; i < LETTERS.length; i++) {
        const nextX = i * STEP
        const nextRot = rot + 90

        await animateTumble(x, nextX, rot, nextRot, ROLL_MS)
        x = nextX
        rot = nextRot
        if (cancelled) return

        // Reveal letter
        const letterEl = letterRefs.current[i]
        if (letterEl) letterEl.style.opacity = '1'

        if (i < LETTERS.length - 1) {
          await sleep(PAUSE_MS, timeouts)
          if (cancelled) return
        }
      }

      // Phase 4: Fade out roller
      if (rollerRef.current && !cancelled) {
        const fadeAnim = rollerRef.current.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 180, fill: 'forwards' }
        )
        await fadeAnim.finished
        if (rollerRef.current) rollerRef.current.style.opacity = '0'
        fadeAnim.cancel()
      }

      if (cancelled) return
      await sleep(150, timeouts)
      if (cancelled) return

      // Phase 5: Bounce flourish
      const bounceAnims: Animation[] = []
      letterRefs.current.forEach((el, i) => {
        if (!el) return
        const anim = el.animate(
          [
            { transform: 'translateY(0)' },
            { transform: 'translateY(-18px)', offset: 0.25 },
            { transform: 'translateY(0)', offset: 0.5 },
            { transform: 'translateY(-6px)', offset: 0.7 },
            { transform: 'translateY(0)', offset: 0.85 },
            { transform: 'translateY(-2px)', offset: 0.92 },
            { transform: 'translateY(0)' },
          ],
          { duration: 700, delay: i * 50, easing: 'ease-out' }
        )
        bounceAnims.push(anim)
      })

      await Promise.all(bounceAnims.map(a => a.finished.catch(() => {})))

      if (!cancelled) {
        hasAnimatedThisPageLoad = true
      }
    }

    runAnimation()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      timeouts.forEach(clearTimeout)
    }
  }, [scaleFactor])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'visible',
        aspectRatio: `${STAGE_W} / ${STAGE_H}`,
      }}
      role="img"
      aria-label="Squarage Studio"
    >
      <div
        ref={stageRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: STAGE_W,
          height: STAGE_H,
          transformOrigin: 'left top',
          transform: scaleFactor > 0 ? `scale(${scaleFactor})` : undefined,
          visibility: scaleFactor > 0 ? 'visible' : 'hidden',
          overflow: 'visible',
        }}
      >
        {/* Letter squares */}
        {LETTERS.map((letter, i) => (
          <svg
            key={i}
            ref={el => { letterRefs.current[i] = el }}
            width={TILE_W}
            height={TILE_H}
            viewBox={`0 0 ${TILE_W} ${TILE_H}`}
            style={{
              overflow: 'visible',
              position: 'absolute',
              top: 0,
              left: i * STEP,
              willChange: 'opacity, transform',
            }}
          >
            <defs>
              <mask id={`logo-mask-${instanceId}-${i}`}>
                <rect width={TILE_W} height={TILE_H} fill="white" />
                <text
                  x={TILE_W / 2}
                  y={TEXT_Y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="'Soap Regular', serif"
                  fontSize={FONT_SIZE}
                  fill="black"
                >
                  {letter}
                </text>
              </mask>
            </defs>
            <rect
              width={TILE_W}
              height={TILE_H}
              fill={fillColor}
              mask={`url(#logo-mask-${instanceId}-${i})`}
              style={{ transition: 'fill 0.3s ease' }}
            />
            {/* Visible text layer on top of knockout (when textColor is set and not inverted) */}
            {textColor && !inverted && (
              <text
                x={TILE_W / 2}
                y={TEXT_Y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Soap Regular', serif"
                fontSize={FONT_SIZE}
                fill={textColor}
              >
                {letter}
              </text>
            )}
          </svg>
        ))}

        {/* Roller */}
        <div
          ref={rollerTrackRef}
          style={{
            position: 'absolute',
            top: 0,
            width: TILE_W,
            height: TILE_H,
            willChange: 'transform',
            zIndex: 10,
          }}
        >
          <div
            ref={rollerRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: fillColor,
              willChange: 'transform, opacity',
              transition: 'background-color 0.3s ease',
              opacity: 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}
