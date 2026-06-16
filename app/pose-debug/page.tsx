'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Debug tool to position the Posé homepage tile image.
// Drag to pan, scroll / +/- to zoom. The rendering here matches the
// production tile: an <img> with object-fit:cover plus
// transform: translate(tx%, ty%) scale(s) and transform-origin center.
//
// Panning is CLAMPED so the image always fully covers BOTH the desktop
// and mobile frames — you can never expose the cream background. To pan
// further, zoom in (more zoom = more overflow room to move within).
//
// Copy the output line and hand it back to apply it.

const IMG = '/images/pose/pose-homepage.png'
const IMG_ASPECT = 2400 / 1792
const DESKTOP_H = 500
const MOBILE_W = 390
const MOBILE_H = 273 // aspect-[100/70]

type Vals = { tx: number; ty: number; s: number }

const clampScale = (s: number) => Math.min(5, Math.max(1, s))
const clampNum = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// Max pannable distance (as % of frame) that keeps an object-cover image
// fully covering a W×H frame at zoom s, with transform-origin center.
function maxPan(W: number, H: number, s: number) {
  const fa = W / H
  const contentW = IMG_ASPECT > fa ? H * IMG_ASPECT : W
  const contentH = IMG_ASPECT > fa ? H : W / IMG_ASPECT
  return {
    x: Math.max(0, ((contentW * s) / W - 1) / 2 * 100),
    y: Math.max(0, ((contentH * s) / H - 1) / 2 * 100),
  }
}

export default function PoseDebugPage() {
  const [vals, setVals] = useState<Vals>({ tx: 0, ty: 0, s: 1.15 })
  const frameRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  // Clamp tx/ty so the image covers BOTH frames at the given scale.
  const clampVals = useCallback((v: Vals): Vals => {
    const deskW = frameRef.current?.getBoundingClientRect().width ?? 640
    const d = maxPan(deskW, DESKTOP_H, v.s)
    const m = maxPan(MOBILE_W, MOBILE_H, v.s)
    const mx = Math.min(d.x, m.x)
    const my = Math.min(d.y, m.y)
    return { s: v.s, tx: clampNum(v.tx, -mx, mx), ty: clampNum(v.ty, -my, my) }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      drag.current = { x: e.clientX, y: e.clientY, tx: vals.tx, ty: vals.ty }
    },
    [vals.tx, vals.ty]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current || !frameRef.current) return
      const rect = frameRef.current.getBoundingClientRect()
      const dxPct = ((e.clientX - drag.current.x) / rect.width) * 100
      const dyPct = ((e.clientY - drag.current.y) / rect.height) * 100
      setVals((v) => clampVals({ ...v, tx: drag.current!.tx + dxPct, ty: drag.current!.ty + dyPct }))
    },
    [clampVals]
  )

  const onPointerUp = useCallback(() => {
    drag.current = null
  }, [])

  // Wheel zoom (native listener so we can preventDefault), re-clamped.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      setVals((v) => clampVals({ ...v, s: clampScale(v.s * (1 - e.deltaY * 0.0015)) }))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [clampVals])

  const transform = `translate(${vals.tx.toFixed(1)}%, ${vals.ty.toFixed(1)}%) scale(${vals.s.toFixed(3)})`
  const reset = () => setVals({ tx: 0, ty: 0, s: 1.15 })
  const bump = (d: number) => setVals((v) => clampVals({ ...v, s: clampScale(v.s + d) }))
  const copy = () => navigator.clipboard?.writeText(transform)

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform,
    transformOrigin: 'center center',
    userSelect: 'none',
    pointerEvents: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fffaf4', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a1a' }}>
        Posé tile positioner
      </h1>
      <p style={{ color: '#555', marginBottom: '1.5rem', maxWidth: 680 }}>
        Drag the image to pan, scroll over it to zoom (or use the +/− buttons). Panning is locked so
        the image always fills both windows — if you can&apos;t drag far enough, zoom in for more room.
        The left box is the desktop tile (½ window × 500px); the right box is the mobile tile. When it
        looks right, hit Copy and paste the line back to me.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => bump(0.1)} style={btn}>＋ zoom</button>
        <button onClick={() => bump(-0.1)} style={btn}>－ zoom</button>
        <button onClick={reset} style={btn}>reset</button>
        <code style={{ background: '#1a1a1a', color: '#7CFC9B', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          {transform}
        </code>
        <button onClick={copy} style={{ ...btn, background: '#ff962d', color: '#fff', borderColor: '#ff962d' }}>
          Copy
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Desktop preview — matches md:w-1/2 md:h-[500px] */}
        <div>
          <div style={{ marginBottom: '0.5rem', color: '#555', fontSize: '0.85rem' }}>Desktop (½ window × 500px)</div>
          <div
            ref={frameRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              width: '50vw',
              height: DESKTOP_H,
              position: 'relative',
              overflow: 'hidden',
              outline: '2px solid #ff962d',
              cursor: 'grab',
              touchAction: 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG} alt="" draggable={false} style={imgStyle} />
          </div>
        </div>

        {/* Mobile preview — matches aspect-[100/70] */}
        <div>
          <div style={{ marginBottom: '0.5rem', color: '#555', fontSize: '0.85rem' }}>Mobile (aspect 100/70)</div>
          <div
            style={{
              width: MOBILE_W,
              height: MOBILE_H,
              position: 'relative',
              overflow: 'hidden',
              outline: '2px solid #4a9b6e',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG} alt="" draggable={false} style={imgStyle} />
          </div>
        </div>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '0.5rem 0.9rem',
  borderRadius: 6,
  border: '1px solid #ccc',
  background: '#fff',
  color: '#1a1a1a',
  cursor: 'pointer',
  fontSize: '0.9rem',
}
