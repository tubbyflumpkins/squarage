'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Debug tool to position the Posé homepage tile image — INDEPENDENTLY
// for desktop and mobile, since the two tiles have very different
// aspect ratios (desktop ≈ ½ window × 500px is wide; mobile is 100/70).
//
// Each frame: drag to pan, scroll / +/- to zoom. Panning is clamped to
// that frame's object-cover overflow so the cream background can never
// show. Copy each line and paste both back to apply.

const IMG = '/images/pose/pose-homepage.png'
const IMG_ASPECT = 2400 / 1792
const DESKTOP_H = 500
const MOBILE_W = 390
const MOBILE_H = 273 // aspect-[100/70]

type Vals = { tx: number; ty: number; s: number }

const clampScale = (s: number) => Math.min(5, Math.max(1, s))
const clampNum = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// Max pannable distance (% of frame) keeping an object-cover image fully
// covering a W×H frame at zoom s, transform-origin center.
function maxPan(W: number, H: number, s: number) {
  const fa = W / H
  const contentW = IMG_ASPECT > fa ? H * IMG_ASPECT : W
  const contentH = IMG_ASPECT > fa ? H : W / IMG_ASPECT
  return {
    x: Math.max(0, ((contentW * s) / W - 1) / 2 * 100),
    y: Math.max(0, ((contentH * s) / H - 1) / 2 * 100),
  }
}

function transformStr(v: Vals) {
  return `translate(${v.tx.toFixed(1)}%, ${v.ty.toFixed(1)}%) scale(${v.s.toFixed(3)})`
}

/** One independently-controlled preview frame. */
function Positioner({
  label,
  outline,
  widthCss,
  heightPx,
  fixedWidthPx,
}: {
  label: string
  outline: string
  widthCss: string
  heightPx: number
  fixedWidthPx?: number
}) {
  const [vals, setVals] = useState<Vals>({ tx: 0, ty: 0, s: 1.15 })
  const frameRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  const clampVals = useCallback((v: Vals): Vals => {
    const W = fixedWidthPx ?? frameRef.current?.getBoundingClientRect().width ?? 640
    const m = maxPan(W, heightPx, v.s)
    return { s: v.s, tx: clampNum(v.tx, -m.x, m.x), ty: clampNum(v.ty, -m.y, m.y) }
  }, [fixedWidthPx, heightPx])

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, tx: vals.tx, ty: vals.ty }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const dxPct = ((e.clientX - drag.current.x) / rect.width) * 100
    const dyPct = ((e.clientY - drag.current.y) / rect.height) * 100
    setVals(() => clampVals({ s: vals.s, tx: drag.current!.tx + dxPct, ty: drag.current!.ty + dyPct }))
  }
  const onPointerUp = () => {
    drag.current = null
  }

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

  const transform = transformStr(vals)
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
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '0.5rem', color: '#555', fontSize: '0.85rem' }}>{label}</div>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        <button onClick={() => setVals((v) => clampVals({ ...v, s: clampScale(v.s + 0.1) }))} style={btn}>＋</button>
        <button onClick={() => setVals((v) => clampVals({ ...v, s: clampScale(v.s - 0.1) }))} style={btn}>－</button>
        <button onClick={() => setVals({ tx: 0, ty: 0, s: 1.15 })} style={btn}>reset</button>
        <code style={{ background: '#1a1a1a', color: '#7CFC9B', padding: '0.4rem 0.6rem', borderRadius: 6 }}>{transform}</code>
        <button
          onClick={() => navigator.clipboard?.writeText(transform)}
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
        Frame the two tiles independently — drag to pan, scroll (or +/−) to zoom. Panning is locked so
        the image always fills each window; zoom in for more room to move. Copy <strong>both</strong>{' '}
        lines and paste them back (tell me which is which) and I&apos;ll wire up separate desktop and
        mobile framing. Note: the desktop tile is wide, so the whole 4:3 photo can&apos;t fit without
        cropping top/bottom — pick the best slice.
      </p>

      <Positioner label="Desktop (½ window × 500px)" outline="#ff962d" widthCss="50vw" heightPx={DESKTOP_H} />
      <Positioner
        label="Mobile (aspect 100/70)"
        outline="#4a9b6e"
        widthCss={`${MOBILE_W}px`}
        heightPx={MOBILE_H}
        fixedWidthPx={MOBILE_W}
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
