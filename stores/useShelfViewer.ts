import { create } from 'zustand';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';

export type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

export interface ShelfConfig {
  isCorner: boolean;
  width: number;
  height: number;
  depth: number;
  length: number;
  shelfCount: number;
  columnCount: number;
  roundLeft: boolean;
  roundRight: boolean;
  amplitude: number;
  shelfOffset: number;
  columnOffset: number;
  columnAngle: number;
  finish: WoodFinish;
  tilt: number;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ShelfViewerState {
  // Whether a slot is registered (viewer is visible)
  activeSlotId: string | null;

  // Animated position target
  targetRect: TargetRect | null;
  // Whether to animate (false on first registration to avoid slide-in from 0,0)
  shouldAnimate: boolean;

  // Shelf configuration
  config: ShelfConfig;

  // Computed params for RenderedShelfView
  flatParams: ShelfParams;
  cornerParams: CornerShelfParams;

  // Rotation bounds for auto-rotation
  minAngleDeg: number;
  maxAngleDeg: number;

  // Actions
  registerSlot: (id: string, rect: TargetRect) => void;
  unregisterSlot: (id: string) => void;
  updateSlotRect: (id: string, rect: TargetRect) => void;
  setConfig: (config: Partial<ShelfConfig>) => void;
  setRotationBounds: (min: number, max: number) => void;
}

function computeFlatParams(c: ShelfConfig): ShelfParams {
  return {
    width: c.width,
    height: c.height,
    depth: c.depth,
    length: c.length,
    amplitude: c.amplitude,
    shelfCount: c.shelfCount,
    columnCount: c.columnCount,
    shelfOffset: c.shelfOffset,
    columnOffset: c.columnOffset,
    roundLeft: c.roundLeft,
    roundRight: c.roundRight,
  };
}

function computeCornerParams(c: ShelfConfig): CornerShelfParams {
  return {
    width: c.width,
    length: c.length,
    depth: c.depth,
    height: c.height,
    amplitude: c.amplitude,
    shelfCount: c.shelfCount,
    columnCount: c.columnCount,
    shelfOffset: c.shelfOffset,
    columnOffset: c.columnOffset,
    columnAngle: c.columnAngle,
    wallAlign: 1,
  };
}

const DEFAULT_CONFIG: ShelfConfig = {
  isCorner: true,
  width: 45,
  height: 24,
  depth: 10,
  length: 36,
  shelfCount: 3,
  columnCount: 4,
  roundLeft: false,
  roundRight: false,
  amplitude: 2,
  shelfOffset: 2,
  columnOffset: 8,
  columnAngle: 52.5,
  finish: 'Oak',
  tilt: 25,
};

export const useShelfViewer = create<ShelfViewerState>((set, get) => ({
  activeSlotId: null,
  targetRect: null,
  shouldAnimate: false,
  config: DEFAULT_CONFIG,
  flatParams: computeFlatParams(DEFAULT_CONFIG),
  cornerParams: computeCornerParams(DEFAULT_CONFIG),
  minAngleDeg: -30,
  maxAngleDeg: 20,

  registerSlot: (id, rect) => {
    const state = get();
    // If already had a slot, animate to new position. Otherwise snap.
    const shouldAnimate = state.activeSlotId !== null;
    set({ activeSlotId: id, targetRect: rect, shouldAnimate });
  },

  unregisterSlot: (id) => {
    const state = get();
    // Only clear if it's the currently active slot.
    // Keep targetRect so the viewer stays in place during navigation.
    if (state.activeSlotId === id) {
      set({ activeSlotId: null });
    }
  },

  updateSlotRect: (id, rect) => {
    const state = get();
    if (state.activeSlotId === id) {
      set({ targetRect: rect, shouldAnimate: true });
    }
  },

  setConfig: (partial) => {
    const state = get();
    const newConfig = { ...state.config, ...partial };
    set({
      config: newConfig,
      flatParams: computeFlatParams(newConfig),
      cornerParams: computeCornerParams(newConfig),
    });
  },

  setRotationBounds: (min, max) => {
    set({ minAngleDeg: min, maxAngleDeg: max });
  },
}));
