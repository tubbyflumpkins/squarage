'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Debug tool to position the Posé homepage tile image.
// Drag to pan, scroll / +/- to zoom. The rendering here matches the
// production tile: an <img> with object-fit:cover plus
// transform: translate(tx%, ty%) scale(s) and transform-origin center.
// Copy the output line and hand it back to apply it.

const IMG = '/images/pose/pose-homepage.png'

type Vals = { tx: number; ty: number; s: number }

function clampScale(s: number) {
  return Math.min(5, Math.max(1, s))
}

export default function PoseDebugPage() {
  const [vals, setVals] = useState<Vals>({ tx: 0, ty: 0, s: 1.15 })
  const frameRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      drag.current = { x: e.clientX, y: e.clientY, tx: vals.tx, ty: vals.ty }
    },
    [vals.tx, vals.ty]
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const dxPct = ((e.clientX - drag.current.x) / rect.width) * 100
    const dyPct = ((e.clientY - drag.current.y) / rect.height) * 100
    setVals((v) => ({ ...v, tx: drag.current!.tx + dxPct, ty: drag.current!.ty + dyPct }))
  }, [])

  const onPointerUp = useCallback(() => {
    drag.current = null
  }, [])

  // Wheel zoom (attached via native listener so we can preventDefault).
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      setVals((v) => ({ ...v, s: clampScale(v.s * (1 - e.deltaY * 0.0015)) }))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const transform = `translate(${vals.tx.toFixed(1)}%, ${vals.ty.toFixed(1)}%) scale(${vals.s.toFixed(3)})`
  const reset = () => setVals({ tx: 0, ty: 0, s: 1.15 })
  const bump = (d: number) => setVals((v) => ({ ...v, s: clampScale(v.s + d) }))
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
      <p style={{ color: '#555', marginBottom: '1.5rem', maxWidth: 640 }}>
        Drag the image to pan, scroll over it to zoom (or use the +/− buttons). The left box is the
        desktop tile (½ window × 500px); the right box is the mobile tile. When it looks right, hit
        Copy and paste the line back to me.
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
              height: 500,
              position: 'relative',
              overflow: 'hidden',
              outline: '2px solid #ff962d',
              cursor: drag.current ? 'grabbing' : 'grab',
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
              width: 390,
              height: 273,
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
