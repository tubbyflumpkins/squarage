/**
 * Where the flat Warped shelf's pieces sit — the single source of truth for the
 * generator (`ShelfVisualizer/geometry.ts`) and the render's visual slots
 * (`RenderedShelfView/slotGeometry.ts`).
 *
 * Synced from labs (`src/lib/warped/shelfLayout.ts`) minus the production-only
 * helpers (tenon spans, mortise relief): labs cuts the parts, this site only draws them.
 *
 * The standard shelf spreads its shelves between `shelfOffset` and
 * `height - shelfOffset`, slotted into columns that run the full height.
 *
 * The console is that same shelf with its top shelf turned into a surface: the
 * first and last columns are untouched — they run the full height and the top
 * slots into them, so the overhang above the top mirrors the feet below — while
 * every column in between stops at the top's underside and holds it with two
 * tenons seated in blind mortises half the ply deep (not drawn: the top always
 * covers them). With two columns or fewer there is nothing in between, and the
 * console is the standard shelf.
 *
 * With exactly three shelves the middle one can be moved off centre
 * (`middleShelfShift`), trading height between the opening below it and the one
 * above. The outer two never move. Everything downstream follows because it
 * reads `shelfZ` from here: the shelf's wave is evaluated at its new height and
 * the columns' slots are cut there. Only shared design links (/custom/[token]) set it:
 * the public Shelf Builder has no control for it.
 */

/** Ply thickness the 3D render draws every piece at. */
export const NOMINAL_PLY = 0.5;

/** Closest the moved middle shelf may come to either neighbour, centre to centre. */
export const MIN_SHELF_GAP = 4;

export interface ShelfLayoutInput {
  width: number;
  height: number;
  shelfCount: number;
  columnCount: number;
  shelfOffset?: number;
  columnOffset?: number;
  consoleTop?: boolean;
  /** Inches the middle of THREE shelves sits above centre (negative = below). Ignored at any other shelf count. */
  middleShelfShift?: number;
}

export interface ShelfLayoutColumn {
  x: number;
  /** Where the column ends: the overall height, or the underside of the console's top. */
  topZ: number;
  /** A console column between the first and the last: it stops under the top and tenons into it instead of taking a slot. */
  underTop: boolean;
}

export interface ShelfLayout {
  /** Shelf centre heights, bottom to top. */
  shelfZ: number[];
  /** Index in `shelfZ` of the console's top; null on the standard shelf. */
  topIndex: number | null;
  /** One entry per column, left to right. */
  columns: ShelfLayoutColumn[];
}

/**
 * How far the middle shelf may move either way: up to `MIN_SHELF_GAP` from a neighbour.
 * 0 whenever the shift does not apply (anything but three shelves).
 */
export function middleShelfShiftLimit(p: ShelfLayoutInput): number {
  if (p.shelfCount !== 3) return 0;
  const evenSpacing = (p.height - 2 * (p.shelfOffset ?? 0)) / 2;
  return Math.max(0, evenSpacing - MIN_SHELF_GAP);
}

/** The shift actually applied: the asked-for one held inside its limit, 0 where it does not apply. */
export function resolveMiddleShelfShift(p: ShelfLayoutInput): number {
  const limit = middleShelfShiftLimit(p);
  const shift = p.middleShelfShift ?? 0;
  return Number.isFinite(shift) ? Math.max(-limit, Math.min(limit, shift)) : 0;
}

export function shelfLayout(p: ShelfLayoutInput, thickness: number = NOMINAL_PLY): ShelfLayout {
  const { height, shelfCount, shelfOffset = 0, consoleTop = false } = p;
  const startZ = shelfOffset;
  const endZ = height - shelfOffset;
  const shelfZ: number[] = [];
  for (let i = 0; i < shelfCount; i++) {
    const t = shelfCount > 1 ? i / (shelfCount - 1) : 0.5;
    shelfZ.push(startZ + t * (endZ - startZ));
  }
  const shift = resolveMiddleShelfShift(p);
  if (shift !== 0) shelfZ[1] += shift;
  const topIndex = consoleTop && shelfCount > 0 ? shelfCount - 1 : null;
  const xs = columnXPositions(p);
  const columns = xs.map((x, i) => {
    const underTop = topIndex !== null && i > 0 && i < xs.length - 1;
    return { x, topZ: underTop ? Math.max(0, shelfZ[topIndex as number] - thickness / 2) : height, underTop };
  });
  return { shelfZ, topIndex, columns };
}

export function columnXPositions(p: ShelfLayoutInput): number[] {
  const { width, columnCount, columnOffset = 0 } = p;
  const positions: number[] = [];
  const startX = columnOffset;
  const endX = width - columnOffset;
  for (let i = 0; i < columnCount; i++) {
    const t = columnCount > 1 ? i / (columnCount - 1) : 0.5;
    positions.push(startX + t * (endX - startX));
  }
  return positions;
}

/** Column positions the shelf at `shelfIndex` takes a slot for: all of them, except the console's top, which only slots into the first and last. */
export function slottedColumnXs(layout: ShelfLayout, shelfIndex: number): number[] {
  return layout.columns.filter((c) => shelfIndex !== layout.topIndex || !c.underTop).map((c) => c.x);
}

/** Shelf heights the column at `columnIndex` takes a slot for: all of them, except the console's top on the columns that stop under it. */
export function slottedShelfZs(layout: ShelfLayout, columnIndex: number): number[] {
  const underTop = layout.columns[columnIndex]?.underTop ?? false;
  return layout.shelfZ.filter((_, i) => !underTop || i !== layout.topIndex);
}

/** Centre-to-centre shelf spacing, the design page's "Shelf Height". With a moved middle shelf this is the bottom opening: see `shelfSpacings`. */
export function shelfSpacing(p: ShelfLayoutInput): number {
  const { shelfZ } = shelfLayout(p);
  return shelfZ.length > 1 ? shelfZ[1] - shelfZ[0] : 0;
}

/** Every opening, centre to centre, bottom to top. All equal unless the middle shelf has been moved. */
export function shelfSpacings(p: ShelfLayoutInput): number[] {
  const { shelfZ } = shelfLayout(p);
  return shelfZ.slice(1).map((z, i) => z - shelfZ[i]);
}

/** Height of the console's top face — the usable surface — at the given ply; null off the console. */
export function consoleSurfaceHeight(p: ShelfLayoutInput, thickness: number = NOMINAL_PLY): number | null {
  const { shelfZ, topIndex } = shelfLayout(p, thickness);
  return topIndex === null ? null : shelfZ[topIndex] + thickness / 2;
}
