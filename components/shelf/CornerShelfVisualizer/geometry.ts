import { Point3D, Point2D, CornerShelfParams } from './types';

/**
 * CORNER SHELF GENERATOR V2 — geometry.ts
 *
 * Replaces the uniform Catmull-Rom interpolation with CENTRIPETAL Catmull-Rom
 * using the Barry-Goldman algorithm. This fixes the stretching/warping that
 * occurs when width and length differ significantly.
 *
 * Why centripetal (alpha=0.5)?
 * - Proven to produce NO cusps or self-intersections (Yuksel et al. 2009)
 * - Knot spacing adapts to actual physical distances between control points
 * - Closely matches Grasshopper's "Tight" loft mode
 * - Better than chord-length (alpha=1) which can overshoot
 * - Better than uniform (alpha=0) which ignores spacing and distorts
 */

// =====================================================================
// SECTION 1: CONSTANTS AND ISOMETRIC PROJECTION
// =====================================================================

const DEFAULT_TILT = 30;
const ISO_FACTOR = Math.SQRT1_2; // cos(45°) = sin(45°) ≈ 0.707
const DIAG = 1 / Math.sqrt(2);   // Normalized 45° diagonal direction

export function isometricProject(p: Point3D, tiltDeg: number = DEFAULT_TILT): Point2D {
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const sinTilt = Math.sin(tiltRad);
  const cosTilt = Math.cos(tiltRad);
  return {
    x: (p.x - p.y) * ISO_FACTOR,
    y: -p.z * cosTilt + (p.x + p.y) * ISO_FACTOR * sinTilt,
  };
}

export function rotateAndProject(
  p: Point3D, angle: number, centerX: number, centerY: number, tiltDeg: number = DEFAULT_TILT
): Point2D {
  const x = p.x - centerX;
  const y = p.y - centerY;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  return isometricProject({
    x: x * cosA - y * sinA + centerX,
    y: x * sinA + y * cosA + centerY,
    z: p.z,
  }, tiltDeg);
}


// =====================================================================
// SECTION 2: CENTRIPETAL CATMULL-ROM (BARRY-GOLDMAN ALGORITHM)
// =====================================================================

interface XY { x: number; y: number }

const ALPHA = 0.5; // Centripetal parameterization

function dist(a: XY, b: XY): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function barryGoldman(
  p0: XY, p1: XY, p2: XY, p3: XY,
  t0: number, t1: number, t2: number, t3: number,
  t: number
): XY {
  const d10 = t1 - t0 || 1e-10;
  const d21 = t2 - t1 || 1e-10;
  const d32 = t3 - t2 || 1e-10;
  const d20 = t2 - t0 || 1e-10;
  const d31 = t3 - t1 || 1e-10;

  const a1x = p0.x * (t1 - t) / d10 + p1.x * (t - t0) / d10;
  const a1y = p0.y * (t1 - t) / d10 + p1.y * (t - t0) / d10;
  const a2x = p1.x * (t2 - t) / d21 + p2.x * (t - t1) / d21;
  const a2y = p1.y * (t2 - t) / d21 + p2.y * (t - t1) / d21;
  const a3x = p2.x * (t3 - t) / d32 + p3.x * (t - t2) / d32;
  const a3y = p2.y * (t3 - t) / d32 + p3.y * (t - t2) / d32;

  const b1x = a1x * (t2 - t) / d20 + a2x * (t - t0) / d20;
  const b1y = a1y * (t2 - t) / d20 + a2y * (t - t0) / d20;
  const b2x = a2x * (t3 - t) / d31 + a3x * (t - t1) / d31;
  const b2y = a2y * (t3 - t) / d31 + a3y * (t - t1) / d31;

  return {
    x: b1x * (t2 - t) / d21 + b2x * (t - t1) / d21,
    y: b1y * (t2 - t) / d21 + b2y * (t - t1) / d21,
  };
}

function centripetalInterpolate5(points: XY[], u: number): XY {
  const raw = [0];
  for (let i = 1; i < 5; i++) {
    raw.push(raw[i - 1] + Math.pow(dist(points[i], points[i - 1]), ALPHA));
  }

  const total = raw[4];
  if (total < 1e-10) return points[2];

  const k = raw.map(r => r / total);

  const d01 = dist(points[0], points[1]) || 1;
  const ghostBefore: XY = { x: points[0].x, y: points[0].y - d01 };
  const kBefore = k[0] - Math.pow(dist(ghostBefore, points[0]), ALPHA) / total;

  const d34 = dist(points[3], points[4]) || 1;
  const ghostAfter: XY = { x: points[4].x - d34, y: points[4].y };
  const kAfter = k[4] + Math.pow(dist(points[4], ghostAfter), ALPHA) / total;

  const t = Math.max(0, Math.min(1, u));

  if (t <= k[1]) {
    return barryGoldman(ghostBefore, points[0], points[1], points[2], kBefore, k[0], k[1], k[2], t);
  } else if (t <= k[2]) {
    return barryGoldman(points[0], points[1], points[2], points[3], k[0], k[1], k[2], k[3], t);
  } else if (t <= k[3]) {
    return barryGoldman(points[1], points[2], points[3], points[4], k[1], k[2], k[3], k[4], t);
  } else {
    return barryGoldman(points[2], points[3], points[4], ghostAfter, k[2], k[3], k[4], kAfter, t);
  }
}


// =====================================================================
// SECTION 3: SURFACE EVALUATOR
// =====================================================================

export function getCornerFrontSurface(
  u: number,
  z: number,
  params: CornerShelfParams
): XY {
  const { width, length, depth, height, amplitude } = params;

  const sineValue = Math.sin((z / height) * Math.PI * 2);
  const wave = amplitude * sineValue;

  const points: XY[] = [
    { x: width, y: 0 },
    { x: width - depth * 2 / 3 + wave * DIAG, y: depth + wave * DIAG },
    { x: depth - wave * DIAG, y: depth - wave * DIAG },
    { x: depth + wave * DIAG, y: length - depth * 2 / 3 + wave * DIAG },
    { x: 0, y: length },
  ];

  return centripetalInterpolate5(points, u);
}


// =====================================================================
// SECTION 4: GEOMETRY TYPES
// =====================================================================

export interface CornerShelfPiece {
  frontEdge: Point3D[];
  backEdgeX: Point3D[];
  backEdgeY: Point3D[];
  widthSide: [Point3D, Point3D];
  lengthSide: [Point3D, Point3D];
}

export interface CornerColumnPiece {
  frontEdge: Point3D[];
  backEdge: Point3D[];
  topSide: [Point3D, Point3D];
  bottomSide: [Point3D, Point3D];
}

export interface CornerShelfGeometry {
  shelves: CornerShelfPiece[];
  columns: CornerColumnPiece[];
  curves: Point3D[][];
  surfaceContours: Point3D[][];
}


// =====================================================================
// SECTION 5: COLUMN SLICING HELPER
// =====================================================================

export function getBackPointForSlice(k: number, angleRad: number, width: number, length: number): XY {
  const sinA = Math.sin(angleRad);
  const cosA = Math.cos(angleRad);

  if (sinA > 1e-10) {
    const x = k / sinA;
    if (x >= -1e-10 && x <= width + 1e-10) {
      return { x: Math.max(0, Math.min(x, width)), y: 0 };
    }
  }

  if (cosA > 1e-10) {
    const y = -k / cosA;
    if (y >= -1e-10 && y <= length + 1e-10) {
      return { x: 0, y: Math.max(0, Math.min(y, length)) };
    }
  }

  if (k >= 0) {
    return { x: Math.min(sinA > 1e-10 ? k / sinA : width, width), y: 0 };
  }
  return { x: 0, y: Math.min(cosA > 1e-10 ? -k / cosA : length, length) };
}


// =====================================================================
// SECTION 6: CONTROL CURVE GENERATOR
// =====================================================================

function generateCornerVerticalSineCurve(
  baseX: number, baseY: number,
  dirX: number, dirY: number,
  height: number, amplitude: number, inverted: boolean,
  segments: number = 40
): Point3D[] {
  const points: Point3D[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * height;
    const sineValue = Math.sin(t * Math.PI * 2);
    const offset = inverted ? -amplitude * sineValue : amplitude * sineValue;
    points.push({ x: baseX + offset * dirX, y: baseY + offset * dirY, z });
  }
  return points;
}


// =====================================================================
// SECTION 7: MAIN GEOMETRY GENERATOR
// =====================================================================

export function generateCornerShelfGeometry(params: CornerShelfParams): CornerShelfGeometry {
  const MIN = 0.0001;
  const { width: _w, length: _l, height: _h, depth: _d, shelfCount, columnCount, shelfOffset = 0, columnOffset = 0, columnAngle = 45 } = params;
  const width = Math.max(MIN, _w);
  const length = Math.max(MIN, _l);
  const height = Math.max(MIN, _h);
  const depth = Math.max(MIN, _d);

  const curveData = [
    { baseX: width, baseY: 0, dirX: 0, dirY: 1, amp: 0, inv: false },
    { baseX: width - depth * 2 / 3, baseY: depth, dirX: DIAG, dirY: DIAG, amp: params.amplitude, inv: false },
    { baseX: depth, baseY: depth, dirX: DIAG, dirY: DIAG, amp: params.amplitude, inv: true },
    { baseX: depth, baseY: length - depth * 2 / 3, dirX: DIAG, dirY: DIAG, amp: params.amplitude, inv: false },
    { baseX: 0, baseY: length, dirX: 1, dirY: 0, amp: 0, inv: false },
  ];

  const curves = curveData.map(c =>
    generateCornerVerticalSineCurve(c.baseX, c.baseY, c.dirX, c.dirY, height, c.amp, c.inv)
  );

  const surfaceContours: Point3D[][] = [];
  const numContours = 30;
  for (let i = 0; i <= numContours; i++) {
    const z = (i / numContours) * height;
    const contour: Point3D[] = [];
    const segments = 80;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const pos = getCornerFrontSurface(t, z, params);
      contour.push({ x: pos.x, y: pos.y, z });
    }
    surfaceContours.push(contour);
  }

  const shelves: CornerShelfPiece[] = [];
  const shelfStartZ = shelfOffset;
  const shelfEndZ = height - shelfOffset;

  for (let i = 0; i < shelfCount; i++) {
    const tZ = shelfCount > 1 ? i / (shelfCount - 1) : 0.5;
    const z = shelfStartZ + tZ * (shelfEndZ - shelfStartZ);

    const frontEdge: Point3D[] = [];
    const segments = 80;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const pos = getCornerFrontSurface(t, z, params);
      frontEdge.push({ x: pos.x, y: pos.y, z });
    }

    const backEdgeX: Point3D[] = [];
    for (let j = 0; j <= 20; j++) {
      backEdgeX.push({ x: width * (1 - j / 20), y: 0, z });
    }

    const backEdgeY: Point3D[] = [];
    for (let j = 0; j <= 20; j++) {
      backEdgeY.push({ x: 0, y: length * (j / 20), z });
    }

    shelves.push({
      frontEdge,
      backEdgeX,
      backEdgeY,
      widthSide: [frontEdge[0], { x: width, y: 0, z }],
      lengthSide: [frontEdge[frontEdge.length - 1], { x: 0, y: length, z }],
    });
  }

  const columns: CornerColumnPiece[] = [];

  const clampedAngle = Math.max(0.01, Math.min(89.99, columnAngle));
  const angleRad = (clampedAngle * Math.PI) / 180;
  const sinA = Math.sin(angleRad);
  const cosA = Math.cos(angleRad);

  const sampleZ = height / 2;
  const startPos = getCornerFrontSurface(0, sampleZ, params);
  const endPos = getCornerFrontSurface(1, sampleZ, params);
  const kStart = startPos.x * sinA - startPos.y * cosA;
  const kEnd = endPos.x * sinA - endPos.y * cosA;
  const kMin = Math.min(kStart, kEnd) + columnOffset;
  const kMax = Math.max(kStart, kEnd) - columnOffset;

  for (let i = 0; i < columnCount; i++) {
    const tCol = columnCount > 1 ? i / (columnCount - 1) : 0.5;
    const k = kMax + tCol * (kMin - kMax);

    const frontEdge: Point3D[] = [];
    const backEdge: Point3D[] = [];
    const colSegments = 40;

    for (let j = 0; j <= colSegments; j++) {
      const z = (j / colSegments) * height;

      let tLow = 0, tHigh = 1, tMid = 0.5;
      for (let iter = 0; iter < 20; iter++) {
        tMid = (tLow + tHigh) / 2;
        const pos = getCornerFrontSurface(tMid, z, params);
        if (pos.x * sinA - pos.y * cosA > k) {
          tLow = tMid;
        } else {
          tHigh = tMid;
        }
      }

      const frontPos = getCornerFrontSurface(tMid, z, params);
      frontEdge.push({ x: frontPos.x, y: frontPos.y, z });

      const backPos = getBackPointForSlice(k, angleRad, width, length);
      backEdge.push({ x: backPos.x, y: backPos.y, z });
    }

    columns.push({
      frontEdge,
      backEdge,
      bottomSide: [frontEdge[0], backEdge[0]],
      topSide: [frontEdge[frontEdge.length - 1], backEdge[backEdge.length - 1]],
    });
  }

  return { shelves, columns, curves, surfaceContours };
}


// =====================================================================
// SECTION 8: 2D PROJECTION
// =====================================================================

export interface ProjectedCornerShelfGeometry {
  shelves: {
    frontEdge: Point2D[];
    backEdgeX: Point2D[];
    backEdgeY: Point2D[];
    widthSide: [Point2D, Point2D];
    lengthSide: [Point2D, Point2D];
  }[];
  columns: {
    frontEdge: Point2D[];
    backEdge: Point2D[];
    topSide: [Point2D, Point2D];
    bottomSide: [Point2D, Point2D];
  }[];
  curves: Point2D[][];
  surfaceContours: Point2D[][];
}

export function projectCornerGeometryWithRotation(
  geo: CornerShelfGeometry,
  angle: number,
  width: number,
  length: number,
  tiltDeg: number = DEFAULT_TILT
): ProjectedCornerShelfGeometry {
  const centerX = width / 2;
  const centerY = length / 2;
  const project = (p: Point3D) => rotateAndProject(p, angle, centerX, centerY, tiltDeg);

  return {
    shelves: geo.shelves.map(s => ({
      frontEdge: s.frontEdge.map(project),
      backEdgeX: s.backEdgeX.map(project),
      backEdgeY: s.backEdgeY.map(project),
      widthSide: [project(s.widthSide[0]), project(s.widthSide[1])] as [Point2D, Point2D],
      lengthSide: [project(s.lengthSide[0]), project(s.lengthSide[1])] as [Point2D, Point2D],
    })),
    columns: geo.columns.map(c => ({
      frontEdge: c.frontEdge.map(project),
      backEdge: c.backEdge.map(project),
      topSide: [project(c.topSide[0]), project(c.topSide[1])] as [Point2D, Point2D],
      bottomSide: [project(c.bottomSide[0]), project(c.bottomSide[1])] as [Point2D, Point2D],
    })),
    curves: geo.curves.map(curve => curve.map(project)),
    surfaceContours: geo.surfaceContours.map(contour => contour.map(project)),
  };
}


// =====================================================================
// SECTION 9: BOUNDS CALCULATION
// =====================================================================

export function calculateBounds(projected: ProjectedCornerShelfGeometry): {
  minX: number; maxX: number; minY: number; maxY: number;
} {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const update = (p: Point2D) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  };

  projected.shelves.forEach(s => {
    s.frontEdge.forEach(update);
    s.backEdgeX.forEach(update);
    s.backEdgeY.forEach(update);
    update(s.widthSide[0]);
    update(s.widthSide[1]);
    update(s.lengthSide[0]);
    update(s.lengthSide[1]);
  });
  projected.columns.forEach(c => {
    c.frontEdge.forEach(update);
    c.backEdge.forEach(update);
    update(c.topSide[0]);
    update(c.topSide[1]);
    update(c.bottomSide[0]);
    update(c.bottomSide[1]);
  });

  return { minX, maxX, minY, maxY };
}

// =====================================================================
// SECTION 10: SVG HELPERS
// =====================================================================

export function pointsToPath(points: Point2D[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
  ).join(' ');
}
