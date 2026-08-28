#!/usr/bin/env node
// Proves the hover titles on /products can never be clipped.
//
// Each line is drawn into a fixed SVG viewBox and rotated by a <g> inside that
// box, so the browser's default `overflow: hidden` on <svg> clips anything
// that escapes. This script checks nothing ever needs to: for every line style
// it walks the arc, builds the worst-case glyph box at each point (largest
// font size, widest glyph, full ascender and descender), applies the tilt, and
// confirms every corner lands inside the viewBox.
//
// Run: node scripts/verifyOverlayBounds.mjs

import { readFileSync } from 'node:fs'

const CARD = readFileSync(new URL('../components/ui/ProductCard.tsx', import.meta.url), 'utf8')
const METRICS = readFileSync(new URL('../lib/marolaMetrics.ts', import.meta.url), 'utf8')

const num = (src, name) => {
  const m = src.match(new RegExp(`${name} = ([\\d.]+)`))
  if (!m) throw new Error(`could not read ${name}`)
  return parseFloat(m[1])
}

const VB_W = 100
const VB_H = num(CARD, 'OVERLAY_VIEWBOX_HEIGHT')
const ORIGIN_Y = num(CARD, 'OVERLAY_ORIGIN_Y')
const FONT_SIZE = num(CARD, 'OVERLAY_MAX_FONT_SIZE')
const TEXT_WIDTH = num(CARD, 'OVERLAY_TEXT_WIDTH')
const ASCENT = num(METRICS, 'MAROLA_ASCENT')
const DESCENT = num(METRICS, 'MAROLA_DESCENT')
const MAX_ADVANCE = num(METRICS, 'FALLBACK_ADVANCE')

const styles = [...CARD.matchAll(/\{ tilt: (-?[\d.]+), arc: '([^']+)' \}/g)]
  .map(([, tilt, arc]) => ({ tilt: parseFloat(tilt), arc }))

if (styles.length === 0) throw new Error('no line styles found in ProductCard.tsx')

const parseArc = (d) => {
  const n = d.replace(/[MQ]/g, ' ').trim().split(/\s+/).map(Number)
  if (n.length !== 6 || n.some(Number.isNaN)) throw new Error(`unsupported arc: ${d}`)
  return [[n[0], n[1]], [n[2], n[3]], [n[4], n[5]]]
}
const at = (p0, p1, p2, t) => {
  const u = 1 - t
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
          u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]
}
const tangent = (p0, p1, p2, t) => {
  const u = 1 - t
  return [2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
          2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])]
}

const SAMPLES = 4000
let worstMargin = Infinity
let failed = false

for (const { tilt, arc } of styles) {
  const [p0, p1, p2] = parseArc(arc)

  const pts = Array.from({ length: SAMPLES + 1 }, (_, i) => at(p0, p1, p2, i / SAMPLES))
  const arcLen = [0]
  for (let i = 0; i < SAMPLES; i++) {
    arcLen.push(arcLen[i] + Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]))
  }
  const total = arcLen[SAMPLES]

  // textPath startOffset="50%" with text-anchor middle: the run is centred on
  // the path by arc length. Worst case it is the full permitted width.
  const from = total / 2 - TEXT_WIDTH / 2
  const to = total / 2 + TEXT_WIDTH / 2

  const th = (tilt * Math.PI) / 180
  const ct = Math.cos(th)
  const st = Math.sin(th)
  const halfAdvance = (MAX_ADVANCE * FONT_SIZE) / 2

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i <= SAMPLES; i++) {
    if (arcLen[i] < from - 0.5 || arcLen[i] > to + 0.5) continue
    const [px, py] = pts[i]
    const [dx, dy] = tangent(p0, p1, p2, i / SAMPLES)
    const m = Math.hypot(dx, dy)
    const cp = dx / m
    const sp = dy / m
    for (const hw of [-halfAdvance, halfAdvance]) {
      for (const vy of [-ASCENT * FONT_SIZE, DESCENT * FONT_SIZE]) {
        const gx = px + hw * cp - vy * sp
        const gy = py + hw * sp + vy * cp
        const rx = 50 + (gx - 50) * ct - (gy - ORIGIN_Y) * st
        const ry = ORIGIN_Y + (gx - 50) * st + (gy - ORIGIN_Y) * ct
        if (rx < minX) minX = rx
        if (rx > maxX) maxX = rx
        if (ry < minY) minY = ry
        if (ry > maxY) maxY = ry
      }
    }
  }

  const margin = Math.min(minX, VB_W - maxX, minY, VB_H - maxY)
  const ok = margin >= 0
  if (!ok) failed = true
  console.log(
    `tilt ${tilt.toFixed(1).padStart(5)}°  ` +
    `x [${minX.toFixed(2).padStart(6)}, ${maxX.toFixed(2).padStart(6)}]  ` +
    `y [${minY.toFixed(2).padStart(6)}, ${maxY.toFixed(2).padStart(6)}]  ` +
    `margin ${margin.toFixed(2).padStart(5)}  ${ok ? 'ok' : 'OUT OF BOUNDS'}`
  )
  worstMargin = Math.min(worstMargin, margin)
}

console.log(`\nviewBox 100 x ${VB_H}, ${styles.length} line styles, worst-case margin ${worstMargin.toFixed(2)} units`)

if (failed) {
  console.error('\nA line style can overflow its viewBox. Reduce its tilt, flatten its arc, or lower OVERLAY_MAX_FONT_SIZE.')
  process.exit(1)
}
console.log('All line styles stay inside the viewBox.')
