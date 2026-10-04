'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import type { ShelfVariant } from '@/stores/useSavedDesigns';
import { computeAmplitude, computeColumnAngle, computeColumnOffset, computeShelfOffset } from '@/lib/warped/derivedParams';
import { consoleSurfaceHeight, shelfSpacing, NOMINAL_PLY } from '@/lib/warped/shelfLayout';
import { SHELF_STYLES, autoShelfCount, isShelfStyle, minHeightForStyle, type ShelfStyle } from '@/lib/warped/shelfStyles';

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
   * What the shelf is for. While one is set the shelf count is not the customer's to choose:
   * it is worked out from the height (labs' shelfStyles), so the openings suit the contents.
   */
  style: ShelfStyle | null;
}

/**
 * Where each shape starts, with what it is for: a tall standard shelf of large books, a record
 * console, a low corner shelf of small books. The shelf counts are the ones their styles give.
 */
const SHAPE_DEFAULTS: Record<ShelfVariant, Design> = {
  standard: {
    shape: 'standard', width: 74, height: 75, depth: 12, length: 36,
    shelfCount: 6, columnCount: 6, roundLeft: false, roundRight: false, style: 'largeBooks',
  },
  console: {
    shape: 'console', width: 48, height: 32, depth: 14, length: 36,
    shelfCount: 3, columnCount: 4, roundLeft: false, roundRight: false, style: 'vinyl',
  },
  corner: {
    shape: 'corner', width: 45, height: 24, depth: 10, length: 36,
    shelfCount: 3, columnCount: 4, roundLeft: false, roundRight: false, style: 'smallBooks',
  },
};

/** The page opens on this. */
export const DEFAULT_DESIGN: Design = SHAPE_DEFAULTS.standard;

/** What a style had to change to fit, for the customer to be told. Sizes in inches. */
export interface StyleNote { height?: number; depth?: number }

/**
 * Hold a styled design to its style: tall enough for one opening of it, and the shelf count
 * the style gives that height. `picked` is the moment the style was chosen, the one time it
 * also deepens the shelf for what it holds; after that the depth is the customer's again.
 */
function applyStyle(d: Design, picked: boolean): { design: Design; note: StyleNote | null } {
  if (!d.style) return { design: d, note: null };
  const r = rangesFor(d.shape);
  const offsetAt = (height: number) => computeShelfOffset(d.shape, height);
  const note: StyleNote = {};
  let { height, depth } = d;

  const least = minHeightForStyle(d.style, offsetAt, r.height.min, r.height.max);
  if (least !== null && height < least) { height = least; note.height = least; }
  const wanted = SHELF_STYLES[d.style].depth;
  if (picked && wanted && depth < wanted && wanted <= r.depth.max) { depth = wanted; note.depth = wanted; }

  const shelfCount = autoShelfCount(d.style, height, offsetAt(height));
  return { design: { ...d, height, depth, shelfCount }, note: note.height || note.depth ? note : null };
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
  return fitToRanges({
    shape: shelfType === 'corner' ? 'corner' : variant === 'console' ? 'console' : 'standard',
    width: num('width'), height: num('height'), depth: num('depth'), length: num('length'),
    shelfCount: num('shelfCount'), columnCount: num('columnCount'),
    roundLeft: lp.roundLeft === true, roundRight: lp.roundRight === true,
    style: isShelfStyle(lp.shelfStyle) ? lp.shelfStyle : null,
  });
}

/** Camera sweep per shape: where it opens and the two angles it turns between, so the back never shows. */
export const cameraFor = (shape: ShelfVariant) =>
  shape === 'corner'
    ? { initialRotationDeg: 15, minAngleDeg: -30, maxAngleDeg: 20 }
    : { initialRotationDeg: 350, minAngleDeg: -85, maxAngleDeg: -10 };

export function useDesign() {
  // Through the style, so the opening count is the style's even if its range is retuned in labs
  const [design, setDesign] = useState<Design>(() => applyStyle(fitToRanges(DEFAULT_DESIGN), false).design);
  const [styleNote, setStyleNote] = useState<StyleNote | null>(null);
  const [finish, setFinish] = useState<WoodFinish>('Oak');
  const [unit, setUnit] = useState<DimUnit>('in');

  // Every change goes through here: inside its limits, then held to its style. The ref is the
  // design as of the last change, so two changes in one event (a corner's dot sizes width and
  // length together) build on each other.
  const current = useRef(design);
  const commit = useCallback((next: Design, picked = false) => {
    const { design: resolved, note } = applyStyle(fitToRanges(next), picked);
    current.current = resolved;
    setDesign(resolved);
    setStyleNote(note);
  }, []);

  const set = useCallback(<K extends keyof Design>(key: K, value: Design[K]) => {
    commit({ ...current.current, [key]: value });
  }, [commit]);

  const setStyle = useCallback((style: ShelfStyle | null) => {
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

    // The clear gap between two shelves: what decides whether a book or a record stands up in it
    const opening = Math.max(0, shelfSpacing(isCorner ? cornerParams : flatParams) - NOMINAL_PLY);
    // The console's end columns rise past its top, so the usable surface sits below the overall height
    const surfaceHeight = isConsole ? consoleSurfaceHeight(flatParams) : null;

    return { isCorner, isConsole, amplitude, shelfOffset, columnOffset, columnAngle, flatParams, cornerParams, opening, surfaceHeight };
  }, [design]);

  const inCm = unit === 'cm';
  /** A length as the customer reads it, in their unit. */
  const fmtLen = useCallback(
    (inches: number) => (inCm ? `${Math.round(inches * 2.54)} cm` : `${+inches.toFixed(1)}"`),
    [inCm],
  );

  return { design, set, setShape, setStyle, styleNote, load, finish, setFinish, unit, setUnit, inCm, fmtLen, ...derived };
}
