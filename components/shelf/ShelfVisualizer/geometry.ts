import { Point3D, Point2D, ShelfParams } from './types';

/**
 * FLAT WALL SHELF GENERATOR
 *
 * The shelf sits against a flat wall. We create a wavy front surface by:
 * 1. Creating 3 vertical sine curves along the width (x-axis)
 *    - Left curve at x=0
 *    - Center curve at x=width/2 (INVERTED sine)
 *    - Right curve at x=width
 * 2. The sine curves go vertically (z-axis) and the wave affects depth (y-axis)
 * 3. Loft between curves to create front surface
 * 4. Extrude back to wall to create solid block
 * 5. Slice horizontally (shelves) and vertically (columns)
 */

// Default isometric angle (30 degrees)
const DEFAULT_TILT = 30;

// Isometric spread factor — 45° azimuth gives equal horizontal and vertical scaling,
// so that a 90° tilt (top-down) shows correct right angles in the XY plane.
const ISO_FACTOR = Math.SQRT1_2; // cos(45°) = sin(45°) = 1/√2 ≈ 0.707

export function isometricProject(p: Point3D, tiltDeg: number = DEFAULT_TILT): Point2D {
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const sinTilt = Math.sin(tiltRad);
  const cosTilt = Math.cos(tiltRad);
  return {
    x: (p.x - p.y) * ISO_FACTOR,
    y: -p.z * cosTilt + (p.x + p.y) * ISO_FACTOR * sinTilt,
  };
}

/**
 * Rotate a point around the Y-axis (vertical axis in our coordinate system)
 * and then apply isometric projection
 */
export function rotateAndProject(p: Point3D, angle: number, centerX: number, centerY: number, tiltDeg: number = DEFAULT_TILT): Point2D {
  // Translate to center
  const x = p.x - centerX;
  const y = p.y - centerY;

  // Rotate around vertical axis (Z-axis in 3D, but we rotate X and Y)
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const rotatedX = x * cosA - y * sinA;
  const rotatedY = x * sinA + y * cosA;

  // Translate back and project
  return isometricProject({
    x: rotatedX + centerX,
    y: rotatedY + centerY,
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

/**
 * Centripetal Catmull-Rom interpolation through 5 points for the flat shelf.
 *
 * Ghost points extrapolate the curve's own trajectory by reflecting the nearest
 * interior point across the endpoint. This lets the curve naturally continue
 * to the edge without forcing any particular arrival direction.
 */
function centripetalInterpolate5Flat(points: XY[], u: number): XY {
  const raw = [0];
  for (let i = 1; i < 5; i++) {
    raw.push(raw[i - 1] + Math.pow(dist(points[i], points[i - 1]), ALPHA));
  }
  const total = raw[4];
  if (total < 1e-10) return points[2];
  const k = raw.map(r => r / total);

  // Ghost point BEFORE P0 — reflect P1 across P0 to continue the curve naturally
  const ghostBefore: XY = { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y };
  const kBefore = k[0] - Math.pow(dist(ghostBefore, points[0]), ALPHA) / total;

  // Ghost point AFTER P4 — reflect P3 across P4 to continue the curve naturally
  const ghostAfter: XY = { x: 2 * points[4].x - points[3].x, y: 2 * points[4].y - points[3].y };
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

/**
 * Generate a vertical sine curve (for control curve visualization).
 */
function generateVerticalSineCurve(
  x: number,
  baseY: number,
  height: number,
  amplitude: number,
  inverted: boolean,
  segments: number = 40
): Point3D[] {
  const points: Point3D[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * height;
    const sineValue = Math.sin(t * Math.PI * 2);
    const yOffset = inverted ? -amplitude * sineValue : amplitude * sineValue;
    points.push({ x, y: baseY + yOffset, z });
  }
  return points;
}

/**
 * Evaluate the front surface at parameter u (0..1 across width) and height z.
 * Computes the 5 control point positions at this height and interpolates
 * through them using centripetal Catmull-Rom.
 */
function evaluateFlatSurface(
  u: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  amplitude: number,
  roundLeft: boolean,
  roundRight: boolean
): XY {
  const t = z / height;
  const sineValue = Math.sin(t * Math.PI * 2);

  const points: XY[] = [
    { x: 0,             y: roundLeft ? 0 : depth },
    { x: width / 6,     y: depth + amplitude * sineValue },
    { x: width / 2,     y: depth - amplitude * sineValue },
    { x: width * 5 / 6, y: depth + amplitude * sineValue },
    { x: width,         y: roundRight ? 0 : depth },
  ];

  return centripetalInterpolate5Flat(points, u);
}

/**
 * Public surface evaluator taking full ShelfParams.
 */
export function getFlatFrontSurface(u: number, z: number, params: ShelfParams): XY {
  const { width, height, depth, amplitude, roundLeft = false, roundRight = false } = params;
  return evaluateFlatSurface(u, z, width, height, depth, amplitude, roundLeft, roundRight);
}

/**
 * Get the front surface Y position at any (x, z) point.
 * Uses binary search to find the parameter u where the surface X ≈ target x,
 * then returns the Y value at that point.
 */
export function getFrontSurfaceY(
  x: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  amplitude: number,
  roundLeft: boolean = false,
  roundRight: boolean = false
): number {
  // Binary search for parameter u where surface X ≈ target x
  let uLow = 0, uHigh = 1;
  for (let iter = 0; iter < 20; iter++) {
    const uMid = (uLow + uHigh) / 2;
    const pos = evaluateFlatSurface(uMid, z, width, height, depth, amplitude, roundLeft, roundRight);
    if (pos.x < x) {
      uLow = uMid;
    } else {
      uHigh = uMid;
    }
  }
  const u = (uLow + uHigh) / 2;
  return evaluateFlatSurface(u, z, width, height, depth, amplitude, roundLeft, roundRight).y;
}

export interface ShelfPiece {
  frontEdge: Point3D[];
  backEdge: Point3D[];
  leftSide: [Point3D, Point3D];
  rightSide: [Point3D, Point3D];
}

export interface ColumnPiece {
  frontEdge: Point3D[];
  backEdge: Point3D[];
  topSide: [Point3D, Point3D];
  bottomSide: [Point3D, Point3D];
}

export interface ShelfGeometryResult {
  shelves: ShelfPiece[];
  columns: ColumnPiece[];
  curve0: Point3D[];
  curve1: Point3D[];
  curve2: Point3D[];
  curve3: Point3D[];
  curve4: Point3D[];
  leftCurve: Point3D[];
  centerCurve: Point3D[];
  rightCurve: Point3D[];
}

export function generateShelfGeometry(params: ShelfParams): ShelfGeometryResult {
  const MIN = 0.0001;
  const { width: _w, height: _h, depth: _d, amplitude, shelfCount, columnCount, shelfOffset = 0, columnOffset = 0, roundLeft = false, roundRight = false } = params;
  const width = Math.max(MIN, _w);
  const height = Math.max(MIN, _h);
  const depth = Math.max(MIN, _d);

  // Clamped params for surface evaluation
  const clamped: ShelfParams = { ...params, width, height, depth };

  // Generate the 5 control curves (for visual reference)
  const curve0 = generateVerticalSineCurve(0, roundLeft ? 0 : depth, height, 0, false);
  const curve1 = generateVerticalSineCurve(width / 6, depth, height, amplitude, false);
  const curve2 = generateVerticalSineCurve(width / 2, depth, height, amplitude, true);
  const curve3 = generateVerticalSineCurve(width * 5 / 6, depth, height, amplitude, false);
  const curve4 = generateVerticalSineCurve(width, roundRight ? 0 : depth, height, 0, false);

  // Keep old names for compatibility
  const leftCurve = curve0;
  const centerCurve = curve2;
  const rightCurve = curve4;

  const shelves: ShelfPiece[] = [];
  const columns: ColumnPiece[] = [];

  // Generate horizontal shelf pieces (u-based sampling through CR surface)
  const shelfStartZ = shelfOffset;
  const shelfEndZ = height - shelfOffset;
  for (let i = 0; i < shelfCount; i++) {
    const t = shelfCount > 1 ? i / (shelfCount - 1) : 0.5;
    const z = shelfStartZ + t * (shelfEndZ - shelfStartZ);

    const frontEdge: Point3D[] = [];
    const backEdge: Point3D[] = [];
    const edgeSegments = 60;

    for (let j = 0; j <= edgeSegments; j++) {
      const u = j / edgeSegments;
      const pos = getFlatFrontSurface(u, z, clamped);
      frontEdge.push({ x: pos.x, y: pos.y, z });
      backEdge.push({ x: (j / edgeSegments) * width, y: 0, z });
    }

    const leftSide: [Point3D, Point3D] = [
      frontEdge[0],
      { x: 0, y: 0, z },
    ];
    const rightSide: [Point3D, Point3D] = [
      frontEdge[frontEdge.length - 1],
      { x: width, y: 0, z },
    ];

    shelves.push({ frontEdge, backEdge, leftSide, rightSide });
  }

  // Generate vertical column pieces (binary search for u at target X)
  const colStartX = columnOffset;
  const colEndX = width - columnOffset;
  for (let i = 0; i < columnCount; i++) {
    const t = columnCount > 1 ? i / (columnCount - 1) : 0.5;
    const x = colStartX + t * (colEndX - colStartX);

    const frontEdge: Point3D[] = [];
    const backEdge: Point3D[] = [];
    const segments = 40;

    for (let j = 0; j <= segments; j++) {
      const z = (j / segments) * height;

      // Binary search for parameter u where surface X ≈ target x
      let uLow = 0, uHigh = 1;
      for (let iter = 0; iter < 20; iter++) {
        const uMid = (uLow + uHigh) / 2;
        const pos = getFlatFrontSurface(uMid, z, clamped);
        if (pos.x < x) {
          uLow = uMid;
        } else {
          uHigh = uMid;
        }
      }

      const frontPos = getFlatFrontSurface((uLow + uHigh) / 2, z, clamped);
      frontEdge.push({ x, y: frontPos.y, z });
      backEdge.push({ x, y: 0, z });
    }

    const bottomSide: [Point3D, Point3D] = [
      frontEdge[0],
      { x, y: 0, z: 0 },
    ];
    const topSide: [Point3D, Point3D] = [
      frontEdge[frontEdge.length - 1],
      { x, y: 0, z: height },
    ];

    columns.push({ frontEdge, backEdge, topSide, bottomSide });
  }

  return { shelves, columns, curve0, curve1, curve2, curve3, curve4, leftCurve, centerCurve, rightCurve };
}

// Projected types
export interface ProjectedShelfGeometry {
  shelves: {
    frontEdge: Point2D[];
    backEdge: Point2D[];
    leftSide: [Point2D, Point2D];
    rightSide: [Point2D, Point2D];
  }[];
  columns: {
    frontEdge: Point2D[];
    backEdge: Point2D[];
    topSide: [Point2D, Point2D];
    bottomSide: [Point2D, Point2D];
  }[];
  curve0: Point2D[];
  curve1: Point2D[];
  curve2: Point2D[];
  curve3: Point2D[];
  curve4: Point2D[];
  leftCurve: Point2D[];
  centerCurve: Point2D[];
  rightCurve: Point2D[];
}

export function projectGeometry(geo: ShelfGeometryResult, tiltDeg: number = DEFAULT_TILT): ProjectedShelfGeometry {
  const project = (p: Point3D) => isometricProject(p, tiltDeg);
  return {
    shelves: geo.shelves.map(s => ({
      frontEdge: s.frontEdge.map(project),
      backEdge: s.backEdge.map(project),
      leftSide: [project(s.leftSide[0]), project(s.leftSide[1])] as [Point2D, Point2D],
      rightSide: [project(s.rightSide[0]), project(s.rightSide[1])] as [Point2D, Point2D],
    })),
    columns: geo.columns.map(c => ({
      frontEdge: c.frontEdge.map(project),
      backEdge: c.backEdge.map(project),
      topSide: [project(c.topSide[0]), project(c.topSide[1])] as [Point2D, Point2D],
      bottomSide: [project(c.bottomSide[0]), project(c.bottomSide[1])] as [Point2D, Point2D],
    })),
    curve0: geo.curve0.map(project),
    curve1: geo.curve1.map(project),
    curve2: geo.curve2.map(project),
    curve3: geo.curve3.map(project),
    curve4: geo.curve4.map(project),
    leftCurve: geo.leftCurve.map(project),
    centerCurve: geo.centerCurve.map(project),
    rightCurve: geo.rightCurve.map(project),
  };
}

export function projectGeometryWithRotation(
  geo: ShelfGeometryResult,
  angle: number,
  width: number,
  depth: number,
  tiltDeg: number = DEFAULT_TILT
): ProjectedShelfGeometry {
  const centerX = width / 2;
  const centerY = depth / 2;

  const project = (p: Point3D) => rotateAndProject(p, angle, centerX, centerY, tiltDeg);

  return {
    shelves: geo.shelves.map(s => ({
      frontEdge: s.frontEdge.map(project),
      backEdge: s.backEdge.map(project),
      leftSide: [project(s.leftSide[0]), project(s.leftSide[1])] as [Point2D, Point2D],
      rightSide: [project(s.rightSide[0]), project(s.rightSide[1])] as [Point2D, Point2D],
    })),
    columns: geo.columns.map(c => ({
      frontEdge: c.frontEdge.map(project),
      backEdge: c.backEdge.map(project),
      topSide: [project(c.topSide[0]), project(c.topSide[1])] as [Point2D, Point2D],
      bottomSide: [project(c.bottomSide[0]), project(c.bottomSide[1])] as [Point2D, Point2D],
    })),
    curve0: geo.curve0.map(project),
    curve1: geo.curve1.map(project),
    curve2: geo.curve2.map(project),
    curve3: geo.curve3.map(project),
    curve4: geo.curve4.map(project),
    leftCurve: geo.leftCurve.map(project),
    centerCurve: geo.centerCurve.map(project),
    rightCurve: geo.rightCurve.map(project),
  };
}

export function pointsToPath(points: Point2D[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
  ).join(' ');
}

export function calculateBounds(projected: ProjectedShelfGeometry): {
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
    s.backEdge.forEach(update);
    update(s.leftSide[0]);
    update(s.leftSide[1]);
    update(s.rightSide[0]);
    update(s.rightSide[1]);
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
