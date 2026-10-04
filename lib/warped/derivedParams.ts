/**
 * The values a Warped shelf works out from its size: wave depth, the overhang above and below
 * the outer shelves, how far the end columns sit in, and a corner's column angle.
 *
 * Synced from labs (`src/lib/designParams.ts`, the four `compute*` functions, verbatim). labs
 * cuts the parts, so these are the numbers a customer's design is built with: never edit them
 * here. The WASM module has its own, older formulas (different ranges above 24 in); only the
 * classic designer still renders from those.
 */

/** labs' type lists every product it makes; this site only needs the three shelf shapes. */
export type FurnitureType = 'standard' | 'corner' | 'console';

export function computeAmplitude(furnitureType: FurnitureType, height: number): number {
  const isCorner = furnitureType === 'corner';
  const minH = 24, maxH = isCorner ? 96 : 76;
  const minAmp = isCorner ? 1 : 1.5, maxAmp = isCorner ? 1.5 : 2;
  const t = Math.max(0, Math.min(1, (height - minH) / (maxH - minH)));
  return minAmp + t * (maxAmp - minAmp);
}

export function computeColumnAngle(width: number, length: number): number {
  const ratio = width / length;
  const capRatio = 1.5;
  if (ratio >= 1) {
    const t = Math.min((ratio - 1) / (capRatio - 1), 1);
    return 45 + t * 15;
  } else {
    const t = Math.min((1 / ratio - 1) / (capRatio - 1), 1);
    return 45 - t * 15;
  }
}

export function computeShelfOffset(furnitureType: FurnitureType, height: number): number {
  if (furnitureType === 'corner') {
    const t = Math.max(0, Math.min(1, (height - 24) / (96 - 24)));
    return 2 + t * 4;
  }
  const t = Math.max(0, Math.min(1, (height - 24) / (96 - 24)));
  return 2 + t * 4;
}

export function computeColumnOffset(furnitureType: FurnitureType, width: number, length: number): number {
  if (furnitureType === 'corner') {
    const dim = Math.max(width, length);
    const t = Math.max(0, Math.min(1, (dim - 24) / (96 - 24)));
    return 4 + t * 4;
  }
  const t = Math.max(0, Math.min(1, (width - 24) / (96 - 24)));
  return 2 + t * 4;
}
