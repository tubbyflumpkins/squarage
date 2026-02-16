import * as THREE from 'three';
import type { Point3D } from '@/components/shelf/ShelfVisualizer/types';

/**
 * Builds extruded 3D BufferGeometry from the 2D shelf/column pieces.
 *
 * Coordinate mapping (shelf → Three.js Y-up):
 *   Three.js X = shelf x (width)
 *   Three.js Y = shelf z (height, now up)
 *   Three.js Z = shelf y (depth, toward camera)
 *
 * UVs are computed from the vertex's actual world position so the texture
 * tiles uniformly ("always on") with no pinching or stretching.
 */

type V3 = [number, number, number];

// UV projection: takes a Three.js-space vertex, returns [u, v].
// Scale factor: 1 texture repeat per 12 inches.
type UVFn = (v: V3) => [number, number];

// ---------------------------------------------------------------------------
// Triangle-strip / quad builders with position-based UVs
// ---------------------------------------------------------------------------

function addStrip(
  pos: number[],
  uvs: number[],
  edge1: V3[],
  edge2: V3[],
  uv: UVFn,
) {
  const n = edge1.length;
  for (let i = 0; i < n - 1; i++) {
    pos.push(...edge1[i], ...edge2[i], ...edge1[i + 1]);
    uvs.push(...uv(edge1[i]), ...uv(edge2[i]), ...uv(edge1[i + 1]));

    pos.push(...edge1[i + 1], ...edge2[i], ...edge2[i + 1]);
    uvs.push(...uv(edge1[i + 1]), ...uv(edge2[i]), ...uv(edge2[i + 1]));
  }
}

function addQuad(
  pos: number[],
  uvs: number[],
  a: V3, b: V3, c: V3, d: V3,
  uv: UVFn,
) {
  pos.push(...a, ...b, ...c);
  uvs.push(...uv(a), ...uv(b), ...uv(c));
  pos.push(...c, ...b, ...d);
  uvs.push(...uv(c), ...uv(b), ...uv(d));
}

function makeGeo(pos: number[], uvs: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// UV helpers — project vertex position onto 2 axes, scale by 1/12 (inches)
// ---------------------------------------------------------------------------
const S = 1 / 22; // 1 repeat per 22" — larger grain scale

// Shelf top/bottom: grain along width (X), across depth (Z)
const uvShelfFlat: UVFn = (v) => [v[0] * S, v[2] * S];
// Shelf front/back walls: grain along width (X), across height (Y)
const uvShelfWall: UVFn = (v) => [v[0] * S, v[1] * S];
// Shelf side caps: grain across depth (Z), across height (Y)
const uvShelfSide: UVFn = (v) => [v[2] * S, v[1] * S];

// Column left/right faces: grain along height (Y), across depth (Z)
const uvColFlat: UVFn = (v) => [v[1] * S, v[2] * S];
// Column front/back walls: grain along height (Y), across width (X)
const uvColWall: UVFn = (v) => [v[1] * S, v[0] * S];
// Column top/bottom caps: grain along width (X), across depth (Z)
const uvColCap: UVFn = (v) => [v[0] * S, v[2] * S];

// ---------------------------------------------------------------------------
// Flat shelf piece
// ---------------------------------------------------------------------------

interface FlatShelfPiece {
  frontEdge: Point3D[];
  backEdge: Point3D[];
  leftSide: [Point3D, Point3D];
  rightSide: [Point3D, Point3D];
}

export function buildFlatShelfGeo(
  piece: FlatShelfPiece,
  thickness: number,
  width: number,
  height: number,
  depth: number,
): THREE.BufferGeometry {
  const cx = width / 2, cy = depth / 2, cz = height / 2;
  const ht = thickness / 2;
  const n = piece.frontEdge.length;

  const topF: V3[] = [], topB: V3[] = [];
  const botF: V3[] = [], botB: V3[] = [];

  for (let i = 0; i < n; i++) {
    const f = piece.frontEdge[i], b = piece.backEdge[i];
    topF.push([f.x - cx, f.z + ht - cz, f.y - cy]);
    topB.push([b.x - cx, b.z + ht - cz, b.y - cy]);
    botF.push([f.x - cx, f.z - ht - cz, f.y - cy]);
    botB.push([b.x - cx, b.z - ht - cz, b.y - cy]);
  }

  const pos: number[] = [], uvs: number[] = [];

  addStrip(pos, uvs, topB, topF, uvShelfFlat);
  addStrip(pos, uvs, botF, botB, uvShelfFlat);
  addStrip(pos, uvs, topF, botF, uvShelfWall);
  addStrip(pos, uvs, botB, topB, uvShelfWall);
  addQuad(pos, uvs, topB[0], topF[0], botB[0], botF[0], uvShelfSide);
  addQuad(pos, uvs, topF[n - 1], topB[n - 1], botF[n - 1], botB[n - 1], uvShelfSide);

  return makeGeo(pos, uvs);
}

// ---------------------------------------------------------------------------
// Flat column piece
// ---------------------------------------------------------------------------

interface FlatColumnPiece {
  frontEdge: Point3D[];
  backEdge: Point3D[];
  topSide: [Point3D, Point3D];
  bottomSide: [Point3D, Point3D];
}

export function buildFlatColumnGeo(
  piece: FlatColumnPiece,
  thickness: number,
  width: number,
  height: number,
  depth: number,
): THREE.BufferGeometry {
  const cx = width / 2, cy = depth / 2, cz = height / 2;
  const ht = thickness / 2;
  const n = piece.frontEdge.length;

  const rF: V3[] = [], rB: V3[] = [];
  const lF: V3[] = [], lB: V3[] = [];

  for (let i = 0; i < n; i++) {
    const f = piece.frontEdge[i], b = piece.backEdge[i];
    rF.push([f.x + ht - cx, f.z - cz, f.y - cy]);
    rB.push([b.x + ht - cx, b.z - cz, b.y - cy]);
    lF.push([f.x - ht - cx, f.z - cz, f.y - cy]);
    lB.push([b.x - ht - cx, b.z - cz, b.y - cy]);
  }

  const pos: number[] = [], uvs: number[] = [];

  addStrip(pos, uvs, rB, rF, uvColFlat);
  addStrip(pos, uvs, lF, lB, uvColFlat);
  addStrip(pos, uvs, rF, lF, uvColWall);
  addStrip(pos, uvs, lB, rB, uvColWall);
  addQuad(pos, uvs, rF[n - 1], rB[n - 1], lF[n - 1], lB[n - 1], uvColCap);
  addQuad(pos, uvs, lF[0], lB[0], rF[0], rB[0], uvColCap);

  return makeGeo(pos, uvs);
}

// ---------------------------------------------------------------------------
// Corner shelf piece (L-shaped slab)
// ---------------------------------------------------------------------------

interface CornerShelfPieceInput {
  frontEdge: Point3D[];
  backEdgeX: Point3D[];
  backEdgeY: Point3D[];
  widthSide: [Point3D, Point3D];
  lengthSide: [Point3D, Point3D];
}

export function buildCornerShelfGeo(
  piece: CornerShelfPieceInput,
  thickness: number,
  width: number,
  length: number,
  height: number,
): THREE.BufferGeometry {
  const cx = width / 2, cy = length / 2, cz = height / 2;
  const ht = thickness / 2;
  const n = piece.frontEdge.length;
  const z = piece.frontEdge[0].z;

  // Back edge traces the full L-wall: (width,0) → (0,0) → (0,length)
  const totalBack = width + length;
  const backPts: Point3D[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * totalBack;
    if (t <= width) {
      backPts.push({ x: width - t, y: 0, z });
    } else {
      backPts.push({ x: 0, y: t - width, z });
    }
  }

  const topF: V3[] = [], topBk: V3[] = [];
  const botF: V3[] = [], botBk: V3[] = [];

  for (let i = 0; i < n; i++) {
    const f = piece.frontEdge[i], b = backPts[i];
    topF.push([f.x - cx, f.z + ht - cz, f.y - cy]);
    topBk.push([b.x - cx, b.z + ht - cz, b.y - cy]);
    botF.push([f.x - cx, f.z - ht - cz, f.y - cy]);
    botBk.push([b.x - cx, b.z - ht - cz, b.y - cy]);
  }

  // Corner shelf UVs: use XZ plane for top/bottom (covers the L shape),
  // XY for the front/back walls
  const uvFlat: UVFn = (v) => [v[0] * S, v[2] * S];
  const uvWall: UVFn = (v) => [(v[0] + v[2]) * S, v[1] * S]; // combined X+Z for L-shape walls
  const uvSide: UVFn = (v) => [v[2] * S, v[1] * S];

  const pos: number[] = [], uvs: number[] = [];

  addStrip(pos, uvs, topBk, topF, uvFlat);
  addStrip(pos, uvs, botF, botBk, uvFlat);
  addStrip(pos, uvs, topF, botF, uvWall);
  addStrip(pos, uvs, botBk, topBk, uvWall);
  addQuad(pos, uvs, topBk[0], topF[0], botBk[0], botF[0], uvSide);
  addQuad(pos, uvs, topF[n - 1], topBk[n - 1], botF[n - 1], botBk[n - 1], uvSide);

  return makeGeo(pos, uvs);
}

// ---------------------------------------------------------------------------
// Corner column piece (perpendicular to slice angle)
// ---------------------------------------------------------------------------

interface CornerColumnPieceInput {
  frontEdge: Point3D[];
  backEdge: Point3D[];
  topSide: [Point3D, Point3D];
  bottomSide: [Point3D, Point3D];
}

export function buildCornerColumnGeo(
  piece: CornerColumnPieceInput,
  thickness: number,
  width: number,
  length: number,
  height: number,
  angleRad: number,
): THREE.BufferGeometry {
  const cx = width / 2, cy = length / 2, cz = height / 2;
  const ht = thickness / 2;
  const n = piece.frontEdge.length;

  // Perpendicular to slice: gradient of (x·sinA - y·cosA)
  const perpX = Math.sin(angleRad);
  const perpY = -Math.cos(angleRad);
  const dx = ht * perpX;
  const dy = ht * perpY;

  const rF: V3[] = [], rB: V3[] = [];
  const lF: V3[] = [], lB: V3[] = [];

  for (let i = 0; i < n; i++) {
    const f = piece.frontEdge[i], b = piece.backEdge[i];
    rF.push([f.x + dx - cx, f.z - cz, f.y + dy - cy]);
    rB.push([b.x + dx - cx, b.z - cz, b.y + dy - cy]);
    lF.push([f.x - dx - cx, f.z - cz, f.y - dy - cy]);
    lB.push([b.x - dx - cx, b.z - cz, b.y - dy - cy]);
  }

  const pos: number[] = [], uvs: number[] = [];

  addStrip(pos, uvs, rB, rF, uvColFlat);
  addStrip(pos, uvs, lF, lB, uvColFlat);
  addStrip(pos, uvs, rF, lF, uvColWall);
  addStrip(pos, uvs, lB, rB, uvColWall);
  addQuad(pos, uvs, rF[n - 1], rB[n - 1], lF[n - 1], lB[n - 1], uvColCap);
  addQuad(pos, uvs, lF[0], lB[0], rF[0], rB[0], uvColCap);

  return makeGeo(pos, uvs);
}

// ---------------------------------------------------------------------------
// UV offset — deterministic per-piece shift to break visible tiling.
// Uses golden ratio spacing so adjacent pieces look distinct.
// ---------------------------------------------------------------------------

const PHI = 0.6180339887;

export function offsetUVs(geo: THREE.BufferGeometry, index: number): void {
  const uv = geo.getAttribute('uv');
  if (!uv) return;
  const offU = (index * PHI) % 1;
  const offV = (index * PHI * 1.7) % 1;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) + offU, uv.getY(i) + offV);
  }
  uv.needsUpdate = true;
}
