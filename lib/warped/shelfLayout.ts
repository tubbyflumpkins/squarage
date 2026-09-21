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
 */

/** Ply thickness the 3D render draws every piece at. */
export const NOMINAL_PLY = 0.5;

export interface ShelfLayoutInput {
  width: number;
  height: number;
  shelfCount: number;
  columnCount: number;
  shelfOffset?: number;
  columnOffset?: number;
  consoleTop?: boolean;
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

export function shelfLayout(p: ShelfLayoutInput, thickness: number = NOMINAL_PLY): ShelfLayout {
  const { height, shelfCount, shelfOffset = 0, consoleTop = false } = p;
  const startZ = shelfOffset;
  const endZ = height - shelfOffset;
  const shelfZ: number[] = [];
  for (let i = 0; i < shelfCount; i++) {
    const t = shelfCount > 1 ? i / (shelfCount - 1) : 0.5;
    shelfZ.push(startZ + t * (endZ - startZ));
  }
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

/** Centre-to-centre shelf spacing, the design page's "Shelf Height". */
export function shelfSpacing(p: ShelfLayoutInput): number {
  const { shelfZ } = shelfLayout(p);
  return shelfZ.length > 1 ? shelfZ[1] - shelfZ[0] : 0;
}

/** Height of the console's top face — the usable surface — at the given ply; null off the console. */
export function consoleSurfaceHeight(p: ShelfLayoutInput, thickness: number = NOMINAL_PLY): number | null {
  const { shelfZ, topIndex } = shelfLayout(p, thickness);
  return topIndex === null ? null : shelfZ[topIndex] + thickness / 2;
}
