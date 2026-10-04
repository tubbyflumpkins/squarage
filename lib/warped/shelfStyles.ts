/**
 * Shelf styles: what a Warped shelf is for, as a mode for its shelf count.
 *
 * A style knows how tall its openings should be. Given a shelf's height it divides the span
 * between the outer shelves into even openings in that range and returns the shelf count that
 * does it. The shelves stay evenly spaced: a style only picks how many there are.
 *
 * Shared with the public Shelf Builder by file copy (the squarage repo's
 * `lib/warped/shelfStyles.ts`), so a customer's style resolves to the same count there and
 * here. Keep it free of anything labs-only.
 */

import { NOMINAL_PLY } from './shelfLayout';

export type ShelfStyle = 'smallBooks' | 'largeBooks' | 'vinyl';

export interface ShelfStyleSpec {
  label: string;
  /** The clear opening a row should have, shelf face to shelf face, in inches. */
  min: number;
  max: number;
  /** The shelf depth the contents sit fully on, where that is more than a shelf usually has. */
  depth?: number;
}

/** Smallest first. An LP jacket is 12.375 in square; record shelving runs 12 5/8 to 13 1/4 in clear. */
export const SHELF_STYLES: Record<ShelfStyle, ShelfStyleSpec> = {
  smallBooks: { label: 'Small books', min: 9, max: 10.5 },
  largeBooks: { label: 'Large books', min: 12, max: 13.5 },
  vinyl: { label: 'Vinyl', min: 13, max: 14.5, depth: 13 },
};

export const SHELF_STYLE_IDS = Object.keys(SHELF_STYLES) as ShelfStyle[];

export const isShelfStyle = (v: unknown): v is ShelfStyle => typeof v === 'string' && Object.prototype.hasOwnProperty.call(SHELF_STYLES, v);

/** The shelf counts a style may pick from: the Shelves slider's own range. */
export const AUTO_SHELF_COUNT = { min: 2, max: 8 };

/** The clear opening of every row when `shelfCount` shelves are spaced evenly. */
export function evenOpening(height: number, shelfOffset: number, shelfCount: number, ply: number = NOMINAL_PLY): number {
  return shelfCount > 1 ? (height - 2 * shelfOffset) / (shelfCount - 1) - ply : 0;
}

/**
 * The shelf count a style gives a shelf of this height.
 *  1. The count whose openings land inside the style's range.
 *  2. Failing that (the height falls between two counts), the most shelves that still leave
 *     every opening at least the style's minimum: the openings come out roomier than the
 *     range, never tighter.
 *  3. A shelf too short for even one such opening gets the fewest shelves.
 */
export function autoShelfCount(style: ShelfStyle, height: number, shelfOffset: number): number {
  const { min, max } = SHELF_STYLES[style];
  const middle = (min + max) / 2;
  let inRange: number | null = null;
  let roomiest = AUTO_SHELF_COUNT.min;
  for (let count = AUTO_SHELF_COUNT.min; count <= AUTO_SHELF_COUNT.max; count++) {
    const opening = evenOpening(height, shelfOffset, count);
    if (opening < min - 1e-9) break; // openings only get tighter from here
    roomiest = count;
    if (opening <= max + 1e-9 && (inRange === null || Math.abs(opening - middle) < Math.abs(evenOpening(height, shelfOffset, inRange) - middle))) {
      inRange = count;
    }
  }
  return inRange ?? roomiest;
}

/** Whether a shelf this tall can give the style even one opening of its minimum. */
export function styleFits(style: ShelfStyle, height: number, shelfOffset: number): boolean {
  return evenOpening(height, shelfOffset, AUTO_SHELF_COUNT.min) >= SHELF_STYLES[style].min - 1e-9;
}

/**
 * The shortest whole-inch height, from `from` up to `to`, at which the style fits; null when
 * none does. `offsetAt` gives the shelf offset a shelf of a given height has, since the offset
 * itself grows with height.
 */
export function minHeightForStyle(style: ShelfStyle, offsetAt: (height: number) => number, from: number, to: number): number | null {
  for (let height = Math.ceil(from); height <= to; height++) {
    if (styleFits(style, height, offsetAt(height))) return height;
  }
  return null;
}
