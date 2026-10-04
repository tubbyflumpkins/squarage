import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import { flatSvgPreview } from '@/lib/warped/flatSvgPreview';
import { generateSvgProjection, isWasmReady } from '@/lib/shelfGeometryWasm';
import type { Design } from './useDesign';

/**
 * The wireframe thumbnail a saved design carries. Flat shelves (standard and console) are
 * drawn from the TypeScript geometry, which follows the real shelf layout. The corner shelf
 * has no TypeScript projection, so it comes from the WASM one; that still works its wave and
 * overhang out with its own older formulas, a difference too small to see at tile size.
 */
export function designSvgPreview(design: Design, flatParams: ShelfParams, rotation: number, tilt: number): string {
  if (design.shape !== 'corner') return flatSvgPreview(flatParams, rotation, tilt);
  if (!isWasmReady()) return '';

  const sw = '0.4';
  const stroke = '#2C2C2C';
  const path = (d: string) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
  const line = (pts: number[], offset: number) =>
    `<line x1="${pts[offset]}" y1="${pts[offset + 1]}" x2="${pts[offset + 2]}" y2="${pts[offset + 3]}" stroke="${stroke}" stroke-width="${sw}"/>`;

  const result = generateSvgProjection({
    isCorner: true,
    width: design.width, height: design.height, depth: design.depth, length: design.length,
    shelfCount: design.shelfCount, columnCount: design.columnCount,
    roundLeft: false, roundRight: false,
    rotation, tilt,
  });
  if (result.type !== 'corner') return '';

  const b = result.bounds;
  const pad = 6;
  const vb = `${b.minX - pad} ${b.minY - pad} ${b.maxX - b.minX + pad * 2} ${b.maxY - b.minY + pad * 2}`;
  let paths = '';
  result.shelves.forEach((s) => {
    paths += path(s.frontPath) + path(s.backXPath) + path(s.backYPath);
    paths += line(s.widthSide, 0) + line(s.lengthSide, 0);
  });
  result.columns.forEach((c) => {
    paths += path(c.frontPath) + path(c.backPath);
    paths += line(c.sidePoints, 0) + line(c.sidePoints, 4);
  });
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">${paths}</svg>`;
}
