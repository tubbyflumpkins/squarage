/**
 * What stands upright between two shelves: the plain-words line the designer shows with its
 * Shelf Opening. This site's own file (labs has no equivalent).
 *
 * The line speaks to height. Depth only comes up for records, as their own size: a Warped
 * shelf's front edge waves in and out around its nominal depth, so "fits" by depth is not one
 * number to promise.
 */

/** A 12 in LP jacket is 12.375 in square; record shelving runs 12 5/8 to 13 1/4 in clear. */
export const RECORD_OPENING = 13;
/** The depth a record sits fully on. */
export const RECORD_DEPTH = 13;

const RECORD_JACKET = 12.375;
/** Below this not even a mass-market paperback (about 7 in) stands up. */
const MIN_BOOK_OPENING = 7.5;
/** Room to get a book in and out. */
const BOOK_CLEARANCE = 0.5;

export function shelfFitLine(opening: number, depth: number, inCm = false): string {
  if (opening >= RECORD_OPENING) {
    if (depth >= RECORD_DEPTH) return 'Tall enough for 12 in records.';
    const jacket = inCm ? `${(RECORD_JACKET * 2.54).toFixed(1)} cm` : `${RECORD_JACKET.toFixed(1)} in`;
    return `Tall enough for 12 in records. They are ${jacket} deep.`;
  }
  if (opening < MIN_BOOK_OPENING) return 'Too tight for most books.';
  const tallest = opening - BOOK_CLEARANCE;
  return inCm
    ? `Fits books up to ${Math.floor(tallest * 2.54)} cm tall.`
    : `Fits books up to ${Math.floor(tallest * 2) / 2} in tall.`;
}
