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

export type V3 = [number, number, number];

// UV projection: takes a Three.js-space vertex, returns [u, v].
export type UVFn = (v: V3) => [number, number];

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

/** Returns the number of vertices added by addStrip for n-point edges */
function stripVertexCount(n: number): number {
  return (n - 1) * 6; // 2 triangles × 3 vertices per segment
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
// UV helpers — project vertex position onto 2 axes, scale by 1/22 (inches)
// ---------------------------------------------------------------------------
export const S = 1 / 22; // 1 repeat per 22" — larger grain scale
export const SE = S / 3; // edge along-length: 3x zoomed in vs wood grain
export const ST = 1 / 3; // edge across-thickness: 3x zoomed in

// ---------------------------------------------------------------------------
// Wood grain UVs (group 0) — for flat faces (top/bottom of shelves, sides of columns)
// ---------------------------------------------------------------------------

// Shelf top/bottom: grain along width (X), across depth (Z)
const uvShelfFlat: UVFn = (v) => [v[0] * S, v[2] * S];
// Column left/right faces: grain along height (Y), across depth (Z)
const uvColFlat: UVFn = (v) => [v[1] * S, v[2] * S];

// ---------------------------------------------------------------------------
// Plywood edge UVs (group 1) — for cut edges (front/back walls, side caps)
// ---------------------------------------------------------------------------

// Shelf front/back walls: plywood lines along width (X), layers across height (Y)
const uvShelfWallEdge: UVFn = (v) => [v[0] * SE, v[1] * ST];
// Shelf side caps: plywood lines across depth (Z), layers across height (Y)
const uvShelfSideEdge: UVFn = (v) => [v[2] * SE, v[1] * ST];

// Column front/back walls: plywood lines along height (Y), layers across width (X)
const uvColWallEdge: UVFn = (v) => [v[1] * SE, v[0] * ST];
// Column top/bottom caps: plywood lines along depth (Z), layers across width (X)
const uvColCapEdge: UVFn = (v) => [v[2] * SE, v[0] * ST];

// Corner shelf walls: combined X+Z for L-shape continuity
const uvCornerWallEdge: UVFn = (v) => [(v[0] + v[2]) * SE, v[1] * ST];
// Corner shelf side caps
const uvCornerSideEdge: UVFn = (v) => [v[2] * SE, v[1] * ST];

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
  center = true,
): THREE.BufferGeometry {
  const cx = center ? width / 2 : 0, cy = center ? depth / 2 : 0, cz = center ? height / 2 : 0;
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

  // Group 0: wood grain faces (top + bottom)
  addStrip(pos, uvs, topB, topF, uvShelfFlat);
  addStrip(pos, uvs, botF, botB, uvShelfFlat);
  const woodVerts = stripVertexCount(n) * 2;

  // Group 1: plywood edge faces (front wall + back wall + 2 side caps)
  addStrip(pos, uvs, topF, botF, uvShelfWallEdge);
  addStrip(pos, uvs, botB, topB, uvShelfWallEdge);
  addQuad(pos, uvs, topB[0], topF[0], botB[0], botF[0], uvShelfSideEdge);
  addQuad(pos, uvs, topF[n - 1], topB[n - 1], botF[n - 1], botB[n - 1], uvShelfSideEdge);
  const edgeVerts = stripVertexCount(n) * 2 + 12;

  const geo = makeGeo(pos, uvs);
  geo.addGroup(0, woodVerts, 0);
  geo.addGroup(woodVerts, edgeVerts, 1);
  return geo;
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
  center = true,
): THREE.BufferGeometry {
  const cx = center ? width / 2 : 0, cy = center ? depth / 2 : 0, cz = center ? height / 2 : 0;
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

  // Group 0: wood grain faces (right + left)
  addStrip(pos, uvs, rB, rF, uvColFlat);
  addStrip(pos, uvs, lF, lB, uvColFlat);
  const woodVerts = stripVertexCount(n) * 2;

  // Group 1: plywood edge faces (front wall + back wall + 2 caps)
  addStrip(pos, uvs, rF, lF, uvColWallEdge);
  addStrip(pos, uvs, lB, rB, uvColWallEdge);
  addQuad(pos, uvs, rF[n - 1], rB[n - 1], lF[n - 1], lB[n - 1], uvColCapEdge);
  addQuad(pos, uvs, lF[0], lB[0], rF[0], rB[0], uvColCapEdge);
  const edgeVerts = stripVertexCount(n) * 2 + 12;

  const geo = makeGeo(pos, uvs);
  geo.addGroup(0, woodVerts, 0);
  geo.addGroup(woodVerts, edgeVerts, 1);
  return geo;
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
  angleRad: number,
  center = true,
): THREE.BufferGeometry {
  const cx = center ? width / 2 : 0, cy = center ? length / 2 : 0, cz = center ? height / 2 : 0;
  const ht = thickness / 2;
  const n = piece.frontEdge.length;
  const z = piece.frontEdge[0].z;

  // Back edge: project each front point onto the L-wall via column-angle slice.
  const sinA = Math.sin(angleRad);
  const cosA = Math.cos(angleRad);
  const backPts: Point3D[] = [];
  for (let i = 0; i < n; i++) {
    const f = piece.frontEdge[i];
    const k = f.x * sinA - f.y * cosA;
    let bx: number, by: number;
    if (sinA > 1e-10) {
      const x = k / sinA;
      if (x >= -1e-10 && x <= width + 1e-10) {
        bx = Math.max(0, Math.min(x, width)); by = 0;
      } else {
        by = cosA > 1e-10 ? Math.max(0, Math.min(-k / cosA, length)) : 0;
        bx = 0;
      }
    } else {
      by = cosA > 1e-10 ? Math.max(0, Math.min(-k / cosA, length)) : 0;
      bx = 0;
    }
    backPts.push({ x: bx, y: by, z });
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

  // Corner shelf UVs: use XZ plane for top/bottom (covers the L shape)
  const uvFlat: UVFn = (v) => [v[0] * S, v[2] * S];

  const pos: number[] = [], uvs: number[] = [];

  // Group 0: wood grain faces (top + bottom)
  addStrip(pos, uvs, topBk, topF, uvFlat);
  addStrip(pos, uvs, botF, botBk, uvFlat);
  const woodVerts = stripVertexCount(n) * 2;

  // Group 1: plywood edge faces (front wall + back wall + 2 side caps)
  addStrip(pos, uvs, topF, botF, uvCornerWallEdge);
  addStrip(pos, uvs, botBk, topBk, uvCornerWallEdge);
  addQuad(pos, uvs, topBk[0], topF[0], botBk[0], botF[0], uvCornerSideEdge);
  addQuad(pos, uvs, topF[n - 1], topBk[n - 1], botF[n - 1], botBk[n - 1], uvCornerSideEdge);
  const edgeVerts = stripVertexCount(n) * 2 + 12;

  const geo = makeGeo(pos, uvs);
  geo.addGroup(0, woodVerts, 0);
  geo.addGroup(woodVerts, edgeVerts, 1);
  return geo;
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
  center = true,
): THREE.BufferGeometry {
  const cx = center ? width / 2 : 0, cy = center ? length / 2 : 0, cz = center ? height / 2 : 0;
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

  // Angle-aware UV projections
  const sinA = Math.sin(angleRad);
  const cosA = Math.cos(angleRad);
  const uvWall: UVFn = (v) => [v[1] * SE, (v[0] * sinA - v[2] * cosA) * ST];
  const uvCap: UVFn = (v) => [(v[0] * cosA + v[2] * sinA) * SE, (v[0] * sinA - v[2] * cosA) * ST];

  // Group 0: wood grain faces (right + left)
  addStrip(pos, uvs, rB, rF, uvColFlat);
  addStrip(pos, uvs, lF, lB, uvColFlat);
  const woodVerts = stripVertexCount(n) * 2;

  // Group 1: plywood edge faces (front wall + back wall + 2 caps)
  addStrip(pos, uvs, rF, lF, uvWall);
  addStrip(pos, uvs, lB, rB, uvWall);
  addQuad(pos, uvs, rF[n - 1], rB[n - 1], lF[n - 1], lB[n - 1], uvCap);
  addQuad(pos, uvs, lF[0], lB[0], rF[0], rB[0], uvCap);
  const edgeVerts = stripVertexCount(n) * 2 + 12;

  const geo = makeGeo(pos, uvs);
  geo.addGroup(0, woodVerts, 0);
  geo.addGroup(woodVerts, edgeVerts, 1);
  return geo;
}

// ---------------------------------------------------------------------------
// Closed polygon extrusion — for chair pieces (arbitrary non-convex polygons)
// ---------------------------------------------------------------------------

/**
 * Extrudes a closed polygon into a 3D plank of given thickness.
 *
 * Works with non-convex polygons (like side frame "<" profile) by using
 * THREE.ShapeGeometry for triangulation. Handles slightly non-planar outlines
 * (curved seat slats, bent back slats) by projecting to 2D for triangulation
 * but keeping 3D vertex positions for faithful curvature.
 *
 * @param outline  Closed polygon in Three.js coords (last point = first point)
 * @param normalDir  Unit normal to polygon plane (extrusion direction)
 * @param thickness  Plank thickness
 * @param uvFlatFn  UV function for flat faces (material group 0 — wood grain)
 * @param uvWallFn  UV function for wall faces (material group 1 — plywood edge)
 */
export function buildClosedPolygonGeo(
  outline: V3[],
  normalDir: V3,
  thickness: number,
  uvFlatFn: (v: V3) => [number, number],
  uvWallFn: (v: V3) => [number, number],
  holes?: V3[][],
): THREE.BufferGeometry {
  const dedup = (path: V3[]) =>
    (path.length > 1 &&
      Math.abs(path[0][0] - path[path.length - 1][0]) < 1e-6 &&
      Math.abs(path[0][1] - path[path.length - 1][1]) < 1e-6 &&
      Math.abs(path[0][2] - path[path.length - 1][2]) < 1e-6)
      ? path.slice(0, -1) : path;

  const pts = dedup(outline);
  const holePts: V3[][] = (holes ?? []).map(dedup);

  const N = pts.length;
  const ht = thickness / 2;

  const allPts: V3[] = [...pts];
  for (const h of holePts) allPts.push(...h);

  const faceA: V3[] = [];
  const faceB: V3[] = [];
  for (const p of allPts) {
    faceA.push([
      p[0] + normalDir[0] * ht,
      p[1] + normalDir[1] * ht,
      p[2] + normalDir[2] * ht,
    ]);
    faceB.push([
      p[0] - normalDir[0] * ht,
      p[1] - normalDir[1] * ht,
      p[2] - normalDir[2] * ht,
    ]);
  }

  // Project to 2D for triangulation using orthonormal basis of the polygon plane.
  const [nx, ny, nz] = normalDir;
  const seed: V3 = (Math.abs(nx) < 0.9) ? [1, 0, 0] : [0, 1, 0];
  let t1x = seed[1] * nz - seed[2] * ny;
  let t1y = seed[2] * nx - seed[0] * nz;
  let t1z = seed[0] * ny - seed[1] * nx;
  const t1Len = Math.sqrt(t1x * t1x + t1y * t1y + t1z * t1z);
  t1x /= t1Len; t1y /= t1Len; t1z /= t1Len;
  const t2x = ny * t1z - nz * t1y;
  const t2y = nz * t1x - nx * t1z;
  const t2z = nx * t1y - ny * t1x;

  const projectTo2D = (p: V3) => new THREE.Vector2(
    p[0] * t1x + p[1] * t1y + p[2] * t1z,
    p[0] * t2x + p[1] * t2y + p[2] * t2z,
  );

  const contour = pts.map(projectTo2D);
  const holes2D = holePts.map(h => h.map(projectTo2D));
  const faces = THREE.ShapeUtils.triangulateShape(contour, holes2D);
  const indices: number[] = [];
  for (const [a, b, c] of faces) {
    indices.push(a, b, c);
  }

  const pos: number[] = [];
  const uvs: number[] = [];

  // Group 0: flat faces (wood grain)
  for (let i = 0; i < indices.length; i += 3) {
    const a = faceA[indices[i]], b = faceA[indices[i + 1]], c = faceA[indices[i + 2]];
    pos.push(...a, ...b, ...c);
    uvs.push(...uvFlatFn(a), ...uvFlatFn(b), ...uvFlatFn(c));
  }
  for (let i = 0; i < indices.length; i += 3) {
    const a = faceB[indices[i]], b = faceB[indices[i + 2]], c = faceB[indices[i + 1]];
    pos.push(...a, ...b, ...c);
    uvs.push(...uvFlatFn(a), ...uvFlatFn(b), ...uvFlatFn(c));
  }
  const woodVerts = indices.length * 2;

  // Group 1: wall strips (plywood edge)
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    addQuad(pos, uvs, faceA[i], faceA[next], faceB[i], faceB[next], uvWallFn);
  }
  let holeOffset = N;
  for (const h of holePts) {
    const hLen = h.length;
    for (let i = 0; i < hLen; i++) {
      const curr = holeOffset + i;
      const next = holeOffset + (i + 1) % hLen;
      addQuad(pos, uvs, faceB[curr], faceB[next], faceA[curr], faceA[next], uvWallFn);
    }
    holeOffset += hLen;
  }
  const totalWallQuads = N + holePts.reduce((sum, h) => sum + h.length, 0);
  const edgeVerts = totalWallQuads * 6;

  const geo = makeGeo(pos, uvs);
  geo.addGroup(0, woodVerts, 0);
  geo.addGroup(woodVerts, edgeVerts, 1);
  return geo;
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
