/**
 * Visual slot joint geometry for the 3D rendered shelf view.
 *
 * Post-processes shelf/column edge arrays to insert slot notch points
 * before passing to the extrusion build functions. Visual only —
 * hardcoded to 0.5" thickness with no tolerance or bit compensation.
 */

import type { Point3D } from '@/components/shelf/ShelfVisualizer/types';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { ShelfPiece, ColumnPiece } from '@/components/shelf/ShelfVisualizer/geometry';
import { getFrontSurfaceY } from '@/components/shelf/ShelfVisualizer/geometry';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import type { CornerShelfPiece, CornerColumnPiece } from '@/components/shelf/CornerShelfVisualizer/geometry';
import {
  getCornerFrontSurface,
  getCornerFrontSurfaceLoft,
  getBackPointForSlice,
} from '@/components/shelf/CornerShelfVisualizer/geometry';

const THICKNESS = 0.5;
const HALF_SLOT = THICKNESS / 2;

// ---------------------------------------------------------------------------
// Position helpers (replicate logic from geometry generators)
// ---------------------------------------------------------------------------

function getColumnXPositions(params: ShelfParams): number[] {
  const { width, columnCount, columnOffset = 0 } = params;
  const positions: number[] = [];
  const startX = columnOffset;
  const endX = width - columnOffset;
  for (let i = 0; i < columnCount; i++) {
    const t = columnCount > 1 ? i / (columnCount - 1) : 0.5;
    positions.push(startX + t * (endX - startX));
  }
  return positions;
}

function getShelfZPositions(p: { height: number; shelfCount: number; shelfOffset?: number }): number[] {
  const { height, shelfCount, shelfOffset = 0 } = p;
  const positions: number[] = [];
  const startZ = shelfOffset;
  const endZ = height - shelfOffset;
  for (let i = 0; i < shelfCount; i++) {
    const t = shelfCount > 1 ? i / (shelfCount - 1) : 0.5;
    positions.push(startZ + t * (endZ - startZ));
  }
  return positions;
}

function getCornerColumnKValues(params: CornerShelfParams, sinA: number, cosA: number): number[] {
  const { columnCount, columnOffset = 0, height } = params;
  const sampleZ = height / 2;
  const startPos = getCornerFrontSurface(0, sampleZ, params);
  const endPos = getCornerFrontSurface(1, sampleZ, params);
  const kStart = startPos.x * sinA - startPos.y * cosA;
  const kEnd = endPos.x * sinA - endPos.y * cosA;
  const kMin = Math.min(kStart, kEnd) + columnOffset;
  const kMax = Math.max(kStart, kEnd) - columnOffset;

  const values: number[] = [];
  for (let i = 0; i < columnCount; i++) {
    const t = columnCount > 1 ? i / (columnCount - 1) : 0.5;
    values.push(kMax + t * (kMin - kMax));
  }
  return values;
}

// ---------------------------------------------------------------------------
// Binary search helpers for corner shelf
// ---------------------------------------------------------------------------

function findFrontULoft(k: number, z: number, sinA: number, cosA: number, params: CornerShelfParams): number {
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const p = getCornerFrontSurfaceLoft(mid, z, params);
    if (p.x * sinA - p.y * cosA > k) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function findFrontU(k: number, z: number, sinA: number, cosA: number, params: CornerShelfParams): number {
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const p = getCornerFrontSurface(mid, z, params);
    if (p.x * sinA - p.y * cosA > k) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function dist2d(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ---------------------------------------------------------------------------
// Flat shelf: slots on front (wavy) edge at column positions
// ---------------------------------------------------------------------------

export function addFlatShelfSlots(piece: ShelfPiece, params: ShelfParams): ShelfPiece {
  const colPositions = getColumnXPositions(params);
  if (colPositions.length === 0) return piece;

  const { width, height, depth, amplitude, roundLeft = false, roundRight = false } = params;
  const z = piece.frontEdge[0].z;

  const newFront: Point3D[] = [];
  const newBack: Point3D[] = [];
  const sortedCols = [...colPositions].sort((a, b) => a - b);

  let srcIdx = 0;
  const n = piece.frontEdge.length;

  for (const colX of sortedCols) {
    const slotLeft = colX - HALF_SLOT;
    const slotRight = colX + HALF_SLOT;
    if (slotLeft < 0 || slotRight > width) continue;

    const intersectionDepth = getFrontSurfaceY(colX, z, width, height, depth, amplitude, roundLeft, roundRight);
    const slotInnerY = intersectionDepth / 2;

    // Copy points before slot
    while (srcIdx < n && piece.frontEdge[srcIdx].x < slotLeft - 1e-6) {
      newFront.push(piece.frontEdge[srcIdx]);
      newBack.push(piece.backEdge[srcIdx]);
      srcIdx++;
    }

    // Slot entry on front edge
    const frontYLeft = getFrontSurfaceY(slotLeft, z, width, height, depth, amplitude, roundLeft, roundRight);
    newFront.push({ x: slotLeft, y: frontYLeft, z });
    newBack.push({ x: slotLeft, y: 0, z });

    // Inner slot corners
    newFront.push({ x: slotLeft, y: slotInnerY, z });
    newBack.push({ x: slotLeft, y: 0, z });
    newFront.push({ x: slotRight, y: slotInnerY, z });
    newBack.push({ x: slotRight, y: 0, z });

    // Slot exit on front edge
    const frontYRight = getFrontSurfaceY(slotRight, z, width, height, depth, amplitude, roundLeft, roundRight);
    newFront.push({ x: slotRight, y: frontYRight, z });
    newBack.push({ x: slotRight, y: 0, z });

    // Skip original points within slot region
    while (srcIdx < n && piece.frontEdge[srcIdx].x <= slotRight + 1e-6) {
      srcIdx++;
    }
  }

  while (srcIdx < n) {
    newFront.push(piece.frontEdge[srcIdx]);
    newBack.push(piece.backEdge[srcIdx]);
    srcIdx++;
  }

  return { frontEdge: newFront, backEdge: newBack, leftSide: piece.leftSide, rightSide: piece.rightSide };
}

// ---------------------------------------------------------------------------
// Flat column: slots on back (straight) edge at shelf positions
// ---------------------------------------------------------------------------

export function addFlatColumnSlots(piece: ColumnPiece, params: ShelfParams): ColumnPiece {
  const shelfPositions = getShelfZPositions(params);
  if (shelfPositions.length === 0) return piece;

  const { width, height, depth, amplitude, roundLeft = false, roundRight = false } = params;
  const colX = piece.frontEdge[0].x;

  const newFront: Point3D[] = [];
  const newBack: Point3D[] = [];
  const sortedShelves = [...shelfPositions].sort((a, b) => a - b);

  let srcIdx = 0;
  const n = piece.frontEdge.length;

  for (const shelfZ of sortedShelves) {
    const slotBot = shelfZ - HALF_SLOT;
    const slotTop = shelfZ + HALF_SLOT;
    if (slotBot < 0 || slotTop > height) continue;

    const intersectionDepth = getFrontSurfaceY(colX, shelfZ, width, height, depth, amplitude, roundLeft, roundRight);
    const slotDepth = intersectionDepth / 2;

    // Copy points before slot
    while (srcIdx < n && piece.backEdge[srcIdx].z < slotBot - 1e-6) {
      newFront.push(piece.frontEdge[srcIdx]);
      newBack.push(piece.backEdge[srcIdx]);
      srcIdx++;
    }

    // Evaluate front surface at slot boundaries
    const frontYBot = getFrontSurfaceY(colX, slotBot, width, height, depth, amplitude, roundLeft, roundRight);
    const frontYTop = getFrontSurfaceY(colX, slotTop, width, height, depth, amplitude, roundLeft, roundRight);

    // Slot entry
    newFront.push({ x: colX, y: frontYBot, z: slotBot });
    newBack.push({ x: colX, y: 0, z: slotBot });

    // Inner slot corners (back edge steps inward)
    newFront.push({ x: colX, y: frontYBot, z: slotBot });
    newBack.push({ x: colX, y: slotDepth, z: slotBot });
    newFront.push({ x: colX, y: frontYTop, z: slotTop });
    newBack.push({ x: colX, y: slotDepth, z: slotTop });

    // Slot exit
    newFront.push({ x: colX, y: frontYTop, z: slotTop });
    newBack.push({ x: colX, y: 0, z: slotTop });

    // Skip original points within slot region
    while (srcIdx < n && piece.backEdge[srcIdx].z <= slotTop + 1e-6) {
      srcIdx++;
    }
  }

  while (srcIdx < n) {
    newFront.push(piece.frontEdge[srcIdx]);
    newBack.push(piece.backEdge[srcIdx]);
    srcIdx++;
  }

  return { frontEdge: newFront, backEdge: newBack, topSide: piece.topSide, bottomSide: piece.bottomSide };
}

// ---------------------------------------------------------------------------
// Corner shelf: parallelogram slots on front edge at column positions
// ---------------------------------------------------------------------------

export function addCornerShelfSlots(piece: CornerShelfPiece, params: CornerShelfParams): CornerShelfPiece {
  const { columnAngle = 45, width, length, columnCount } = params;
  if (columnCount === 0) return piece;

  const clampedAngle = Math.max(0.01, Math.min(89.99, columnAngle));
  const angleRad = (clampedAngle * Math.PI) / 180;
  const sinA = Math.sin(angleRad);
  const cosA = Math.cos(angleRad);

  const columnKValues = getCornerColumnKValues(params, sinA, cosA);
  if (columnKValues.length === 0) return piece;

  const z = piece.frontEdge[0].z;
  // Decreasing k = order encountered along front edge (u=0→1)
  const sortedCols = [...columnKValues].sort((a, b) => b - a);

  // Pre-compute k value for each front edge sample
  const sampleKs = piece.frontEdge.map(p => p.x * sinA - p.y * cosA);

  const newFront: Point3D[] = [];
  let sampleIdx = 0;
  const n = piece.frontEdge.length;

  for (const k of sortedCols) {
    // Find u-parameters for slot boundaries on loft surface
    const u1 = findFrontULoft(k + HALF_SLOT, z, sinA, cosA, params);
    const u2 = findFrontULoft(k - HALF_SLOT, z, sinA, cosA, params);

    // Front points at slot boundaries
    const fp1 = getCornerFrontSurfaceLoft(u1, z, params);
    const fp2 = getCornerFrontSurfaceLoft(u2, z, params);

    // Slot depth from intersection at column center
    const uCenter = findFrontULoft(k, z, sinA, cosA, params);
    const frontPt = getCornerFrontSurfaceLoft(uCenter, z, params);
    const backPt = getBackPointForSlice(k, angleRad, width, length);
    const slotDepth = dist2d(frontPt, backPt) / 2;

    // Inner center: front center moved inward by slotDepth
    const icx = frontPt.x - slotDepth * cosA;
    const icy = frontPt.y - slotDepth * sinA;
    // Inner corners offset by HALF_SLOT along column normal (sinA, -cosA)
    const ip1 = { x: icx + HALF_SLOT * sinA, y: icy - HALF_SLOT * cosA };
    const ip2 = { x: icx - HALF_SLOT * sinA, y: icy + HALF_SLOT * cosA };

    // Copy samples before slot entry (k decreases along front edge)
    while (sampleIdx < n && sampleKs[sampleIdx] > k + HALF_SLOT + 1e-6) {
      newFront.push(piece.frontEdge[sampleIdx]);
      sampleIdx++;
    }

    // Parallelogram slot notch
    newFront.push({ x: fp1.x, y: fp1.y, z });
    newFront.push({ x: ip1.x, y: ip1.y, z });
    newFront.push({ x: ip2.x, y: ip2.y, z });
    newFront.push({ x: fp2.x, y: fp2.y, z });

    // Skip past slot region
    while (sampleIdx < n && sampleKs[sampleIdx] >= k - HALF_SLOT - 1e-6) {
      sampleIdx++;
    }
  }

  while (sampleIdx < n) {
    newFront.push(piece.frontEdge[sampleIdx]);
    sampleIdx++;
  }

  return {
    frontEdge: newFront,
    backEdgeX: piece.backEdgeX,
    backEdgeY: piece.backEdgeY,
    widthSide: piece.widthSide,
    lengthSide: piece.lengthSide,
  };
}

// ---------------------------------------------------------------------------
// Corner column: slots on back (wall) edge at shelf positions
// ---------------------------------------------------------------------------

export function addCornerColumnSlots(piece: CornerColumnPiece, params: CornerShelfParams): CornerColumnPiece {
  const shelfPositions = getShelfZPositions(params);
  if (shelfPositions.length === 0) return piece;

  const { columnAngle = 45 } = params;
  const clampedAngle = Math.max(0.01, Math.min(89.99, columnAngle));
  const angleRad = (clampedAngle * Math.PI) / 180;
  const sinA = Math.sin(angleRad);
  const cosA = Math.cos(angleRad);

  // Determine this column's k value from its back edge position
  const backPt = piece.backEdge[0];
  const k = backPt.x * sinA - backPt.y * cosA;

  const newFront: Point3D[] = [];
  const newBack: Point3D[] = [];
  const sortedShelves = [...shelfPositions].sort((a, b) => a - b);

  let srcIdx = 0;
  const n = piece.frontEdge.length;

  for (const shelfZ of sortedShelves) {
    const slotBot = shelfZ - HALF_SLOT;
    const slotTop = shelfZ + HALF_SLOT;
    if (slotBot < 0 || slotTop > params.height) continue;

    // Compute depth and direction at shelf center
    const u = findFrontU(k, shelfZ, sinA, cosA, params);
    const fp = getCornerFrontSurface(u, shelfZ, params);
    const d = dist2d(fp, { x: backPt.x, y: backPt.y });
    const slotDepth = d / 2;

    const dirX = d > 1e-10 ? (fp.x - backPt.x) / d : cosA;
    const dirY = d > 1e-10 ? (fp.y - backPt.y) / d : sinA;

    const innerX = backPt.x + slotDepth * dirX;
    const innerY = backPt.y + slotDepth * dirY;

    // Evaluate front surface at slot boundaries
    const uBot = findFrontU(k, slotBot, sinA, cosA, params);
    const fpBot = getCornerFrontSurface(uBot, slotBot, params);
    const uTop = findFrontU(k, slotTop, sinA, cosA, params);
    const fpTop = getCornerFrontSurface(uTop, slotTop, params);

    // Copy points before slot
    while (srcIdx < n && piece.backEdge[srcIdx].z < slotBot - 1e-6) {
      newFront.push(piece.frontEdge[srcIdx]);
      newBack.push(piece.backEdge[srcIdx]);
      srcIdx++;
    }

    // Slot entry
    newFront.push({ x: fpBot.x, y: fpBot.y, z: slotBot });
    newBack.push({ x: backPt.x, y: backPt.y, z: slotBot });

    // Inner slot corners
    newFront.push({ x: fpBot.x, y: fpBot.y, z: slotBot });
    newBack.push({ x: innerX, y: innerY, z: slotBot });
    newFront.push({ x: fpTop.x, y: fpTop.y, z: slotTop });
    newBack.push({ x: innerX, y: innerY, z: slotTop });

    // Slot exit
    newFront.push({ x: fpTop.x, y: fpTop.y, z: slotTop });
    newBack.push({ x: backPt.x, y: backPt.y, z: slotTop });

    // Skip original points within slot region
    while (srcIdx < n && piece.backEdge[srcIdx].z <= slotTop + 1e-6) {
      srcIdx++;
    }
  }

  while (srcIdx < n) {
    newFront.push(piece.frontEdge[srcIdx]);
    newBack.push(piece.backEdge[srcIdx]);
    srcIdx++;
  }

  return { frontEdge: newFront, backEdge: newBack, topSide: piece.topSide, bottomSide: piece.bottomSide };
}
