// ---------------------------------------------------------------------------
// Chair Geometry — generates 2D wireframe outlines for a parametric flat-pack
// plywood chair. Every piece is a closed polygon (Point3D[], last = first)
// positioned in one of the principal planes (or a tilted plane for the
// backrest slats and rear crosspiece).
//
// Coordinate system:
//   x = left-right (0 = left edge of crosspieces)
//   y = front-to-back (0 = back of chair, seatDepth = front)
//   z = height (0 = floor, seatHeight = seat top)
//
// Piece inventory (6 types):
//   2× sideFrame       — YZ plane at x = fw/2 and x = sW-fw/2
//   1× frontCrosspiece — XZ plane at y = sd-fw/2
//   1× rearCrosspiece  — tilted XZ plane following splayed back legs
//   N× seatSlatLR      — XZ planes at evenly spaced y positions
//   N× seatSlatFB      — YZ planes at evenly spaced x positions
//   N× backSlat        — tilted planes along backrest normal
//
// Key design decisions:
//   - Back legs splay backward at the same angle as the backrest, creating
//     a "<" shape from the side with a bend at seat height.
//   - Side frames are inset to x=fw/2 and x=sW-fw/2 so they cross the
//     crosspiece legs at center (plus-shaped joint cross-section).
//   - Seat slat spacing treats structural pieces as boundary positions:
//     LR slats divide evenly between rear and front crosspieces,
//     FB slats divide evenly between left and right side frames.
//   - FB slats extend to y=sd (front of chair), ~1" past front crosspiece,
//     mirroring the side frame's front leg extent.
//   - Backrest slats are oriented perpendicular to the backrest surface
//     (height runs along the backrest normal, not vertical).
//   - 3" air gap between seat and first backrest slat.
//   - All corners rounded with CORNER_RADIUS via roundCorners2D().
//   - Inner backrest base pinned to z=sH so the seat rail stays horizontal.
// ---------------------------------------------------------------------------

import { ChairParams, ChairPiece, ChairGeometry } from './types';
import { Point3D } from '@/components/shelf/ShelfVisualizer/types';

// Corner radii now come from params (was hardcoded CORNER_RADIUS = 0.5, inner = 1.5)
const ARC_SEGMENTS = 16;   // arc points per quarter-turn (90°)
const SEAT_SEGMENTS = 48;  // subdivisions along seat slat top edges for smooth contour
// footrestHeight is now a param (was hardcoded FOOTREST_Z = 8)

function p3(x: number, y: number, z: number): Point3D {
  return { x, y, z };
}

// Hermite smoothstep: C1-smooth transition from 0 to 1 (clamped to [0,1])
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

// ---------------------------------------------------------------------------
// seatDepression — returns the z-depth of the ergonomic seat contour at (x, y).
//
// Shape is the product of two smoothstep profiles:
//   gx: 0 at side frame edges (x = fw/2, sW−fw/2), 1 at center (x = sW/2)
//   gy: 0 at rear/front crosspieces (y = fw/2, sd−fw/2), peak 1" behind midpoint
//
// Smoothstep ensures zero slope at all boundaries — the bowl blends seamlessly
// into the flat seat surface with no visible kink.
// ---------------------------------------------------------------------------
function seatDepression(x: number, y: number, params: ChairParams): number {
  const { seatWidth: sW, seatDepth: sd, frameWidth: fw, seatScoop, scoopOffset, scoopSpread } = params;

  const cx = sW / 2;
  const halfW = (sW - fw) / 2;     // half the space between frame edges
  const xMargin = halfW * (1 - scoopSpread); // narrow the active zone by spread
  const xLeft = fw / 2 + xMargin;
  const xRight = sW - fw / 2 - xMargin;
  const gx = smoothstep((x - xLeft) / (cx - xLeft)) * smoothstep((xRight - x) / (xRight - cx));

  const yHalf = (sd - fw) / 2;
  const yMargin = yHalf * (1 - scoopSpread);
  const yBack = fw / 2 + yMargin;
  const yFront = sd - fw / 2 - yMargin;
  const yPeak = sd / 2 - scoopOffset;
  const gy = smoothstep((y - yBack) / (yPeak - yBack)) * smoothstep((yFront - y) / (yFront - yPeak));

  return seatScoop * gx * gy;
}

// ---------------------------------------------------------------------------
// roundCorners2D — replaces every sharp corner of a closed 2D polygon with
// a smooth arc. Input: closed polygon where last point = first point.
//
// Algorithm per corner:
//   1. Compute incoming/outgoing edge unit vectors from the vertex
//   2. Find the angle between edges and tangent distance (r / tan(halfAngle))
//   3. Clamp tangent distance to half the shortest adjacent edge
//   4. Place arc center along the angle bisector at distance r/sin(halfAngle)
//   5. Sweep arc from tangent point on incoming edge to outgoing edge
//   6. Cross product of edge vectors determines sweep direction (CW vs CCW)
//
// Handles convex and concave corners, auto-clamps radius for tight angles.
// radius can be a single number (uniform) or per-vertex array.
// ---------------------------------------------------------------------------
// roundCorner2D — round a single corner given prev/curr/next and radius.
// Returns arc points from the tangent on the incoming edge to the tangent on the
// outgoing edge. Clamped to half the shortest adjacent edge length.
// Optional edgeLen1/edgeLen2 override the clamping distances (use when prev/next
// are contour neighbors for direction but clamping should use structural lengths).
function roundCorner2D(prev: [number, number], curr: [number, number], next: [number, number], ri: number, edgeLen1?: number, edgeLen2?: number): [number, number][] {
  const d1x = prev[0] - curr[0], d1y = prev[1] - curr[1];
  const d2x = next[0] - curr[0], d2y = next[1] - curr[1];
  const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
  const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
  if (len1 < 1e-10 || len2 < 1e-10 || ri <= 0) return [curr];
  const u1x = d1x / len1, u1y = d1y / len1;
  const u2x = d2x / len2, u2y = d2y / len2;
  const dot = u1x * u2x + u1y * u2y;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
  if (angle < 0.01 || angle > Math.PI - 0.01) return [curr];
  const halfAngle = angle / 2;
  let tanDist = ri / Math.tan(halfAngle);
  const maxDist = Math.min(edgeLen1 ?? len1, edgeLen2 ?? len2) / 2;
  let r = ri;
  if (tanDist > maxDist) { tanDist = maxDist; r = tanDist * Math.tan(halfAngle); }
  const bisX = u1x + u2x, bisY = u1y + u2y;
  const bisLen = Math.sqrt(bisX * bisX + bisY * bisY);
  if (bisLen < 1e-10) return [curr];
  const centerDist = r / Math.sin(halfAngle);
  const cx = curr[0] + (bisX / bisLen) * centerDist;
  const cy = curr[1] + (bisY / bisLen) * centerDist;
  const t1x = curr[0] + u1x * tanDist, t1y = curr[1] + u1y * tanDist;
  const t2x = curr[0] + u2x * tanDist, t2y = curr[1] + u2y * tanDist;
  const startAngle = Math.atan2(t1y - cy, t1x - cx);
  const endAngle = Math.atan2(t2y - cy, t2x - cx);
  const cross = u1x * u2y - u1y * u2x;
  let sweep = endAngle - startAngle;
  if (cross > 0) { while (sweep > 0) sweep -= 2 * Math.PI; }
  else { while (sweep < 0) sweep += 2 * Math.PI; }
  const arcPts: [number, number][] = [];
  for (let s = 0; s <= ARC_SEGMENTS; s++) {
    const t = s / ARC_SEGMENTS;
    const a = startAngle + sweep * t;
    arcPts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return arcPts;
}

function roundCorners2D(verts: [number, number][], radius: number | number[]): [number, number][] {
  const n = verts.length - 1; // unique vertices (exclude closing duplicate)
  if (n < 3) return verts;
  const getR = (i: number) => typeof radius === 'number' ? radius : radius[i];

  const result: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n];
    const curr = verts[i];
    const next = verts[(i + 1) % n];

    // Edge vectors from current vertex toward prev and next
    const d1x = prev[0] - curr[0], d1y = prev[1] - curr[1];
    const d2x = next[0] - curr[0], d2y = next[1] - curr[1];
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);

    if (len1 < 1e-10 || len2 < 1e-10) {
      result.push(curr);
      continue;
    }

    // Unit vectors
    const u1x = d1x / len1, u1y = d1y / len1;
    const u2x = d2x / len2, u2y = d2y / len2;

    // Angle between edges at this vertex
    const dot = u1x * u2x + u1y * u2y;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

    // Skip nearly straight or degenerate corners
    if (angle < 0.01 || angle > Math.PI - 0.01) {
      result.push(curr);
      continue;
    }

    const halfAngle = angle / 2;
    const ri = getR(i);
    if (ri <= 0) { result.push(curr); continue; }
    let tanDist = ri / Math.tan(halfAngle);
    const maxDist = Math.min(len1, len2) / 2;
    let r = ri;
    if (tanDist > maxDist) {
      tanDist = maxDist;
      r = tanDist * Math.tan(halfAngle); // effective radius after clamping
    }

    // Arc center: along bisector of the two edge vectors
    const bisX = u1x + u2x, bisY = u1y + u2y;
    const bisLen = Math.sqrt(bisX * bisX + bisY * bisY);
    if (bisLen < 1e-10) { result.push(curr); continue; }
    const centerDist = r / Math.sin(halfAngle);
    const cx = curr[0] + (bisX / bisLen) * centerDist;
    const cy = curr[1] + (bisY / bisLen) * centerDist;

    // Tangent points on each edge (where the arc meets the straight edge)
    const t1x = curr[0] + u1x * tanDist, t1y = curr[1] + u1y * tanDist;
    const t2x = curr[0] + u2x * tanDist, t2y = curr[1] + u2y * tanDist;

    // Arc sweep: cross product determines CW vs CCW
    const startAngle = Math.atan2(t1y - cy, t1x - cx);
    const endAngle = Math.atan2(t2y - cy, t2x - cx);
    const cross = u1x * u2y - u1y * u2x;
    let sweep = endAngle - startAngle;
    if (cross > 0) {      // concave corner → CW arc
      while (sweep > 0) sweep -= 2 * Math.PI;
    } else {               // convex corner → CCW arc
      while (sweep < 0) sweep += 2 * Math.PI;
    }

    // Emit arc points
    const arcSteps = Math.max(2, Math.round(Math.abs(sweep) / (Math.PI / 2) * ARC_SEGMENTS));
    for (let j = 0; j <= arcSteps; j++) {
      const theta = startAngle + sweep * (j / arcSteps);
      result.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta)]);
    }
  }

  // Close the polygon
  if (result.length > 0) {
    result.push([result[0][0], result[0][1]]);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Side frames (×2) — the main structural profile, one at each side.
//
// Shape: modified H — full-height back post (splayed leg + backrest as a
// "<" shape with a bend at seat height), shorter front leg, horizontal
// seat rail connecting them. Upper-front quarter removed (front leg stops
// at seat height, doesn't continue as a backrest).
//
// Lies in the YZ plane at x = fw/2 (left) and x = sW-fw/2 (right),
// centered on the crosspiece legs for plus-shaped joint cross-sections.
//
// Back post geometry:
//   The backrest tilts backward from (0, sH) upward at backAngle.
//   The back leg mirrors this — splays backward from (0, sH) downward
//   at the same angle, creating stability. This gives the "<" profile.
//
//   Outer back edge: (0, sH) → (-bH·sinα, sH+bH·cosα) upward (backrest)
//                    (0, sH) → (-sH·tanα, 0) downward (leg)
//
//   Inner back edge: offset fw perpendicular to tilt direction.
//     Backrest perpendicular (inward): (cosA, sinA)
//     Back leg perpendicular (inward): (cosA, -sinA)
//     Inner backrest base pinned at (fw/cosA, sH) to keep seat horizontal.
//     Inner back leg at seat rail bottom: (fw·(1-sinA)/cosA, sH-fw)
//     Inner back leg at floor: ((fw-sH·sinA)/cosA, 0)
//
// 12 vertices, clockwise from back-outer-bottom:
//   0  back outer bottom (splayed)    6  front outer bottom
//   1  back outer at seat             7  front inner bottom
//   2  backrest outer top             8  front inner at seat rail bottom
//   3  backrest inner top             9  back inner at seat rail bottom
//   4  backrest inner base (z=sH)    10  back inner bottom (splayed)
//   5  front outer top               11  close (= vertex 0)
// ---------------------------------------------------------------------------
function generateSideFrames(params: ChairParams): ChairPiece[] {
  const { seatDepth: sd, seatHeight: sH, backHeight: bH, frameWidth: fw, seatWidth: sW } = params;
  const alpha = params.backAngle * Math.PI / 180;
  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const tanA = sinA / cosA;

  // Bench tilt: seat pivots at backrest inner base (vertex 4), where the
  // seat rail starts. This is at y=fw/cosA, z=sH — the backrest geometry
  // stays fixed and the seat tilts from this junction.
  const beta = (params.benchAngle ?? 0) * Math.PI / 180;
  const tanB = Math.tan(beta);
  const sinB = Math.sin(beta);
  const cosB = Math.cos(beta);

  const yPivot = fw / cosA;  // y where seat rail begins (backrest inner base)
  const frontSeatZ = sH + (sd - yPivot) * tanB;  // seat height at front edge

  // cos(alpha + beta) — used for perpendicular rail thickness at back junction
  const cosAB = cosA * cosB - sinA * sinB;

  // Front legs splay forward perpendicular to bench surface (angle = benchAngle)
  const frontOuterY = sd + frontSeatZ * tanB;
  const frontInnerY = sd + (frontSeatZ * sinB - fw) / cosB;

  // Vertex 8: intersection of front leg inner edge and seat rail inner bottom.
  // Rail bottom line: z = sH + (y - yPivot)*tanB - fw (constant vertical gap fw).
  // Front leg inner line: (frontInnerY - s*sinB, s*cosB) for parameter s.
  const s8 = cosB * (sH + (frontInnerY - yPivot) * tanB - fw);
  const v8y = frontInnerY - s8 * sinB;
  const v8z = s8 * cosB;

  // Vertex 9: intersection of back leg inner edge and seat rail inner bottom.
  // Rail bottom: z = sH + (y - yPivot)*tanB - fw. Back leg inner passes through
  // vertex 4 in direction (-sinA, -cosA). Intersection parameter = fw*cosB/cos(A+B).
  const v9y = fw / cosA - fw * cosB * sinA / cosAB;
  const v9z = sH - fw * cosA * cosB / cosAB;

  const R = params.cornerRadius;
  const R2 = params.innerRadius;
  const R3 = params.backLegRadius;

  if (params.sideBar) {
    // With side bar: C-shape contour like the original but truncated at the
    // crossbar bottom (z=FZ). The lower opening is part of the contour path
    // so no phantom wall appears at floor level. Only the upper opening
    // (crossbar top to seat rail) is a separate hole.
    const FZ = params.footrestHeight;
    const backInnerYAt = (z: number) => fw / cosA + (z - sH) * tanA;
    const frontInnerYAt = (z: number) => frontInnerY - z * tanB;

    // Outer contour: traces outer silhouette, down front leg, across floor,
    // up front inner to crossbar bottom, across crossbar, down back inner
    // to floor, across to back outer bottom, close.
    const outerVerts: [number, number][] = [
      [-sH * tanA, 0],                                       // 0:  back outer bottom
      [0, sH],                                                // 1:  back outer at seat
      [-bH * sinA, sH + bH * cosA],                          // 2:  backrest outer top
      [fw * cosA - bH * sinA, sH + bH * cosA + fw * sinA],   // 3:  backrest inner top
      [fw / cosA, sH],                                        // 4:  backrest inner base
      [sd, frontSeatZ],                                       // 5:  front outer top
      [frontOuterY, 0],                                       // 6:  front outer bottom
      [frontInnerY, 0],                                       // 7:  front inner bottom
      [frontInnerYAt(FZ), FZ],                                // 8:  front inner @ crossbar bottom
      [backInnerYAt(FZ), FZ],                                 // 9:  back inner @ crossbar bottom
      [(fw - sH * sinA) / cosA, 0],                          // 10: back inner bottom
      [-sH * tanA, 0],                                        // close
    ];
    const outerRadii = [R, R3, R, R, R2, R, R, R, R2, R3, R];
    const outerRounded = roundCorners2D(outerVerts, outerRadii);

    // One hole: upper opening (crossbar top to seat rail)
    const holeVerts: [number, number][] = [
      [frontInnerYAt(FZ + fw), FZ + fw],  // front inner @ crossbar top
      [v8y, v8z],                           // front inner @ seat rail
      [v9y, v9z],                           // back inner @ seat rail
      [backInnerYAt(FZ + fw), FZ + fw],    // back inner @ crossbar top
      [frontInnerYAt(FZ + fw), FZ + fw],   // close
    ];
    const holeRadii = [R2, R2, R2, R2];
    const holeRounded = roundCorners2D(holeVerts, holeRadii);

    const toHole3D = (x: number) => (verts: [number, number][]) =>
      verts.map(([y, z]) => p3(x, y, z));

    return [
      {
        type: 'sideFrame',
        outline: outerRounded.map(([y, z]) => p3(fw / 2, y, z)),
        holes: [holeRounded].map(toHole3D(fw / 2)),
      },
      {
        type: 'sideFrame',
        outline: outerRounded.map(([y, z]) => p3(sW - fw / 2, y, z)),
        holes: [holeRounded].map(toHole3D(sW - fw / 2)),
      },
    ];
  }

  // No footrest: single continuous polygon (original C-shape)
  const verts: [number, number][] = [
    [-sH * tanA, 0],                                   // 0:  back outer bottom (splayed backward)
    [0, sH],                                           // 1:  back outer at seat
    [-bH * sinA, sH + bH * cosA],                     // 2:  backrest outer top
    [fw * cosA - bH * sinA, sH + bH * cosA + fw * sinA], // 3:  backrest inner top (perpendicular cut)
    [fw / cosA, sH],                                   // 4:  backrest inner base (pinned to sH)
    [sd, frontSeatZ],                                   // 5:  front outer top (tilted by benchAngle)
    [frontOuterY, 0],                                   // 6:  front outer bottom (splayed forward)
    [frontInnerY, 0],                                   // 7:  front inner bottom (splayed forward)
    [v8y, v8z],                                         // 8:  front inner at seat rail bottom
    [v9y, v9z],                                         // 9:  back inner at seat rail bottom
    [(fw - sH * sinA) / cosA, 0],                     // 10: back inner bottom (splayed backward)
    [-sH * tanA, 0],                                   // 11: close
  ];

  const radii = [R, R3, R, R, R2, R, R, R, R2, R3, R];
  const rounded = roundCorners2D(verts, radii);

  return [
    { type: 'sideFrame', outline: rounded.map(([y, z]) => p3(fw / 2, y, z)) },
    { type: 'sideFrame', outline: rounded.map(([y, z]) => p3(sW - fw / 2, y, z)) },
  ];
}

// ---------------------------------------------------------------------------
// Front crosspiece (×1) — inverted-U ("n" shape) connecting front legs.
//
// When front legs are vertical (benchAngle=0), this is a flat XZ plane at
// y = sd - fw/2. When front legs splay forward (benchAngle>0), the crosspiece
// tilts to follow the legs — y varies with z, mirroring how the rear
// crosspiece follows the splayed back legs.
//
// 9 vertices (CW): outer rectangle then inner cutout.
// ---------------------------------------------------------------------------
function generateFrontCrosspiece(params: ChairParams): ChairPiece {
  const { seatWidth: sW, seatHeight: sH, frameWidth: fw, seatDepth: sd } = params;
  const alpha = params.backAngle * Math.PI / 180;
  const cosA = Math.cos(alpha);

  // Bench tilt — pivot at backrest inner base
  const beta = (params.benchAngle ?? 0) * Math.PI / 180;
  const tanB = Math.tan(beta);
  const cosB = Math.cos(beta);
  const yPivot = fw / cosA;

  // Crosspiece center y at seat level (center of front legs)
  const crossCenterY = sd - fw / (2 * cosB);
  // Seat height at crosspiece center — matches the side frame rail exactly
  const crossTopZ = sH + (crossCenterY - yPivot) * tanB;

  // Front seat height at outer edge (for leg splay geometry)
  const frontSeatZ = sH + (sd - yPivot) * tanB;
  // Center of splayed front leg at floor (z=0)
  const yBaseFront = sd + frontSeatZ * tanB - fw / (2 * cosB);

  // Inner cutout bottom: solve z = sH + (yBaseFront - z*tanB - yPivot)*tanB - fw
  // to find the z where the crosspiece's tilted plane intersects the rail bottom.
  // This gives z = cos²B * (sH + (yBaseFront - yPivot)*tanB - fw).
  const innerCutoutZ = cosB * cosB * (sH + (yBaseFront - yPivot) * tanB - fw);

  const R = params.cornerRadius;
  const R2 = params.innerRadius;
  const toP3 = ([x, z]: [number, number]) => p3(x, yBaseFront - z * tanB, z);

  if (params.frontBar) {
    const FZ = params.footrestHeight;

    // C-shape contour: outer rectangle + inner path down to crossbar bottom.
    // The lower opening is part of the contour (no phantom floor wall).
    // Only the upper opening is a separate hole.
    const outerVerts: [number, number][] = [
      [0, 0],               // 0: left outer bottom
      [0, crossTopZ],        // 1: left outer top
      [sW, crossTopZ],       // 2: right outer top
      [sW, 0],               // 3: right outer bottom
      [sW - fw, 0],          // 4: right inner bottom
      [sW - fw, FZ],         // 5: right inner @ crossbar bottom
      [fw, FZ],              // 6: left inner @ crossbar bottom
      [fw, 0],               // 7: left inner bottom
      [0, 0],                // close
    ];
    const outerRadii = [R, R, R, R, R, R2, R2, R];
    const outerRounded = roundCorners2D(outerVerts, outerRadii);

    // One hole: upper opening (crossbar top to seat rail)
    const holeVerts: [number, number][] = [
      [fw, FZ + fw],             // left inner @ crossbar top
      [sW - fw, FZ + fw],        // right inner @ crossbar top
      [sW - fw, innerCutoutZ],   // right inner @ seat rail
      [fw, innerCutoutZ],        // left inner @ seat rail
      [fw, FZ + fw],             // close
    ];
    const holeRadii = [R2, R2, R2, R2];
    const holeRounded = roundCorners2D(holeVerts, holeRadii);

    return {
      type: 'frontCrosspiece',
      outline: outerRounded.map(toP3),
      holes: [holeRounded].map(h => h.map(toP3)),
    };
  }

  // No footrest: single continuous polygon (original C-shape)
  const verts: [number, number][] = [
    [0, 0], [0, crossTopZ], [sW, crossTopZ], [sW, 0],
    [sW - fw, 0], [sW - fw, innerCutoutZ], [fw, innerCutoutZ], [fw, 0],
    [0, 0],
  ];

  const radii = [R, R, R, R, R, R2, R2, R];
  const rounded = roundCorners2D(verts, radii);
  return { type: 'frontCrosspiece', outline: rounded.map(toP3) };
}

// ---------------------------------------------------------------------------
// Rear crosspiece (×1) — H-shape connecting back legs, tilted to match
// the splayed back leg angle.
//
// 2D outline is a standard H-shape in (x, z) local coordinates:
//   - Two vertical legs from floor to vertTop (sH - 1")
//   - Horizontal crossbar at crossbarTop (sH - 4") to crossbarBot
//
// 3D mapping: instead of constant y, each point's y follows the center
// of the tilted back leg at that height z:
//   y(z) = yBase + z · tanA
// where yBase = -sH·tanA + fw/(2·cosA) is the back leg center at floor.
// This keeps the crosspiece centered on the splayed legs at every height.
//
// 13 vertices (CW): two uprights connected by a crossbar with cutouts.
// ---------------------------------------------------------------------------
function generateRearCrosspiece(params: ChairParams): ChairPiece {
  const { seatWidth: sW, seatHeight: sH, frameWidth: fw } = params;
  const alpha = params.backAngle * Math.PI / 180;
  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const tanA = sinA / cosA;

  // Center of splayed back leg at floor (z=0)
  const yBase = -sH * tanA + fw / (2 * cosA);

  const vertTop = sH - 1;       // top of vertical legs (1" below seat)
  const crossbarTop = sH - 4;   // top of horizontal crossbar
  const crossbarBot = crossbarTop - fw; // bottom of crossbar

  const verts: [number, number][] = [
    [0, 0], [0, vertTop], [fw, vertTop], [fw, crossbarTop],
    [sW - fw, crossbarTop], [sW - fw, vertTop], [sW, vertTop], [sW, 0],
    [sW - fw, 0], [sW - fw, crossbarBot], [fw, crossbarBot], [fw, 0],
    [0, 0],
  ];

  // Per-vertex radii: four corners where legs meet crossbar (3, 4, 9, 10) get 2"
  const R = params.cornerRadius;
  const R2 = params.innerRadius;
  const radii = [R, R, R, R2, R2, R, R, R, R, R2, R2, R];

  const rounded = roundCorners2D(verts, radii);
  return {
    type: 'rearCrosspiece',
    // y shifts forward (+y) as z increases, following the splayed back leg center
    outline: rounded.map(([x, z]) => p3(x, yBase + z * tanA, z)),
  };
}

// ---------------------------------------------------------------------------
// Side-to-side seat slats (×N) — horizontal rectangles spanning chair width.
//
// Lie in XZ planes at evenly spaced y positions between the rear crosspiece
// (y = fw/2) and front crosspiece (y = sd-fw/2). Those structural pieces
// serve as boundary positions — actual slats fill the interior gaps.
//
// Spacing: (sd - fw) / (seatSlatCount + 1), with slats at positions 1..N.
// Shape: sW × slH rectangle at z = [sH-slH, sH].
// ---------------------------------------------------------------------------
function generateSeatSlatsLR(params: ChairParams): ChairPiece[] {
  const { seatWidth: sW, seatHeight: sH, slatHeight: slH, frameWidth: fw, seatDepth: sd, seatSlatCount: count } = params;
  const alpha = params.backAngle * Math.PI / 180;
  const cosA = Math.cos(alpha);

  // Bench tilt — pivot at backrest inner base (y=fw/cosA, z=sH)
  const beta = (params.benchAngle ?? 0) * Math.PI / 180;
  const tanB = Math.tan(beta);
  const cosB = Math.cos(beta);
  const yPivot = fw / cosA;

  // Boundaries: benchStart offset from backrest, front crosspiece at sd-fw/2
  const yStart = params.benchStart;
  const yEnd = sd - fw / 2;
  const spacing = (yEnd - yStart) / (count + 1);

  const pieces: ChairPiece[] = [];
  for (let i = 1; i <= count; i++) {
    const y = yStart + i * spacing;
    // Seat surface rises with bench tilt from pivot point
    const seatZ = sH + (y - yPivot) * tanB;

    // Build outline by rounding the 4 structural corners using true structural
    // edge vectors (not subdivision neighbors), then stitching subdivision points.
    const R = params.cornerRadius;
    const bl: [number, number] = [0, seatZ - slH * cosB];
    const br: [number, number] = [sW, seatZ - slH * cosB];
    const tr: [number, number] = [sW, seatZ - seatDepression(sW, y, params)];
    const tl: [number, number] = [0, seatZ - seatDepression(0, y, params)];

    // Nearest contour subdivision points for tangent-correct top corner rounding
    const xNearR = sW * (SEAT_SEGMENTS - 1) / SEAT_SEGMENTS;
    const xNearL = sW / SEAT_SEGMENTS;
    const contourNearR: [number, number] = [xNearR, seatZ - seatDepression(xNearR, y, params)];
    const contourNearL: [number, number] = [xNearL, seatZ - seatDepression(xNearL, y, params)];

    const rounded: [number, number][] = [];
    rounded.push(...roundCorner2D(tl, bl, br, R));           // bottom-left
    rounded.push(...roundCorner2D(bl, br, tr, R));           // bottom-right
    const topEdgeLen = Math.sqrt((tr[0] - tl[0]) ** 2 + (tr[1] - tl[1]) ** 2);
    // Compute tangent distance to filter contour points inside arc zones
    const lrTopAngle = Math.acos(Math.max(-1, Math.min(1,
      ((br[0] - tr[0]) * (contourNearR[0] - tr[0]) + (br[1] - tr[1]) * (contourNearR[1] - tr[1])) /
      (Math.sqrt((br[0]-tr[0])**2+(br[1]-tr[1])**2) * Math.sqrt((contourNearR[0]-tr[0])**2+(contourNearR[1]-tr[1])**2)))));
    const lrTopTanDist = Math.min(R / Math.tan(lrTopAngle / 2), topEdgeLen / 2);
    const lrContourXMax = tr[0] - lrTopTanDist;
    const lrContourXMin = tl[0] + lrTopTanDist;

    rounded.push(...roundCorner2D(br, tr, contourNearR, R, undefined, topEdgeLen)); // top-right
    for (let j = SEAT_SEGMENTS - 1; j >= 1; j--) {          // contoured top interior
      const x = sW * j / SEAT_SEGMENTS;
      if (x > lrContourXMax || x < lrContourXMin) continue;
      rounded.push([x, seatZ - seatDepression(x, y, params)]);
    }
    rounded.push(...roundCorner2D(contourNearL, tl, bl, R, topEdgeLen)); // top-left
    // Map to 3D: y shifts based on depth below seat surface so slat
    // is perpendicular to the tilted bench, not parallel to the ground
    pieces.push({
      type: 'seatSlatLR',
      outline: rounded.map(([x, z]) => p3(x, y + (seatZ - z) * tanB, z)),
    });
  }
  return pieces;
}

// ---------------------------------------------------------------------------
// Front-to-back seat slats (×N) — horizontal rectangles spanning seat depth.
//
// Lie in YZ planes at evenly spaced x positions between the left side frame
// (x = fw/2) and right side frame (x = sW-fw/2). Side frames serve as
// boundary positions — actual slats fill the interior gaps.
//
// Y range: fw (back leg inner) to sd (front of chair, mirroring side frame
// front leg extent — about 1" past front crosspiece center).
//
// Spacing: (sW - fw) / (seatSlatCount + 1), with slats at positions 1..N.
// Shape: (sd-fw) × slH rectangle at z = [sH-slH, sH].
// ---------------------------------------------------------------------------
function generateSeatSlatsFB(params: ChairParams): ChairPiece[] {
  const { seatWidth: sW, seatHeight: sH, slatHeight: slH, frameWidth: fw, seatDepth: sd, seatSlatCountFB: count } = params;
  const alpha = params.backAngle * Math.PI / 180;
  const cosA = Math.cos(alpha);

  // Bench tilt — pivot at backrest inner base
  const beta = (params.benchAngle ?? 0) * Math.PI / 180;
  const tanB = Math.tan(beta);
  const sinB = Math.sin(beta);
  const cosB = Math.cos(beta);
  const yPivot = fw / cosA;

  // Boundaries: left side frame at fw/2, right side frame at sW-fw/2
  const xStart = fw / 2;
  const xEnd = sW - fw / 2;
  const spacing = (xEnd - xStart) / (count + 1);
  const yStart = params.benchStart;  // offset from backrest
  const yEnd = sd;     // front edge (flush with side frame front)

  const pieces: ChairPiece[] = [];
  for (let i = 1; i <= count; i++) {
    const x = xStart + i * spacing;

    // Build outline: round 4 structural corners with true edge vectors,
    // stitch subdivision points between them.
    const R = params.cornerRadius;
    const botBack: [number, number] = [yStart + slH * sinB, sH + (yStart - yPivot) * tanB - slH * cosB];
    const botFront: [number, number] = [yEnd + slH * sinB, sH + (yEnd - yPivot) * tanB - slH * cosB];
    const topFront: [number, number] = [yEnd, sH + (yEnd - yPivot) * tanB - seatDepression(x, yEnd, params)];
    const topBack: [number, number] = [yStart, sH + (yStart - yPivot) * tanB - seatDepression(x, yStart, params)];

    // Nearest contour subdivision points for tangent-correct top corner rounding
    const yNearFront = yStart + (yEnd - yStart) * (SEAT_SEGMENTS - 1) / SEAT_SEGMENTS;
    const yNearBack = yStart + (yEnd - yStart) / SEAT_SEGMENTS;
    const contourNearFront: [number, number] = [yNearFront, sH + (yNearFront - yPivot) * tanB - seatDepression(x, yNearFront, params)];
    const contourNearBack: [number, number] = [yNearBack, sH + (yNearBack - yPivot) * tanB - seatDepression(x, yNearBack, params)];

    // Bottom edge tangent distance (90° corners, tanDist = R)
    const botEdgeLen = Math.sqrt((botFront[0] - botBack[0]) ** 2 + (botFront[1] - botBack[1]) ** 2);
    const topEdgeLen = Math.sqrt((topFront[0] - topBack[0]) ** 2 + (topFront[1] - topBack[1]) ** 2);
    // Compute tangent distance for top corners to filter interior points
    const fbTopAngle = Math.acos(Math.max(-1, Math.min(1,
      ((botFront[0] - topFront[0]) * (contourNearFront[0] - topFront[0]) + (botFront[1] - topFront[1]) * (contourNearFront[1] - topFront[1])) /
      (Math.sqrt((botFront[0]-topFront[0])**2+(botFront[1]-topFront[1])**2) * Math.sqrt((contourNearFront[0]-topFront[0])**2+(contourNearFront[1]-topFront[1])**2)))));
    const fbTopTanDist = Math.min(R / Math.tan(fbTopAngle / 2), topEdgeLen / 2);
    // Y boundaries for filtering (top edge goes front→back, so yy decreases)
    const topYMin = topBack[0] + fbTopTanDist;
    const topYMax = topFront[0] - fbTopTanDist;
    // Bottom edge: 90° corners, tanDist = R
    const botTanDist = Math.min(R, botEdgeLen / 2);

    const rounded: [number, number][] = [];
    rounded.push(...roundCorner2D(topBack, botBack, botFront, R)); // back-bottom
    for (let j = 1; j < SEAT_SEGMENTS; j++) {                     // bottom interior
      const yy = yStart + (yEnd - yStart) * j / SEAT_SEGMENTS;
      const botX = yy + slH * sinB;
      if (botX <= botBack[0] + botTanDist || botX >= botFront[0] - botTanDist) continue;
      rounded.push([botX, sH + (yy - yPivot) * tanB - slH * cosB]);
    }
    rounded.push(...roundCorner2D(botBack, botFront, topFront, R)); // front-bottom
    rounded.push(...roundCorner2D(botFront, topFront, contourNearFront, R, undefined, topEdgeLen)); // front-top
    for (let j = SEAT_SEGMENTS - 1; j >= 1; j--) {                // top interior
      const yy = yStart + (yEnd - yStart) * j / SEAT_SEGMENTS;
      if (yy > topYMax || yy < topYMin) continue;
      rounded.push([yy, sH + (yy - yPivot) * tanB - seatDepression(x, yy, params)]);
    }
    rounded.push(...roundCorner2D(contourNearBack, topBack, botBack, R, topEdgeLen)); // back-top
    pieces.push({ type: 'seatSlatFB', outline: rounded.map(([y, z]) => p3(x, y, z)) });
  }
  return pieces;
}

// ---------------------------------------------------------------------------
// Backrest slats (×N) — rectangles spanning chair width, tilted to be
// perpendicular to the backrest surface.
//
// Each slat's "height" (slH) runs along the backrest normal direction,
// NOT vertical. The backrest surface direction in YZ is (-sinA, cosA);
// the outward normal is (cosA, sinA).
//
// Slats are defined as 2D rectangles in a local (x, normalDist) space:
//   x:  0 to sW (chair width)
//   nd: -slH/2 to +slH/2 (perpendicular to backrest)
//
// 3D mapping from (x, nd):
//   x → x
//   y → yCenter + nd · cosA    (normal has y-component cosA)
//   z → zCenter + nd · sinA    (normal has z-component sinA)
//
// where (yCenter, zCenter) is the backrest center at distance d along the
// backrest from the seat:
//   yCenter = -d · sinA + fw/2
//   zCenter = sH + d · cosA
//
// Distribution: 3" air gap from seat, then evenly from dStart to dEnd.
//   dStart = 3 + slH/2 (first slat center, 3" above seat)
//   dEnd   = bH - slH/2 (last slat center, flush with backrest top)
//
// Ergonomic curve: each slat is parabolically bent along its width into a
// concave U-shape. The center bulges toward the sitter by CURVE_DEPTH;
// the left and right edges stay flat where they intersect the side frames
// (x = fw/2 and x = sW−fw/2), keeping the joints aligned.
//   t = 2·(x−xLeft)/xSpan − 1  (−1 at left frame, 0 at center, +1 at right)
//   ndOffset = CURVE_DEPTH · (1 − t²)
// Portions outside the side frames receive no offset.
// Long edges are subdivided into CURVE_SEGMENTS segments for smoothness.
// ---------------------------------------------------------------------------
function generateBackSlats(params: ChairParams): ChairPiece[] {
  const { seatWidth: sW, seatHeight: sH, backHeight: bH, slatHeight: slH, frameWidth: fw, backSlatCount: count, backStart } = params;
  const alpha = params.backAngle * Math.PI / 180;
  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const halfH = slH / 2;

  const CURVE_SEGMENTS = 48;  // subdivisions along each long edge

  const R = params.cornerRadius;

  // Curve transition + fade boundary points — included as vertices for accurate shape
  const xLeft = fw / 2 + params.thickness;
  const xRight = sW - fw / 2 - params.thickness;
  const rBlendOuter = Math.max(R, 0.01);
  const xLeftFade = xLeft - rBlendOuter;
  const xRightFade = xRight + rBlendOuter;

  // Build x-positions for long edges: evenly spaced + transition/fade points
  const xPositions: number[] = [];
  for (let j = 1; j < CURVE_SEGMENTS; j++) {
    xPositions.push(sW * j / CURVE_SEGMENTS);
  }
  for (const xp of [xLeft, xRight, xLeftFade, xRightFade]) {
    if (xp > 0 && xp < sW && !xPositions.some(v => Math.abs(v - xp) < 0.01)) {
      xPositions.push(xp);
    }
  }
  xPositions.sort((a, b) => a - b);

  // Build outline with structural corners and subdivided edges
  const bl: [number, number] = [0, -halfH];
  const brr: [number, number] = [sW, -halfH];
  const trr: [number, number] = [sW, halfH];
  const tll: [number, number] = [0, halfH];

  // For 90° corners, tangent distance = R. Filter edge points inside arc zones.
  const xMin = R;         // bottom-left and top-left arc tangent zone
  const xMax = sW - R;    // bottom-right and top-right arc tangent zone

  const rounded: [number, number][] = [];
  rounded.push(...roundCorner2D(tll, bl, brr, R));    // bottom-left
  for (const xp of xPositions) {                       // bottom interior
    if (xp > xMin && xp < xMax) rounded.push([xp, -halfH]);
  }
  rounded.push(...roundCorner2D(bl, brr, trr, R));    // bottom-right
  rounded.push(...roundCorner2D(brr, trr, tll, R));   // top-right
  for (let j = xPositions.length - 1; j >= 0; j--) {  // top interior (reversed)
    if (xPositions[j] > xMin && xPositions[j] < xMax) rounded.push([xPositions[j], halfH]);
  }
  rounded.push(...roundCorner2D(trr, tll, bl, R));    // top-left

  const pieces: ChairPiece[] = [];
  for (let i = 0; i < count; i++) {
    const dStart = backStart + slH / 2;
    const dEnd = bH - slH / 2;
    const d = count === 1 ? (dStart + dEnd) / 2 : dStart + (i / (count - 1)) * (dEnd - dStart);

    const yCenter = -d * sinA + fw / (2 * cosA);
    const zCenter = sH + d * cosA;

    pieces.push({
      type: 'backSlat',
      outline: rounded.map(([x, nd]) => {
        // Parabolic bend: only the front face (toward sitter) curves.
        // Back face stays straight. ndFactor interpolates: 0 at back, 1 at front.
        // Extend curve zone by cornerRadius so there's non-zero curvature at the
        // original boundary, then smoothstep fades it to zero over that extension.
        const rBlend = Math.max(params.cornerRadius, 0.01);
        const xLF = xLeft - rBlend;
        const xRF = xRight + rBlend;
        const xFS = xRF - xLF;
        let ndOffset = 0;
        if (x > xLF && x < xRF) {
          const t = 2 * (x - xLF) / xFS - 1;
          const ndFactor = (nd + halfH) / (2 * halfH);
          const rampL = smoothstep(Math.min((x - xLF) / rBlend, 1));
          const rampR = smoothstep(Math.min((xRF - x) / rBlend, 1));
          ndOffset = -params.backCurve * (1 - t * t) * rampL * rampR * ndFactor;
        }
        const ndCurved = nd + ndOffset;
        return p3(x, yCenter + ndCurved * cosA, zCenter + ndCurved * sinA);
      }),
    });
  }

  return pieces;
}


// ---------------------------------------------------------------------------
// generateChairGeometry — main entry point. Assembles all pieces, optionally
// centers the entire chair at the origin (for design page orbit camera).
//
// When center=true (design page), subtracts the bounding box midpoint from
// all points so the chair orbits around its visual center.
// When center=false (animation page), geometry stays at origin corner.
// ---------------------------------------------------------------------------
export function generateChairGeometry(
  params: ChairParams,
  center = true
): ChairGeometry {
  const pieces: ChairPiece[] = [
    ...generateSideFrames(params),
    generateFrontCrosspiece(params),
    generateRearCrosspiece(params),
    ...generateSeatSlatsLR(params),
    ...generateSeatSlatsFB(params),
    ...generateBackSlats(params),
  ];

  if (center) {
    // Compute bounding box of all points across all pieces
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const piece of pieces) {
      for (const pt of piece.outline) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
        if (pt.z < minZ) minZ = pt.z;
        if (pt.z > maxZ) maxZ = pt.z;
      }
    }

    // Shift all points so the bounding box center is at the origin
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;

    const shift = (pt: Point3D) => p3(pt.x - cx, pt.y - cy, pt.z - cz);
    for (const piece of pieces) {
      piece.outline = piece.outline.map(shift);
      if (piece.holes) {
        piece.holes = piece.holes.map(hole => hole.map(shift));
      }
    }
  }

  return { pieces };
}
