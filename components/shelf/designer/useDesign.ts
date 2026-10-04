'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import type { ShelfVariant } from '@/stores/useSavedDesigns';
import { computeAmplitude, computeColumnAngle, computeColumnOffset, computeShelfOffset } from '@/lib/warped/derivedParams';
import { consoleSurfaceHeight } from '@/lib/warped/shelfLayout';
import { SHELF_STYLES, SHELF_STYLE_IDS, autoShelfCount, evenOpening, isShelfStyle, minHeightForStyle, type ShelfStyle } from '@/lib/warped/shelfStyles';
import { autoColumnCount } from '@/lib/warped/autoColumns';

export type WoodFinish = 'Walnut' | 'Oak' | 'Birch';
export type DimUnit = 'in' | 'cm';

/** What the customer sets. Everything else about the shelf is worked out from these. */
export interface Design {
  shape: ShelfVariant;
  width: number;
  height: number;
  depth: number;
  /** Corner only: the second wall. Carried on every design so a switch to Corner has a value. */
  length: number;
  shelfCount: number;
  columnCount: number;
  roundLeft: boolean;
  roundRight: boolean;
  /**
   * What the shelf is for. It sets the shelf count from the height (labs' shelfStyles), so the
   * openings suit the contents: the designer has no shelf counter. Null only on a design saved
   * before styles whose shelves suit none of them; it keeps its count until a style is picked.
   */
  style: ShelfStyle | null;
  /**
   * The column count follows the shelf's size (labs' autoColumns): the designer has no column
   * counter either. Off only on a saved design whose count its size would not give, until it
   * is resized.
   */
  autoColumns: boolean;
}

/**
 * Where each shape starts, with what it is for: a tall standard shelf of large books, a record
 * console, a low corner shelf of small books. The shelf counts are the ones their styles give,
 * the column counts the ones their sizes give.
 */
const SHAPE_DEFAULTS: Record<ShelfVariant, Design> = {
  standard: {
    shape: 'standard', width: 74, height: 75, depth: 12, length: 36,
    shelfCount: 6, columnCount: 6, roundLeft: false, roundRight: false, style: 'largeBooks', autoColumns: true,
  },
  console: {
    shape: 'console', width: 48, height: 32, depth: 14, length: 36,
    shelfCount: 3, columnCount: 4, roundLeft: false, roundRight: false, style: 'vinyl', autoColumns: true,
  },
  corner: {
    shape: 'corner', width: 45, height: 24, depth: 10, length: 36,
    shelfCount: 3, columnCount: 4, roundLeft: false, roundRight: false, style: 'smallBooks', autoColumns: true,
  },
};

/** The page opens on this. */
export const DEFAULT_DESIGN: Design = SHAPE_DEFAULTS.standard;

/** The column count a design's size gives it (labs' rule: the same file, so both agree). */
const columnsFor = (d: Design) => autoColumnCount(d.shape === 'corner', d.width, d.length);

/** Hold a design on automatic columns to the count its size gives. */
function applyColumns(d: Design): Design {
  if (!d.autoColumns) return d;
  const columnCount = columnsFor(d);
  return columnCount === d.columnCount ? d : { ...d, columnCount };
}

/**
 * Hold a styled design to its style: tall enough for one opening of it, and the shelf count
 * the style gives that height. `picked` is the moment the style was chosen, the one time it
 * also deepens the shelf for what it holds; after that the depth is the customer's again.
 */
function applyStyle(d: Design, picked: boolean): Design {
  if (!d.style) return d;
  const r = rangesFor(d.shape);
  const offsetAt = (height: number) => computeShelfOffset(d.shape, height);
  let { height, depth } = d;

  const least = minHeightForStyle(d.style, offsetAt, r.height.min, r.height.max);
  if (least !== null && height < least) height = least;
  const wanted = SHELF_STYLES[d.style].depth;
  if (picked && wanted && depth < wanted && wanted <= r.depth.max) depth = wanted;

  const shelfCount = autoShelfCount(d.style, height, offsetAt(height));
  return { ...d, height, depth, shelfCount };
}

export interface Range { min: number; max: number }

/** Limits per shape. Height and depth are labs' warpedShelfRanges; the console runs lower and deeper. */
export function rangesFor(shape: ShelfVariant): Record<'width' | 'length' | 'height' | 'depth' | 'shelfCount' | 'columnCount', Range> {
  return {
    width: { min: shape === 'corner' ? 10 : 24, max: 76 },
    length: { min: 10, max: 76 },
    height: { min: shape === 'console' ? 16 : 24, max: shape === 'corner' ? 96 : 76 },
    depth: { min: 8, max: shape === 'console' ? 20 : 14 },
    shelfCount: { min: 2, max: 8 },
    columnCount: { min: shape === 'corner' ? 3 : 2, max: 8 },
  };
}

const clamp = (v: number, { min, max }: Range) => Math.max(min, Math.min(max, v));

/** Hold every number inside its shape's limits: a design can arrive from a preset, a save or another shape. */
export function fitToRanges(d: Design): Design {
  const r = rangesFor(d.shape);
  return {
    ...d,
    width: clamp(d.width, r.width),
    length: clamp(d.length, r.length),
    height: clamp(d.height, r.height),
    depth: clamp(d.depth, r.depth),
    shelfCount: clamp(Math.round(d.shelfCount), r.shelfCount),
    columnCount: clamp(Math.round(d.columnCount), r.columnCount),
    // A corner shelf runs wall to wall: it has no free end to round
    roundLeft: d.shape === 'corner' ? false : d.roundLeft,
    roundRight: d.shape === 'corner' ? false : d.roundRight,
  };
}

/** A saved design or preset → a design. Designs saved before the console existed carry no variant. */
export function designFromSaved(shelfType: 'flat' | 'corner', variant: ShelfVariant | undefined, lp: Record<string, number | boolean | string>): Design {
  const num = (key: keyof Design) => (typeof lp[key] === 'number' ? (lp[key] as number) : (DEFAULT_DESIGN[key] as number));
  const design = fitToRanges({
    shape: shelfType === 'corner' ? 'corner' : variant === 'console' ? 'console' : 'standard',
    width: num('width'), height: num('height'), depth: num('depth'), length: num('length'),
    shelfCount: num('shelfCount'), columnCount: num('columnCount'),
    roundLeft: lp.roundLeft === true, roundRight: lp.roundRight === true,
    style: isShelfStyle(lp.shelfStyle) ? lp.shelfStyle : null,
    autoColumns: false,
  });
  // Opening a design never changes it. One saved before styles takes a style that would leave
  // its height and shelves exactly as they are, so it then resizes like any other: the style
  // its openings are in range for, or failing that the first that keeps them.
  const keeps = SHELF_STYLE_IDS.filter((id) => {
    const held = applyStyle({ ...design, style: id }, false);
    return held.height === design.height && held.shelfCount === design.shelfCount;
  });
  const opening = evenOpening(design.height, computeShelfOffset(design.shape, design.height), design.shelfCount);
  const style = design.style
    ?? keeps.find((id) => opening >= SHELF_STYLES[id].min && opening <= SHELF_STYLES[id].max)
    ?? keeps[0]
    ?? null;
  // Its columns follow its size if they already are the count the size gives. Any other count
  // stays until the shelf is resized.
  return { ...design, style, autoColumns: design.columnCount === columnsFor(design) };
}

/** Camera sweep per shape: where it opens and the two angles it turns between, so the back never shows. */
export const cameraFor = (shape: ShelfVariant) =>
  shape === 'corner'
    ? { initialRotationDeg: 15, minAngleDeg: -30, maxAngleDeg: 20 }
    : { initialRotationDeg: 350, minAngleDeg: -85, maxAngleDeg: -10 };

export function useDesign() {
  // Through the style, so the opening count is the style's even if its range is retuned in labs
  const [design, setDesign] = useState<Design>(() => applyStyle(applyColumns(fitToRanges(DEFAULT_DESIGN)), false));
  const [finish, setFinish] = useState<WoodFinish>('Oak');
  const [unit, setUnit] = useState<DimUnit>('in');

  // Every change goes through here: inside its limits, then held to its size's columns and its
  // style's shelves. The ref is the
  // design as of the last change, so two changes in one event (a corner's dot sizes width and
  // length together) build on each other.
  const current = useRef(design);
  const commit = useCallback((next: Design, picked = false) => {
    const resolved = applyStyle(applyColumns(fitToRanges(next)), picked);
    current.current = resolved;
    setDesign(resolved);
  }, []);

  const set = useCallback(<K extends keyof Design>(key: K, value: Design[K]) => {
    // Resizing a shelf re-fits its columns, whatever count it was saved with
    const resized = key === 'width' || key === 'length';
    commit({ ...current.current, [key]: value, ...(resized ? { autoColumns: true } : {}) });
  }, [commit]);

  const setStyle = useCallback((style: ShelfStyle) => {
    commit({ ...current.current, style }, true);
  }, [commit]);

  const setShape = useCallback((shape: ShelfVariant) => {
    // Each shape has its own proportions and its own use, so picking one loads its start
    if (shape !== current.current.shape) commit(SHAPE_DEFAULTS[shape]);
  }, [commit]);

  const load = useCallback((next: Design) => commit(next), [commit]);

  const derived = useMemo(() => {
    const { shape, width, height, depth, length, shelfCount, columnCount, roundLeft, roundRight } = design;
    const isCorner = shape === 'corner';
    const isConsole = shape === 'console';
    // labs' formulas (lib/warped/derivedParams): the numbers the shelf is cut with
    const amplitude = computeAmplitude(shape, height);
    const shelfOffset = computeShelfOffset(shape, height);
    const columnOffset = computeColumnOffset(shape, width, length);
    const columnAngle = computeColumnAngle(width, length);

    const flatParams: ShelfParams = {
      width, height, depth, length, amplitude, shelfCount, columnCount,
      shelfOffset, columnOffset, roundLeft, roundRight, consoleTop: isConsole,
    };
    const cornerParams: CornerShelfParams = {
      width, length, depth, height, amplitude, shelfCount, columnCount,
      shelfOffset, columnOffset, columnAngle, wallAlign: 1,
    };

    // The console's end columns rise past its top, so the usable surface sits below the overall height
    const surfaceHeight = isConsole ? consoleSurfaceHeight(flatParams) : null;

    return { isCorner, isConsole, amplitude, shelfOffset, columnOffset, columnAngle, flatParams, cornerParams, surfaceHeight };
  }, [design]);

  const inCm = unit === 'cm';
  /** A length as the customer reads it, in their unit. */
  const fmtLen = useCallback(
    (inches: number) => (inCm ? `${Math.round(inches * 2.54)} cm` : `${+inches.toFixed(1)}"`),
    [inCm],
  );

  return { design, set, setShape, setStyle, load, finish, setFinish, unit, setUnit, inCm, fmtLen, ...derived };
}
