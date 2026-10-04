'use client';

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import { getFrontSurfaceY } from '@/components/shelf/ShelfVisualizer/geometry';
import { shelfLayout, NOMINAL_PLY } from '@/lib/warped/shelfLayout';

/**
 * The shelf's measurements, drawn in the scene: a dashed line for each overall size with its
 * number beside it, and a short line in each opening with its clear height. This site's own
 * (labs has no overlay).
 *
 * Each overall line has a small square at its fixed end and a round dot at the other. With
 * `onResize` the dot is a handle: drag it and that size follows. Without it (a shared design,
 * which nobody edits) both ends are squares.
 *
 * World space is the meshes': inches, origin at the centre of the shelf's box, X = width,
 * Y = up, Z = depth toward the viewer (see buildExtrudedGeometry). Lines are drei `Line`s; the
 * numbers and the handles are DOM (`Html`), so they stay crisp and take pointer events.
 */

export type DimensionUnit = 'in' | 'cm';
/** A size a handle can change. */
export type ResizableDimension = 'width' | 'height' | 'depth' | 'length';

type Vec3 = [number, number, number];

interface Axis {
  dimension: ResizableDimension;
  /** The two ends of the measured span, fixed end first. */
  from: Vec3;
  to: Vec3;
  value: number;
}

interface Dim {
  key: string;
  from: Vec3;
  to: Vec3;
  label: string;
  /** Where the number sits, off the line so it never covers it. */
  labelAt: Vec3;
  /** An opening's height, as opposed to an overall size. */
  row?: boolean;
}

interface Handle {
  key: string;
  at: Vec3;
  /** What dragging it changes. Two axes on a corner shelf, where width and length share a dot. */
  axes: Axis[];
  label: string;
}

/** Air between the shelf and the overall lines that stand beside it. */
const MARGIN = 2.5;
const INK = '#333333';
const GREEN = '#4A9B4E';

const formatter = (unit: DimensionUnit) => (inches: number) =>
  unit === 'cm' ? `${Math.round(inches * 2.54)} cm` : `${+inches.toFixed(1)}"`;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

interface Layout {
  dims: Dim[];
  /** Fixed ends: a small square each. */
  anchors: { key: string; at: Vec3 }[];
  handles: Handle[];
}

/** The flat shelf (standard and console). `side` is the end facing the viewer: 1 = right. */
function flatLayout(p: ShelfParams, side: 1 | -1, fmt: (v: number) => string): Layout {
  const { width: w, height: h, depth: d, amplitude: a } = p;
  const floor = -h / 2;
  // Clear of the wave's furthest reach, so the width line never runs through a shelf
  const front = d / 2 + a + MARGIN;
  const near = side * (w / 2 + MARGIN);
  const far = -near;

  // Width along the floor in front; height up the far end; depth along the top of the near
  // end, where nothing stands in front of it
  const width: Axis = { dimension: 'width', from: [-side * (w / 2), floor, front], to: [side * (w / 2), floor, front], value: w };
  const height: Axis = { dimension: 'height', from: [far, -h / 2, d / 2], to: [far, h / 2, d / 2], value: h };
  const depth: Axis = { dimension: 'depth', from: [near, h / 2, -d / 2], to: [near, h / 2, d / 2], value: d };

  const dims: Dim[] = [
    { key: 'width', from: width.from, to: width.to, label: fmt(w), labelAt: add(mid(width.from, width.to), [0, -1.4, 2.4]) },
    { key: 'height', from: height.from, to: height.to, label: fmt(h), labelAt: add(mid(height.from, height.to), [-side * 3.6, 0, 0]) },
    { key: 'depth', from: depth.from, to: depth.to, label: fmt(d), labelAt: add(mid(depth.from, depth.to), [side * 2, 2.6, 0]) },
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
    const from: Vec3 = [x - w / 2, bottom - h / 2, z];
    const to: Vec3 = [x - w / 2, top - h / 2, z];
    dims.push({ key: `row-${i}`, from, to, label: fmt(top - bottom), labelAt: add(mid(from, to), [-side * 2.2, 0, 0.4]), row: true });
  }

  return {
    dims,
    anchors: [{ key: 'width', at: width.from }, { key: 'height', at: height.from }, { key: 'depth', at: depth.from }],
    handles: [
      { key: 'width', at: width.to, axes: [width], label: 'width' },
      { key: 'height', at: height.to, axes: [height], label: 'height' },
      { key: 'depth', at: depth.to, axes: [depth], label: 'depth' },
    ],
  };
}

/**
 * The corner shelf: its walls are at X = -width/2 and Z = -length/2, and it opens toward
 * +X / +Z, which is where the camera always sits. Width and length run along the open edges
 * of its footprint and meet at one dot, which sizes both.
 */
function cornerLayout(p: CornerShelfParams, fmt: (v: number) => string): Layout {
  const { width: w, length: l, depth: d, height: h, shelfCount, shelfOffset = 0 } = p;
  const floor = -h / 2;
  const wingFront = -l / 2 + d;
  const corner: Vec3 = [w / 2, floor, l / 2];

  const width: Axis = { dimension: 'width', from: [-w / 2, floor, l / 2], to: corner, value: w };
  const length: Axis = { dimension: 'length', from: [w / 2, floor, -l / 2], to: corner, value: l };
  const height: Axis = { dimension: 'height', from: [w / 2 + MARGIN, -h / 2, wingFront], to: [w / 2 + MARGIN, h / 2, wingFront], value: h };

  const dims: Dim[] = [
    { key: 'width', from: width.from, to: width.to, label: fmt(w), labelAt: add(mid(width.from, width.to), [0, -1.4, 2.6]) },
    { key: 'length', from: length.from, to: length.to, label: fmt(l), labelAt: add(mid(length.from, length.to), [3.4, -1, 0]) },
    { key: 'height', from: height.from, to: height.to, label: fmt(h), labelAt: add(mid(height.from, height.to), [3.6, 0, 0]) },
  ];

  // The corner shelf spaces its shelves evenly (CornerShelfVisualizer/geometry)
  const inset = Math.max(1, (p.columnOffset ?? 0) / 2);
  const zAt = (n: number) => shelfOffset + (shelfCount > 1 ? n / (shelfCount - 1) : 0.5) * (h - 2 * shelfOffset);
  for (let i = 0; i < shelfCount - 1; i++) {
    const bottom = zAt(i) + NOMINAL_PLY / 2;
    const top = zAt(i + 1) - NOMINAL_PLY / 2;
    if (top - bottom <= 0) continue;
    const from: Vec3 = [w / 2 - inset, bottom - h / 2, wingFront + 0.15];
    const to: Vec3 = [w / 2 - inset, top - h / 2, wingFront + 0.15];
    dims.push({ key: `row-${i}`, from, to, label: fmt(top - bottom), labelAt: add(mid(from, to), [-2.2, 0, 0.4]), row: true });
  }

  return {
    dims,
    anchors: [{ key: 'width', at: width.from }, { key: 'length', at: length.from }, { key: 'height', at: height.from }],
    handles: [
      { key: 'corner', at: corner, axes: [width, length], label: 'width and length' },
      { key: 'height', at: height.to, axes: [height], label: 'height' },
    ],
  };
}

interface DimensionOverlayProps {
  isCorner: boolean;
  flatParams: ShelfParams;
  cornerParams: CornerShelfParams;
  unit: DimensionUnit;
  /** Makes the dots draggable: called with the new size, in whole inches, as a dot moves. */
  onResize?: (dimension: ResizableDimension, inches: number) => void;
  /** A drag began or ended, so the page can hold the view still meanwhile. */
  onResizeActive?: (active: boolean) => void;
}

function DimensionOverlay({ isCorner, flatParams, cornerParams, unit, onResize, onResizeActive }: DimensionOverlayProps) {
  const { camera, size } = useThree();

  // Which end of a flat shelf faces the viewer. The sweep crosses centre, so the measurements
  // change ends with it; the dead band keeps them from flickering while the view is nearly head-on.
  const [side, setSide] = useState<1 | -1>(1);
  useFrame(() => {
    const reach = Math.hypot(camera.position.x, camera.position.z) || 1;
    const s = camera.position.x / reach;
    if (side === 1 && s < -0.12) setSide(-1);
    else if (side === -1 && s > 0.12) setSide(1);
  });

  // Every point array is built once per design here. drei's Line makes a new GPU geometry
  // whenever its `points` prop is a new array, so arrays made during render would rebuild
  // all the lines on any re-render.
  const layout = useMemo(() => {
    const fmt = formatter(unit);
    const built = isCorner ? cornerLayout(cornerParams, fmt) : flatLayout(flatParams, side, fmt);
    return { ...built, dims: built.dims.map((dim) => ({ ...dim, line: [dim.from, dim.to] as Vec3[] })) };
  }, [isCorner, flatParams, cornerParams, side, unit]);

  // --- Dragging a dot. The pointer's travel is read along each axis as it lay on screen when
  // the drag began: the shelf is centred, so a size grows by twice what its end moves.
  const drag = useRef<{ x: number; y: number; axes: { dimension: ResizableDimension; start: number; perInch: [number, number] }[] } | null>(null);

  const toScreen = useCallback((p: Vec3): [number, number] => {
    const v = new THREE.Vector3(p[0], p[1], p[2]).project(camera);
    return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
  }, [camera, size]);

  const beginDrag = (e: React.PointerEvent<HTMLElement>, handle: Handle) => {
    if (!onResize) return;
    // Keep the press from reaching the view's own drag-to-rotate
    e.preventDefault();
    e.stopPropagation();
    // Capture keeps the moves coming when the pointer outruns the dot. A pointer that is
    // already gone cannot be captured, and the drag works without it.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* no capture */ }
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      axes: handle.axes.map(({ dimension, from, to, value }) => {
        const a = toScreen(from);
        const b = toScreen(to);
        const span = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]) || 1;
        return { dimension, start: value, perInch: [(b[0] - a[0]) / span, (b[1] - a[1]) / span] };
      }),
    };
    onResizeActive?.(true);
  };

  const moveDrag = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || !onResize) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    for (const axis of d.axes) {
      const scale = axis.perInch[0] ** 2 + axis.perInch[1] ** 2;
      if (scale < 1e-6) continue; // seen end-on: the pointer cannot say anything about it
      const inches = (2 * (dx * axis.perInch[0] + dy * axis.perInch[1])) / scale;
      onResize(axis.dimension, Math.round(axis.start + inches));
    }
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    onResizeActive?.(false);
  };

  // Arrow keys do what a drag does, an inch at a time
  const nudge = (e: React.KeyboardEvent<HTMLElement>, handle: Handle) => {
    if (!onResize) return;
    const step = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    for (const axis of handle.axes) onResize(axis.dimension, Math.round(axis.value) + step);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const square = <span className="block h-2 w-2 bg-squarage-black/45" />;

  return (
    <group>
      {layout.dims.map((dim) => (
        <group key={dim.key}>
          <Line
            points={dim.line}
            color={dim.row ? GREEN : INK}
            lineWidth={1}
            dashed
            dashSize={dim.row ? 0.45 : 0.9}
            gapSize={dim.row ? 0.35 : 0.7}
            depthTest={false}
            transparent
            opacity={dim.row ? 0.85 : 0.5}
            renderOrder={10}
          />
          <Html position={dim.labelAt} center zIndexRange={[5, 0]} pointerEvents="none">
            <span
              className={`block select-none whitespace-nowrap font-neue-haas tabular-nums leading-none ${
                dim.row ? 'text-[12px] font-medium text-squarage-green md:text-[13px]' : 'text-lg text-squarage-black/60 md:text-2xl'
              }`}
            >
              {dim.label}
            </span>
          </Html>
        </group>
      ))}

      {layout.anchors.map((anchor) => (
        <Html key={`anchor-${anchor.key}`} position={anchor.at} center zIndexRange={[5, 0]} pointerEvents="none">
          {square}
        </Html>
      ))}

      {layout.handles.map((handle) =>
        onResize ? (
          <Html key={`handle-${handle.key}`} position={handle.at} center zIndexRange={[6, 0]}>
            <span
              role="slider"
              tabIndex={0}
              aria-label={`Drag to change the ${handle.label}`}
              aria-valuenow={Math.round(handle.axes[0].value)}
              onPointerDown={(e) => beginDrag(e, handle)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={endDrag}
              onKeyDown={(e) => nudge(e, handle)}
              // The view turns on mouse and touch events of its own: none of this handle's may reach it
              onMouseDown={stop}
              onTouchStart={stop}
              className="block h-6 w-6 cursor-grab touch-none rounded-full bg-squarage-black/65 outline-none transition-transform duration-150 hover:scale-125 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-squarage-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:scale-110 active:cursor-grabbing md:h-7 md:w-7"
            />
          </Html>
        ) : (
          <Html key={`handle-${handle.key}`} position={handle.at} center zIndexRange={[5, 0]} pointerEvents="none">
            {square}
          </Html>
        ),
      )}
    </group>
  );
}

// The view re-renders every frame as it turns; the measurements only change with the design
export default memo(DimensionOverlay);
