'use client';

import { memo, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import { getFrontSurfaceY } from '@/components/shelf/ShelfVisualizer/geometry';
import { shelfLayout, NOMINAL_PLY } from '@/lib/warped/shelfLayout';

/**
 * The shelf's measurements, drawn in the scene: dashed lines for the overall size, and one
 * short line in each opening with its clear height. This site's own (labs has no overlay).
 *
 * World space is the meshes': inches, origin at the centre of the shelf's box, X = width,
 * Y = up, Z = depth toward the viewer (see buildExtrudedGeometry). Lines are drei `Line`s and
 * the numbers are DOM labels (`Html`), so they stay the site's own type at any zoom.
 */

export type DimensionUnit = 'in' | 'cm';

type Vec3 = [number, number, number];

interface Dim {
  key: string;
  from: Vec3;
  to: Vec3;
  /** Direction of the end ticks, already scaled to their half length. */
  tick: Vec3;
  label: string;
  /** An opening's height, as opposed to an overall size: drawn in the selection green. */
  row?: boolean;
}

/** Air between the shelf and its overall dimension lines. */
const MARGIN = 2.5;
const INK = '#333333';
const GREEN = '#4A9B4E';

const formatter = (unit: DimensionUnit) => (inches: number) =>
  unit === 'cm' ? `${Math.round(inches * 2.54)} cm` : `${+inches.toFixed(1)}"`;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

/** The flat shelf (standard and console). `side` is the end facing the viewer: 1 = right. */
function flatDims(p: ShelfParams, side: 1 | -1, fmt: (v: number) => string): Dim[] {
  const { width: w, height: h, depth: d, amplitude: a } = p;
  const floor = -h / 2;
  // Clear of the wave's furthest reach, so the width line never runs through a shelf
  const front = d / 2 + a + MARGIN;
  const end = side * (w / 2 + MARGIN);

  const dims: Dim[] = [
    { key: 'width', from: [-w / 2, floor, front], to: [w / 2, floor, front], tick: [0, 0, 0.8], label: fmt(w) },
    { key: 'height', from: [end, -h / 2, d / 2], to: [end, h / 2, d / 2], tick: [0.8, 0, 0], label: fmt(h) },
    { key: 'depth', from: [end, floor, -d / 2], to: [end, floor, d / 2], tick: [0.8, 0, 0], label: fmt(d) },
  ];

  // One line per opening, on the front edge just inside the end the viewer sees
  const { shelfZ } = shelfLayout(p);
  const inset = Math.max(1, (p.columnOffset ?? 0) / 2);
  const x = side > 0 ? w - inset : inset;
  for (let i = 0; i < shelfZ.length - 1; i++) {
    const bottom = shelfZ[i] + NOMINAL_PLY / 2;
    const top = shelfZ[i + 1] - NOMINAL_PLY / 2;
    if (top - bottom <= 0) continue;
    const y = getFrontSurfaceY(x, (bottom + top) / 2, w, h, d, a, p.roundLeft, p.roundRight);
    const z = y - d / 2 + 0.15;
    dims.push({
      key: `row-${i}`,
      from: [x - w / 2, bottom - h / 2, z],
      to: [x - w / 2, top - h / 2, z],
      tick: [0.5, 0, 0],
      label: fmt(top - bottom),
      row: true,
    });
  }
  return dims;
}

/**
 * The corner shelf: its walls are at X = -width/2 and Z = -length/2, and it opens toward
 * +X / +Z, which is where the camera always sits. Overall lines run along the open sides.
 */
function cornerDims(p: CornerShelfParams, fmt: (v: number) => string): Dim[] {
  const { width: w, length: l, depth: d, height: h, shelfCount, shelfOffset = 0 } = p;
  const floor = -h / 2;
  const wingFront = -l / 2 + d;

  const dims: Dim[] = [
    { key: 'width', from: [-w / 2, floor, l / 2 + MARGIN], to: [w / 2, floor, l / 2 + MARGIN], tick: [0, 0, 0.8], label: fmt(w) },
    { key: 'length', from: [w / 2 + MARGIN, floor, -l / 2], to: [w / 2 + MARGIN, floor, l / 2], tick: [0.8, 0, 0], label: fmt(l) },
    { key: 'height', from: [w / 2 + MARGIN, -h / 2, wingFront], to: [w / 2 + MARGIN, h / 2, wingFront], tick: [0.8, 0, 0], label: fmt(h) },
  ];

  // The corner shelf spaces its shelves evenly (CornerShelfVisualizer/geometry)
  const inset = Math.max(1, (p.columnOffset ?? 0) / 2);
  for (let i = 0; i < shelfCount - 1; i++) {
    const zAt = (n: number) => shelfOffset + (shelfCount > 1 ? n / (shelfCount - 1) : 0.5) * (h - 2 * shelfOffset);
    const bottom = zAt(i) + NOMINAL_PLY / 2;
    const top = zAt(i + 1) - NOMINAL_PLY / 2;
    if (top - bottom <= 0) continue;
    dims.push({
      key: `row-${i}`,
      from: [w / 2 - inset, bottom - h / 2, wingFront + 0.15],
      to: [w / 2 - inset, top - h / 2, wingFront + 0.15],
      tick: [0.5, 0, 0],
      label: fmt(top - bottom),
      row: true,
    });
  }
  return dims;
}

interface DimensionOverlayProps {
  isCorner: boolean;
  flatParams: ShelfParams;
  cornerParams: CornerShelfParams;
  unit: DimensionUnit;
}

function DimensionOverlay({ isCorner, flatParams, cornerParams, unit }: DimensionOverlayProps) {
  // Which end of a flat shelf faces the viewer. The sweep crosses centre, so the labels change
  // ends with it; the dead band keeps them from flickering while the view is nearly head-on.
  const [side, setSide] = useState<1 | -1>(1);
  useFrame(({ camera }) => {
    const reach = Math.hypot(camera.position.x, camera.position.z) || 1;
    const s = camera.position.x / reach;
    if (side === 1 && s < -0.12) setSide(-1);
    else if (side === -1 && s > 0.12) setSide(1);
  });

  // Every point array is built once per design here. drei's Line makes a new GPU geometry
  // whenever its `points` prop is a new array, so arrays made during render would rebuild
  // all the lines on any re-render.
  const dims = useMemo(() => {
    const fmt = formatter(unit);
    const list = isCorner ? cornerDims(cornerParams, fmt) : flatDims(flatParams, side, fmt);
    return list.map((dim) => ({
      ...dim,
      line: [dim.from, dim.to] as Vec3[],
      tickFrom: [sub(dim.from, dim.tick), add(dim.from, dim.tick)] as Vec3[],
      tickTo: [sub(dim.to, dim.tick), add(dim.to, dim.tick)] as Vec3[],
      labelAt: mid(dim.from, dim.to),
    }));
  }, [isCorner, flatParams, cornerParams, side, unit]);

  return (
    <group>
      {dims.map((dim) => {
        const color = dim.row ? GREEN : INK;
        return (
          <group key={dim.key}>
            <Line points={dim.line} color={color} lineWidth={1} dashed dashSize={0.7} gapSize={0.5} depthTest={false} transparent opacity={dim.row ? 0.9 : 0.6} renderOrder={10} />
            <Line points={dim.tickFrom} color={color} lineWidth={1} depthTest={false} transparent opacity={dim.row ? 0.9 : 0.6} renderOrder={10} />
            <Line points={dim.tickTo} color={color} lineWidth={1} depthTest={false} transparent opacity={dim.row ? 0.9 : 0.6} renderOrder={10} />
            <Html position={dim.labelAt} center zIndexRange={[5, 0]} pointerEvents="none">
              <span
                className={`block select-none whitespace-nowrap border bg-cream px-1.5 py-[3px] font-neue-haas text-[12px] font-medium leading-none tabular-nums md:text-[13px] ${
                  dim.row ? 'border-squarage-green text-squarage-green' : 'border-squarage-black text-squarage-black'
                }`}
              >
                {dim.label}
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// The view re-renders every frame as it turns; the measurements only change with the design
export default memo(DimensionOverlay);
