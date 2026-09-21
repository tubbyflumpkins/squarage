import { generateShelfGeometry, projectGeometryWithRotation, calculateBounds, pointsToPath } from '@/components/shelf/ShelfVisualizer/geometry';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';

/**
 * Wireframe thumbnail of a flat Warped shelf from the TypeScript geometry: labs' flat
 * branch of `getSvgPreview`. The designer's thumbnails otherwise come from the WASM
 * projection, which does not know the console (inner columns stopping under the top),
 * so console designs are drawn here.
 */
export function flatSvgPreview(params: ShelfParams, rotation: number, tilt: number): string {
  const sw = '0.4';
  const stroke = '#2C2C2C';
  const r = (n: number) => +n.toFixed(1);
  const line = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    `<line x1="${r(a.x)}" y1="${r(a.y)}" x2="${r(b.x)}" y2="${r(b.y)}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const path = (d: string) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;

  const proj = projectGeometryWithRotation(generateShelfGeometry(params), rotation, params.width, params.depth, tilt);
  const bounds = calculateBounds(proj);
  const pad = 6;
  const vb = `${bounds.minX - pad} ${bounds.minY - pad} ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`;
  let paths = '';
  proj.shelves.forEach((s) => {
    paths += path(pointsToPath(s.frontEdge)) + path(pointsToPath(s.backEdge));
    paths += line(s.leftSide[0], s.leftSide[1]) + line(s.rightSide[0], s.rightSide[1]);
  });
  proj.columns.forEach((c) => {
    paths += path(pointsToPath(c.frontEdge)) + path(pointsToPath(c.backEdge));
    paths += line(c.topSide[0], c.topSide[1]) + line(c.bottomSide[0], c.bottomSide[1]);
  });
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">${paths}</svg>`;
}
