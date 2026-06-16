'use client'

import { useEffect, useRef, useState } from 'react'

// Posé tile positioner.
//
// KEY: panning is done with `object-position`, NOT transform:translate.
// object-cover crops the photo to fill the box (crop locked to the
// object-position point); object-position chooses WHICH slice of the
// photo shows and can never expose the background. Zoom is transform
// scale(s>=1) from center, which always keeps the box covered.
//
// Each frame is independent (desktop is wide, mobile is taller, so they
// need different slices). Copy each fragment and paste both back.

const IMG = '/images/pose/pose-homepage.png'
const IMG_ASPECT = 2400 / 1792
const DESKTOP_H = 500
const MOBILE_W = 390
const MOBILE_H = 273 // aspect-[100/70]

const clampScale = (s: number) => Math.min(5, Math.max(1, s))
const clampNum = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** One independently-controlled preview frame. */
function Positioner({
  label,
  outline,
  widthCss,
  heightPx,
  fixedWidthPx,
  prefix,
  defaultPos,
}: {
  label: string
  outline: string
  widthCss: string
  heightPx: number
  fixedWidthPx?: number
  prefix: string // '' for mobile, 'md:' for desktop
  defaultPos: { x: number; y: number }
}) {
  const [pos, setPos] = useState(defaultPos) // object-position %, 0..100
  const [s, setS] = useState(1)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  // Pannable overflow (screen px) on each axis at the current zoom.
  const overflow = () => {
    const W = fixedWidthPx ?? frameRef.current?.getBoundingClientRect().width ?? 640
    const H = heightPx
    const fa = W / H
    const coverW = fa >= IMG_ASPECT ? W : H * IMG_ASPECT
    const coverH = fa >= IMG_ASPECT ? W / IMG_ASPECT : H
    return { Ox: Math.max(0, coverW * s - W), Oy: Math.max(0, coverH * s - H) }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const { Ox, Oy } = overflow()
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    // Grab-and-move feel: dragging down reveals the top (lower object-position).
    const nx = Ox > 0 ? clampNum(drag.current.px - (dx / Ox) * 100, 0, 100) : drag.current.px
    const ny = Oy > 0 ? clampNum(drag.current.py - (dy / Oy) * 100, 0, 100) : drag.current.py
    setPos({ x: nx, y: ny })
  }
  const onPointerUp = () => {
    drag.current = null
  }

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      setS((prev) => clampScale(prev * (1 - e.deltaY * 0.0015)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const px = pos.x.toFixed(1)
  const py = pos.y.toFixed(1)
  const ss = s.toFixed(3)
  const fragment = `${prefix}object-[${px}%_${py}%] ${prefix}[transform:scale(${ss})]`
  const readable = `object-position: ${px}% ${py}%  ·  zoom ${ss}`

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${pos.x}% ${pos.y}%`,
    transform: `scale(${s})`,
    transformOrigin: 'center center',
    userSelect: 'none',
    pointerEvents: 'none',
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '0.5rem', color: '#555', fontSize: '0.85rem' }}>{label}</div>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        <button onClick={() => setS((v) => clampScale(v + 0.1))} style={btn}>＋ zoom</button>
        <button onClick={() => setS((v) => clampScale(v - 0.1))} style={btn}>－ zoom</button>
        <button onClick={() => { setPos(defaultPos); setS(1) }} style={btn}>reset</button>
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
      <p style={{ color: '#555', marginBottom: '1.5rem', maxWidth: 720 }}>
        Drag to choose which slice of the photo shows (it&apos;s locked inside the photo — no white
        edges possible). Scroll or use +/− to zoom. Frame the desktop and mobile tiles independently,
        then hit Copy on each and paste both fragments back to me.
      </p>

      <Positioner
        label="Desktop (½ window × 500px)"
        outline="#ff962d"
        widthCss="50vw"
        heightPx={DESKTOP_H}
        prefix="md:"
        defaultPos={{ x: 50, y: 100 }}
      />
      <Positioner
        label="Mobile (aspect 100/70)"
        outline="#4a9b6e"
        widthCss={`${MOBILE_W}px`}
        heightPx={MOBILE_H}
        fixedWidthPx={MOBILE_W}
        prefix=""
        defaultPos={{ x: 50, y: 60 }}
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
