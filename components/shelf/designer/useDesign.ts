'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import type { ShelfVariant } from '@/stores/useSavedDesigns';
import { computeAmplitude, computeColumnAngle, computeColumnOffset, computeShelfOffset } from '@/lib/warped/derivedParams';
import { consoleSurfaceHeight, shelfSpacing, NOMINAL_PLY } from '@/lib/warped/shelfLayout';
import { shelfFitLine } from '@/lib/warped/shelfFit';

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
}

/** The page opens on this: the Short Standard. */
export const DEFAULT_DESIGN: Design = {
  shape: 'standard', width: 45, height: 24, depth: 10, length: 36,
  shelfCount: 3, columnCount: 4, roundLeft: false, roundRight: false,
};

/** The console has its own proportions, so picking it swaps whole defaults (as in labs). */
const CONSOLE_DESIGN: Design = { ...DEFAULT_DESIGN, shape: 'console', width: 48, height: 26, depth: 14 };

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
export function designFromSaved(shelfType: 'flat' | 'corner', variant: ShelfVariant | undefined, lp: Record<string, number | boolean>): Design {
  const num = (key: keyof Design) => (typeof lp[key] === 'number' ? (lp[key] as number) : (DEFAULT_DESIGN[key] as number));
  return fitToRanges({
    shape: shelfType === 'corner' ? 'corner' : variant === 'console' ? 'console' : 'standard',
    width: num('width'), height: num('height'), depth: num('depth'), length: num('length'),
    shelfCount: num('shelfCount'), columnCount: num('columnCount'),
    roundLeft: lp.roundLeft === true, roundRight: lp.roundRight === true,
  });
}

/** Camera sweep per shape: where it opens and the two angles it turns between, so the back never shows. */
export const cameraFor = (shape: ShelfVariant) =>
  shape === 'corner'
    ? { initialRotationDeg: 15, minAngleDeg: -30, maxAngleDeg: 20 }
    : { initialRotationDeg: 350, minAngleDeg: -85, maxAngleDeg: -10 };

export function useDesign() {
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [finish, setFinish] = useState<WoodFinish>('Oak');
  const [unit, setUnit] = useState<DimUnit>('in');

  const set = useCallback(<K extends keyof Design>(key: K, value: Design[K]) => {
    setDesign((prev) => fitToRanges({ ...prev, [key]: value }));
  }, []);

  const setShape = useCallback((shape: ShelfVariant) => {
    setDesign((prev) => {
      if (shape === prev.shape) return prev;
      if (shape === 'console') return CONSOLE_DESIGN;
      if (prev.shape === 'console') return { ...DEFAULT_DESIGN, shape };
      return fitToRanges({ ...prev, shape });
    });
  }, []);

  const load = useCallback((next: Design) => setDesign(fitToRanges(next)), []);

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
  const fitLine = shelfFitLine(derived.opening, design.depth, inCm);
  /** A length as the customer reads it, in their unit. */
  const fmtLen = useCallback(
    (inches: number) => (inCm ? `${Math.round(inches * 2.54)} cm` : `${+inches.toFixed(1)}"`),
    [inCm],
  );

  return { design, set, setShape, load, finish, setFinish, unit, setUnit, inCm, fitLine, fmtLen, ...derived };
}
