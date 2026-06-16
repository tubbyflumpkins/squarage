'use client'

import { useEffect, useRef, useState } from 'react'

// Posé tile positioner.
//
// Model (identical to production):
//   object-fit: cover            -> always fills the frame, no white edges
//   object-position: ax% ay%     -> picks which slice of the photo shows
//   transform: scale(z)          -> zoom (z >= 1)
//   transform-origin: ax% ay%    -> zoom anchored at the SAME point you dragged to
//
// Because the zoom anchor == the drag anchor, dragging to the bottom and
// then zooming keeps the bottom edge pinned (the chair grows upward from
// it). Once zoomed, moving the anchor pans the magnified content in any
// direction. Anchor stays within 0..100%, scale stays >= 1, so the frame
// is always fully covered — white edges are impossible.

const IMG = '/images/pose/pose-homepage.png'
const DESKTOP_H = 500
const MOBILE_W = 390
const MOBILE_H = 273 // aspect-[100/70]

const clampScale = (s: number) => Math.min(5, Math.max(1, s))
const clamp01 = (n: number) => Math.min(100, Math.max(0, n))

/** One independently-controlled preview frame. */
function Positioner({
  label,
  outline,
  widthCss,
  heightPx,
  prefix,
  defaultAnchor,
}: {
  label: string
  outline: string
  widthCss: string
  heightPx: number
  prefix: string // '' for mobile, 'md:' for desktop
  defaultAnchor: { x: number; y: number }
}) {
  const [anchor, setAnchor] = useState(defaultAnchor) // %, 0..100
  const [z, setZ] = useState(1)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; ax: number; ay: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ax: anchor.x, ay: anchor.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    // Grab-and-move: drag down reveals the top (anchor moves toward 0).
    const dax = -((e.clientX - drag.current.x) / rect.width) * 100
    const day = -((e.clientY - drag.current.y) / rect.height) * 100
    setAnchor({ x: clamp01(drag.current.ax + dax), y: clamp01(drag.current.ay + day) })
  }
  const onPointerUp = () => {
    drag.current = null
  }

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      setZ((prev) => clampScale(prev * (1 - e.deltaY * 0.0015)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const ax = anchor.x.toFixed(1)
  const ay = anchor.y.toFixed(1)
  const zz = z.toFixed(3)
  const fragment = `${prefix}object-[${ax}%_${ay}%] ${prefix}[transform:scale(${zz})] ${prefix}[transform-origin:${ax}%_${ay}%]`
  const readable = `anchor ${ax}% ${ay}%  ·  zoom ${zz}`

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${anchor.x}% ${anchor.y}%`,
    transform: `scale(${z})`,
    transformOrigin: `${anchor.x}% ${anchor.y}%`,
    userSelect: 'none',
    pointerEvents: 'none',
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '0.5rem', color: '#555', fontSize: '0.85rem' }}>{label}</div>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        <button onClick={() => setZ((v) => clampScale(v + 0.1))} style={btn}>＋ zoom</button>
        <button onClick={() => setZ((v) => clampScale(v - 0.1))} style={btn}>－ zoom</button>
        <button onClick={() => { setAnchor(defaultAnchor); setZ(1) }} style={btn}>reset</button>
        <code style={{ background: '#1a1a1a', color: '#7CFC9B', padding: '0.4rem 0.6rem', borderRadius: 6 }}>{readable}</code>
        <button
          onClick={() => navigator.clipboard?.writeText(fragment)}
          style={{ ...btn, background: '#ff962d', color: '#fff', borderColor: '#ff962d' }}
        >
          Copy
        </button>
      </div>
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          width: widthCss,
          height: heightPx,
          position: 'relative',
          overflow: 'hidden',
          outline: `2px solid ${outline}`,
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG} alt="" draggable={false} style={imgStyle} />
      </div>
    </div>
  )
}

export default function PoseDebugPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fffaf4', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a1a' }}>
        Posé tile positioner
      </h1>
      <p style={{ color: '#555', marginBottom: '1.5rem', maxWidth: 740 }}>
        Drag to set the anchor (which part of the photo to feature). Scroll or use +/− to zoom — the
        zoom stays pinned to wherever you dragged, so drag to the bottom edge and zoom in and the
        bottom stays put. No white edges are possible. Frame desktop and mobile separately, then hit
        Copy on each and paste both fragments back to me.
      </p>

      <Positioner
        label="Desktop (½ window × 500px)"
        outline="#ff962d"
        widthCss="50vw"
        heightPx={DESKTOP_H}
        prefix="md:"
        defaultAnchor={{ x: 50, y: 100 }}
      />
      <Positioner
        label="Mobile (aspect 100/70)"
        outline="#4a9b6e"
        widthCss={`${MOBILE_W}px`}
        heightPx={MOBILE_H}
        prefix=""
        defaultAnchor={{ x: 50, y: 60 }}
      />
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '0.45rem 0.8rem',
  borderRadius: 6,
  border: '1px solid #ccc',
  background: '#fff',
  color: '#1a1a1a',
  cursor: 'pointer',
  fontSize: '0.9rem',
}
