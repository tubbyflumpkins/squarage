/**
 * Automatic columns: how many columns a Warped shelf gets for its size.
 *
 * A design in this mode (`autoColumns`) has its column count worked out here, so the count
 * follows the shelf as it is made wider or narrower. Setting the count by hand leaves the mode.
 *
 * Shared with the public Shelf Builder by file copy (the squarage repo's
 * `lib/warped/autoColumns.ts`), so a customer's shelf gets the same count there and here.
 * Keep it free of anything labs-only.
 */

/** The counts the rule picks from: the Columns slider's top, and three at the least. */
export const AUTO_COLUMN_COUNT = { min: 3, max: 8 };

/**
 * A flat shelf (standard or console) has a bay for about every 15 in of width: 24 in is three
 * columns, 45 and 48 in are four, 74 in is six. The bays come out 10 to 16 in apart.
 */
export const FLAT_BAY = 15;

/**
 * A corner shelf is measured along its two walls. It has four columns on 81 in of wall
 * (45 + 36), one more for every 12 in past that, and three once it is 12 in shorter.
 */
export const CORNER_RUN = 81;
export const CORNER_STEP = 12;

const clamp = (count: number) => Math.max(AUTO_COLUMN_COUNT.min, Math.min(AUTO_COLUMN_COUNT.max, count));

/** The column count a shelf of this size gets. `length` is a corner shelf's second wall; a flat shelf ignores it. */
export function autoColumnCount(isCorner: boolean, width: number, length: number): number {
  if (!isCorner) return clamp(Math.round(width / FLAT_BAY) + 1);
  const run = width + length;
  if (run <= CORNER_RUN - CORNER_STEP) return AUTO_COLUMN_COUNT.min;
  return clamp(4 + Math.max(0, Math.floor((run - CORNER_RUN) / CORNER_STEP)));
}
