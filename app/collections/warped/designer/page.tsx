'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSavedDesigns, type SavedDesign } from '@/stores/useSavedDesigns';
import { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import {
  generateShelfGeometry,
  projectGeometryWithRotation,
  calculateBounds as calculateFlatBounds,
  pointsToPath,
} from '@/components/shelf/ShelfVisualizer/geometry';
import {
  generateCornerShelfGeometry,
  projectCornerGeometryWithRotation,
  calculateBounds as calculateCornerBounds,
  pointsToPath as cornerPointsToPath,
} from '@/components/shelf/CornerShelfVisualizer/geometry';

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[16px] uppercase tracking-[0.1em] text-neutral-400 animate-pulse">
          Loading 3D view...
        </span>
      </div>
    ),
  },
);

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const WOOD_FINISHES: { name: WoodFinish; color: string }[] = [
  { name: 'Walnut', color: '#5D4E37' },
  { name: 'Oak', color: '#B08D57' },
  { name: 'Birch', color: '#E8D5B7' },
];

// ---------------------------------------------------------------------------
// Compact Slider (with double-click editable value)
// ---------------------------------------------------------------------------

function useHoldRepeat(callback: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const start = useCallback(() => {
    callback();
    timerRef.current = setTimeout(() => {
      let delay = 150;
      const tick = () => {
        callback();
        delay = Math.max(40, delay * 0.85);
        intervalRef.current = setTimeout(tick, delay) as unknown as ReturnType<typeof setInterval>;
      };
      intervalRef.current = setTimeout(tick, delay) as unknown as ReturnType<typeof setInterval>;
    }, 400);
  }, [callback]);

  useEffect(() => stop, [stop]);

  return { start, stop };
}

function CompactSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [dragging, setDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Sync localValue when value changes externally (e.g. loading a design)
  useEffect(() => {
    if (!dragging) setLocalValue(value);
  }, [value, dragging]);

  const displayValue = dragging ? localValue : value;

  const handleDoubleClick = () => {
    setEditValue(step < 1 ? displayValue.toFixed(1) : String(displayValue));
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const n = Number(editValue);
    if (!isNaN(n)) {
      const clamped = Math.max(min, Math.min(max, n));
      onChange(step < 1 ? Math.round(clamped * 10) / 10 : Math.round(clamped));
    }
    setEditing(false);
  };

  const increment = useCallback(() => {
    const next = Math.min(max, valueRef.current + step);
    onChange(step < 1 ? Math.round(next * 10) / 10 : next);
  }, [max, step, onChange]);

  const decrement = useCallback(() => {
    const next = Math.max(min, valueRef.current - step);
    onChange(step < 1 ? Math.round(next * 10) / 10 : next);
  }, [min, step, onChange]);

  const up = useHoldRepeat(increment);
  const down = useHoldRepeat(decrement);

  return (
    <div className="flex items-center h-[38px] gap-1.5">
      <span className="text-[14px] uppercase tracking-[0.06em] text-neutral-600 w-[78px] shrink-0 select-none">
        {label}
      </span>
      <button
        onPointerDown={down.start}
        onPointerUp={down.stop}
        onPointerLeave={down.stop}
        onPointerCancel={down.stop}
        className="text-neutral-400 hover:text-squarage-black transition-colors leading-none select-none shrink-0 p-4 md:p-0 touch-manipulation flex items-center justify-center"
      >
        <svg width="7" height="12" viewBox="0 0 7 12"><polygon points="0,6 7,0 7,12" fill="currentColor" /></svg>
      </button>
      <div className="flex-1 min-w-0 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLocalValue(v);
            if (!dragging || !isMobile) onChange(v);
          }}
          onPointerDown={() => { if (isMobile) setDragging(true); }}
          onPointerUp={() => { if (dragging) { setDragging(false); onChange(localValue); } }}
          onPointerCancel={() => { if (dragging) { setDragging(false); onChange(localValue); } }}
          onLostPointerCapture={() => { if (dragging) { setDragging(false); onChange(localValue); } }}
          className="compact-slider-track w-full h-[1px] appearance-none bg-neutral-300 outline-none cursor-pointer touch-manipulation
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[13px] [&::-webkit-slider-thumb]:h-[13px]
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-squarage-black [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#fffaf4]
            [&::-moz-range-thumb]:w-[13px] [&::-moz-range-thumb]:h-[13px] [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-squarage-black [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
      <button
        onPointerDown={up.start}
        onPointerUp={up.stop}
        onPointerLeave={up.stop}
        onPointerCancel={up.stop}
        className="text-neutral-400 hover:text-squarage-black transition-colors leading-none select-none shrink-0 p-4 md:p-0 touch-manipulation flex items-center justify-center"
      >
        <svg width="7" height="12" viewBox="0 0 7 12"><polygon points="7,6 0,0 0,12" fill="currentColor" /></svg>
      </button>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-[28px] shrink-0 text-[18px] font-mono text-squarage-black text-left bg-transparent border-b border-squarage-black outline-none tabular-nums"
        />
      ) : (
        <span
          onClick={handleDoubleClick}
          className="text-[18px] font-mono text-neutral-600 w-[28px] shrink-0 text-left select-none tabular-nums cursor-default"
        >
          {step < 1 ? displayValue.toFixed(1) : displayValue}{unit}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle Switch (square, no animation)
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-4 cursor-pointer select-none"
      onClick={() => onChange(!checked)}
    >
      <div
        role="switch"
        aria-checked={checked}
        className={`relative w-[36px] h-[18px] ${checked ? 'bg-squarage-black' : 'bg-neutral-300'}`}
      >
        <span
          className={`absolute top-[1px] w-[16px] h-[16px] bg-white ${
            checked ? 'left-[19px]' : 'left-[1px]'
          }`}
        />
      </div>
      <span className="text-[14px] uppercase tracking-[0.06em] text-neutral-600">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini Checkbox (square)
// ---------------------------------------------------------------------------

function MiniCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-[8px] cursor-pointer select-none"
      onClick={() => onChange(!checked)}
    >
      <div
        className={`w-[18px] h-[18px] border flex items-center justify-center ${
          checked
            ? 'bg-squarage-black border-squarage-black'
            : 'bg-transparent border-neutral-400'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-[14px] uppercase tracking-[0.06em] text-neutral-600">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[18px] font-bold uppercase tracking-[0.12em] text-squarage-black select-none">
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Amplitude / Price
// ---------------------------------------------------------------------------

function computeAmplitude(isCorner: boolean, height: number): number {
  const minH = 24, maxH = 76;
  const minAmp = isCorner ? 2 : 1.5, maxAmp = 3;
  const t = Math.max(0, Math.min(1, (height - minH) / (maxH - minH)));
  return minAmp + t * (maxAmp - minAmp);
}

function computeColumnAngle(width: number, length: number): number {
  const ratio = width / length;
  const capRatio = 1.5; // 48/32
  if (ratio >= 1) {
    const t = Math.min((ratio - 1) / (capRatio - 1), 1);
    return 45 + t * 15;
  } else {
    const t = Math.min((1 / ratio - 1) / (capRatio - 1), 1);
    return 45 - t * 15;
  }
}

const COST_PER_SQFT = 30; // $/sq ft

function computePrice(
  isCorner: boolean,
  width: number,
  height: number,
  depth: number,
  length: number,
  shelfCount: number,
  columnCount: number,
): number {
  let totalSqIn: number;
  if (isCorner) {
    const shelfArea = shelfCount * (width + length - depth) * depth;
    const colArea = columnCount * height * depth;
    totalSqIn = shelfArea + colArea;
  } else {
    const shelfArea = shelfCount * width * depth;
    const colArea = columnCount * height * depth;
    totalSqIn = shelfArea + colArea;
  }
  return (totalSqIn / 144) * COST_PER_SQFT;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

interface DesignParams {
  isCorner: boolean;
  width: number;
  height: number;
  depth: number;
  length: number;
  shelfCount: number;
  columnCount: number;
  roundLeft: boolean;
  roundRight: boolean;
}

const DEFAULTS: DesignParams = {
  isCorner: false,
  width: 45,
  height: 24,
  depth: 10,
  length: 36,
  shelfCount: 3,
  columnCount: 4,
  roundLeft: false,
  roundRight: false,
};

// Auto-compute shelf/column offsets from dimensions
function computeShelfOffset(isCorner: boolean, height: number): number {
  if (isCorner) {
    // Corner: lerp 2–6 based on height (24–76)
    const t = Math.max(0, Math.min(1, (height - 24) / (76 - 24)));
    return Math.round(2 + t * 4);
  }
  // Standard: lerp 2–6 based on height (24–76)
  const t = Math.max(0, Math.min(1, (height - 24) / (76 - 24)));
  return Math.round(2 + t * 4);
}

function computeColumnOffset(isCorner: boolean, width: number, length: number): number {
  if (isCorner) {
    // Corner: lerp 6–10 based on max(width, length) (10–76)
    const dim = Math.max(width, length);
    const t = Math.max(0, Math.min(1, (dim - 10) / (76 - 10)));
    return Math.round(6 + t * 4);
  }
  // Standard: lerp 2–6 based on width (24–76)
  const t = Math.max(0, Math.min(1, (width - 24) / (76 - 24)));
  return Math.round(2 + t * 4);
}

export default function DesignerPage() {
  const [p, setP] = useState<DesignParams>(DEFAULTS);
  const [finish, setFinish] = useState<WoodFinish>('Oak');
  const [viewMode, setViewMode] = useState<'wireframe' | 'rendered'>('rendered');
  const [rotation, setRotation] = useState(350 * Math.PI / 180);
  const velocityRef = useRef(0.0008);
  const targetSpeedRef = useRef(-0.0012);
  const [tilt] = useState(25);
  const [isDragging, setIsDragging] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [designTab, setDesignTab] = useState<'custom' | 'preset'>('custom');
  const [dimUnit, setDimUnit] = useState<'in' | 'cm'>('in');
  const [showDesignsPanel, setShowDesignsPanel] = useState(false);
  const [closingDesignsPanel, setClosingDesignsPanel] = useState(false);

  const closeDesignsPanel = useCallback(() => {
    setClosingDesignsPanel(true);
  }, []);

  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const lastTime = useRef(0);
  const dragVelocityRef = useRef(0);

  const { designs, loadDesign, saveDesign, deleteDesign, loadDesigns } = useSavedDesigns();

  useEffect(() => { loadDesigns(); }, [loadDesigns]);

  const set = <K extends keyof DesignParams>(key: K, value: DesignParams[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));

  const amplitude = computeAmplitude(p.isCorner, p.height);
  const columnAngle = computeColumnAngle(p.width, p.length);
  const shelfOffset = computeShelfOffset(p.isCorner, p.height);
  const columnOffset = computeColumnOffset(p.isCorner, p.width, p.length);

  const flatParams: ShelfParams = useMemo(() => ({
    width: p.width, height: p.height, depth: p.depth, length: p.length,
    amplitude, shelfCount: p.shelfCount, columnCount: p.columnCount,
    shelfOffset, columnOffset,
    roundLeft: p.roundLeft, roundRight: p.roundRight,
  }), [p, amplitude, shelfOffset, columnOffset]);

  const cornerParams: CornerShelfParams = useMemo(() => ({
    width: p.width, length: p.length, depth: p.depth, height: p.height,
    amplitude, shelfCount: p.shelfCount, columnCount: p.columnCount,
    shelfOffset, columnOffset,
    columnAngle, wallAlign: 1,
  }), [p, amplitude, columnAngle, shelfOffset, columnOffset]);

  // Boomerang rotation — bounces between two angles so the back is never shown
  const minAngleDeg = p.isCorner ? -30 : -85;
  const maxAngleDeg = p.isCorner ? 20 : -10;
  const baseSpeed = 0.0012;
  const friction = 0.97;
  const blendRate = 0.01;
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  // Refs so the RAF closure always sees current bounds without restarting
  const minAngleDegRef = useRef(minAngleDeg);
  const maxAngleDegRef = useRef(maxAngleDeg);
  minAngleDegRef.current = minAngleDeg;
  maxAngleDegRef.current = maxAngleDeg;

  const normalizeAngle = (rad: number): number => {
    let deg = (rad * 180 / Math.PI) % 360;
    if (deg > 180) deg -= 360;
    if (deg < -180) deg += 360;
    return deg;
  };

  const lastFrameTime = useRef(0);
  const rotationRef = useRef(rotation);
  // Sync ref when rotation changes from external sources (drag, design switch)
  const rotationSyncRef = useRef(rotation);
  if (rotation !== rotationSyncRef.current) {
    rotationRef.current = rotation;
    rotationSyncRef.current = rotation;
  }

  useEffect(() => {
    let id: number;
    let lastStateUpdate = 0;
    const mobile = window.innerWidth < 768;
    const STATE_INTERVAL = mobile ? 33 : 0; // throttle to ~30fps on mobile only
    const tick = (time: number) => {
      const dt = lastFrameTime.current ? Math.min((time - lastFrameTime.current) / 16.667, 3) : 1;
      lastFrameTime.current = time;

      if (!isDraggingRef.current) {
        for (let i = 0; i < dt; i++) {
          velocityRef.current = velocityRef.current * friction + (targetSpeedRef.current - velocityRef.current) * blendRate;
        }

        const newRotation = rotationRef.current + velocityRef.current * dt;
        const angleDeg = normalizeAngle(newRotation);

        if (angleDeg <= minAngleDegRef.current && targetSpeedRef.current < 0) {
          targetSpeedRef.current = baseSpeed;
        } else if (angleDeg >= maxAngleDegRef.current && targetSpeedRef.current > 0) {
          targetSpeedRef.current = -baseSpeed;
        }

        rotationRef.current = ((newRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        // Only push to React state at ~16fps — R3F reads the prop on its own render cycle
        if (time - lastStateUpdate > STATE_INTERVAL) {
          setRotation(rotationRef.current);
          lastStateUpdate = time;
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
    lastTime.current = performance.now();
    dragVelocityRef.current = 0;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const now = performance.now();
    const dx = e.clientX - lastMouseX.current;
    const dt = now - lastTime.current;
    if (dt > 0) dragVelocityRef.current = (dx * 0.002) / Math.max(dt, 8);
    setRotation((r) => ((r + dx * 0.005) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
    lastTime.current = now;
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      velocityRef.current = Math.max(-0.05, Math.min(0.05, dragVelocityRef.current * 30));
      setIsDragging(false);
    }
  }, [isDragging]);

  // Touch handlers — mirror mouse handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    lastMouseX.current = e.touches[0].clientX;
    lastMouseY.current = e.touches[0].clientY;
    lastTime.current = performance.now();
    dragVelocityRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const now = performance.now();
    const dx = e.touches[0].clientX - lastMouseX.current;
    const dt = now - lastTime.current;
    if (dt > 0) dragVelocityRef.current = (-dx * 0.004) / Math.max(dt, 8);
    setRotation((r) => ((r - dx * 0.01) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
    lastMouseX.current = e.touches[0].clientX;
    lastMouseY.current = e.touches[0].clientY;
    lastTime.current = now;
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      velocityRef.current = Math.max(-0.05, Math.min(0.05, dragVelocityRef.current * 30));
      setIsDragging(false);
    }
  }, [isDragging]);

  // Stable viewBox across all rotations
  const viewBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      let bounds;
      if (p.isCorner) {
        const geo = generateCornerShelfGeometry(cornerParams);
        const proj = projectCornerGeometryWithRotation(geo, angle, p.width, p.length, tilt);
        bounds = calculateCornerBounds(proj);
      } else {
        const geo = generateShelfGeometry(flatParams);
        const proj = projectGeometryWithRotation(geo, angle, p.width, p.depth, tilt);
        bounds = calculateFlatBounds(proj);
      }
      minX = Math.min(minX, bounds.minX);
      maxX = Math.max(maxX, bounds.maxX);
      minY = Math.min(minY, bounds.minY);
      maxY = Math.max(maxY, bounds.maxY);
    }
    const pad = 8;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const scale = 1 / 1.1;
    const sw = w * scale, sh = h * scale;
    return `${minX - pad + (w - sw) / 2} ${minY - pad + (h - sh) / 2} ${sw} ${sh}`;
  }, [p.isCorner, flatParams, cornerParams, p.width, p.depth, p.length, tilt]);

  // Project current rotation
  const svgPaths = useMemo(() => {
    if (p.isCorner) {
      const geo = generateCornerShelfGeometry(cornerParams);
      const proj = projectCornerGeometryWithRotation(geo, rotation, p.width, p.length, tilt);
      return { type: 'corner' as const, proj };
    } else {
      const geo = generateShelfGeometry(flatParams);
      const proj = projectGeometryWithRotation(geo, rotation, p.width, p.depth, tilt);
      return { type: 'flat' as const, proj };
    }
  }, [p.isCorner, flatParams, cornerParams, rotation, p.width, p.depth, p.length, tilt]);

  // SVG preview string for saving
  const getSvgPreview = useCallback((): string => {
    const sw = '0.4';
    const stroke = '#2C2C2C';
    const line = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}" stroke-width="${sw}"/>`;

    if (p.isCorner) {
      const geo = generateCornerShelfGeometry(cornerParams);
      const proj = projectCornerGeometryWithRotation(geo, rotation, p.width, p.length, tilt);
      const bounds = calculateCornerBounds(proj);
      const pad = 6;
      const vb = `${bounds.minX - pad} ${bounds.minY - pad} ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`;
      let paths = '';
      proj.shelves.forEach((s) => {
        paths += `<path d="${cornerPointsToPath(s.frontEdge)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += `<path d="${cornerPointsToPath(s.backEdgeX)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += `<path d="${cornerPointsToPath(s.backEdgeY)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += line(s.widthSide[0], s.widthSide[1]);
        paths += line(s.lengthSide[0], s.lengthSide[1]);
      });
      proj.columns.forEach((c) => {
        paths += `<path d="${cornerPointsToPath(c.frontEdge)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += `<path d="${cornerPointsToPath(c.backEdge)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += line(c.topSide[0], c.topSide[1]);
        paths += line(c.bottomSide[0], c.bottomSide[1]);
      });
      return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">${paths}</svg>`;
    } else {
      const geo = generateShelfGeometry(flatParams);
      const proj = projectGeometryWithRotation(geo, rotation, p.width, p.depth, tilt);
      const bounds = calculateFlatBounds(proj);
      const pad = 6;
      const vb = `${bounds.minX - pad} ${bounds.minY - pad} ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`;
      let paths = '';
      proj.shelves.forEach((s) => {
        paths += `<path d="${pointsToPath(s.frontEdge)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += `<path d="${pointsToPath(s.backEdge)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += line(s.leftSide[0], s.leftSide[1]);
        paths += line(s.rightSide[0], s.rightSide[1]);
      });
      proj.columns.forEach((c) => {
        paths += `<path d="${pointsToPath(c.frontEdge)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += `<path d="${pointsToPath(c.backEdge)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
        paths += line(c.topSide[0], c.topSide[1]);
        paths += line(c.bottomSide[0], c.bottomSide[1]);
      });
      return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">${paths}</svg>`;
    }
  }, [p.isCorner, flatParams, cornerParams, rotation, p.width, p.depth, p.length, tilt]);

  // Save / Load
  const handleSave = () => {
    if (!saveName.trim()) return;
    const shelfType = p.isCorner ? 'corner' : 'flat';
    const params: Record<string, number | boolean> = {
      ...p, amplitude, shelfOffset, columnOffset,
      ...(p.isCorner ? { columnAngle, wallAlign: 1 } : {}),
    };
    saveDesign(saveName.trim(), shelfType as 'flat' | 'corner', params, getSvgPreview());
    setSaveName('');
    setShowSaveInput(false);
    setDesignTab('custom');
  };

  const handleLoad = (design: SavedDesign) => {
    const loaded = loadDesign(design.id);
    if (!loaded) return;
    const lp = loaded.params;
    setP({
      isCorner: design.shelfType === 'corner',
      width: (lp.width as number) ?? DEFAULTS.width,
      height: (lp.height as number) ?? DEFAULTS.height,
      depth: (lp.depth as number) ?? DEFAULTS.depth,
      length: (lp.length as number) ?? DEFAULTS.length,
      shelfCount: (lp.shelfCount as number) ?? DEFAULTS.shelfCount,
      columnCount: (lp.columnCount as number) ?? DEFAULTS.columnCount,
      roundLeft: (lp.roundLeft as boolean) ?? false,
      roundRight: (lp.roundRight as boolean) ?? false,
    });
  };

  // Price
  const price = computePrice(p.isCorner, p.width, p.height, p.depth, p.length, p.shelfCount, p.columnCount);

  // Dimensions display
  const dimStr = p.isCorner
    ? `${p.width}" × ${p.length}" × ${p.height}"`
    : `${p.width}" × ${p.height}" × ${p.depth}"`;

  // Scale padding in left column when viewport is short.
  const IDEAL_HEIGHT = 1033;
  const [vScale, setVScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const h = window.innerHeight;
      const budget = Math.max(0, h - 560);
      const idealBudget = IDEAL_HEIGHT - 560;
      setVScale(Math.min(1, budget / idealBudget));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const vs = (px: number) => Math.max(px * 0.5, px * vScale);

  // Extracted designs grid — used by both desktop right column and mobile panel
  const renderDesignsGrid = (onLoad?: (design: SavedDesign) => void) => {
    const load = onLoad ?? handleLoad;
    return (
      <>
        <div className="flex">
          {(['preset', 'custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDesignTab(tab)}
              className={`px-4 py-1 text-[13px] uppercase tracking-[0.08em] border transition-colors ${
                designTab === tab
                  ? 'bg-squarage-black text-cream border-squarage-black'
                  : 'bg-cream text-neutral-600 border-neutral-300 hover:border-squarage-black hover:text-squarage-black'
              } ${tab === 'preset' ? 'border-r-0' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-4">
          {designTab === 'preset' ? (
            <p className="text-[14px] text-neutral-400 mt-1">Coming soon</p>
          ) : designs.length === 0 ? (
            <p className="text-[14px] text-neutral-400 mt-1">No saved designs yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="group relative aspect-square border border-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer overflow-hidden bg-white/40"
                  onClick={() => load(design)}
                >
                  {design.svgPreview ? (
                    <div
                      className="w-full h-full p-3"
                      dangerouslySetInnerHTML={{ __html: design.svgPreview }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[13px] text-neutral-400 uppercase">No preview</span>
                    </div>
                  )}

                  {/* Name overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white/90 to-transparent px-3 py-1.5">
                    <span className="text-[13px] text-neutral-600 truncate block">{design.name}</span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDesign(design.id); }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 hover:bg-squarage-black text-squarage-black hover:text-white flex items-center justify-center transition-all text-[13px]"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-cream overflow-hidden md:pt-[90px] lg:pt-[98px]">
      {/* Main grid — mobile: flex column, desktop: 3-col grid */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[320px_minmax(0,1fr)_340px] md:grid-rows-[2fr_1fr] min-h-0 border-t border-squarage-black">

        {/* ============================================================= */}
        {/* CENTER COLUMN — TITLE + VIEWER (order-first on mobile) */}
        {/* ============================================================= */}
        <div className="order-first md:order-2 md:row-span-2 flex flex-col min-h-0 h-[45dvh] md:h-auto shrink-0">
          {/* Title bar — centered */}
          <div className="px-4 md:px-8 py-1.5 md:py-2 flex items-center justify-center shrink-0">
            <h1 className="text-[20px] md:text-[36px] font-bold uppercase tracking-[0.10em] md:tracking-[0.18em] text-squarage-black">
              Warped Shelf Designer
            </h1>
          </div>

          {/* Divider */}
          <div className="h-px bg-squarage-black" />

          {/* Visualizer */}
          <div className="relative flex-1 flex items-center justify-center min-h-0 p-1 md:p-5 touch-none">
            {/* Floating Save Button — top right */}
            <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 flex flex-row gap-1.5">
              <button
                onClick={() => setShowSaveInput(!showSaveInput)}
                className="px-3 md:px-4 py-1 text-[12px] md:text-[13px] uppercase tracking-[0.08em] text-neutral-600 border border-neutral-300 bg-cream hover:border-squarage-black hover:text-squarage-black transition-colors"
              >
                {showSaveInput ? 'Cancel' : 'Save'}
              </button>
              {/* Load Design button — mobile only */}
              <button
                onClick={() => setShowDesignsPanel(true)}
                className="md:hidden px-3 py-1 text-[12px] uppercase tracking-[0.08em] text-neutral-600 border border-neutral-300 bg-cream hover:border-squarage-black hover:text-squarage-black transition-colors"
              >
                Load
              </button>

              {showSaveInput && (
                <div className="absolute top-full right-0 mt-1.5 flex gap-3 bg-cream border border-neutral-300 p-3 w-[calc(100vw-24px)] md:w-[340px]">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="Design name..."
                    autoFocus
                    className="flex-1 text-[16px] px-3 py-1.5 border border-neutral-300 bg-transparent outline-none focus:border-squarage-black transition-colors placeholder:text-neutral-400"
                  />
                  <button
                    onClick={handleSave}
                    className="text-[13px] uppercase tracking-[0.08em] px-3 py-1.5 bg-squarage-black text-cream hover:bg-neutral-700 transition-colors shrink-0"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div
              className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <RenderedShelfView
                isCorner={p.isCorner}
                flatParams={flatParams}
                cornerParams={cornerParams}
                rotation={rotation + Math.PI / 4}
                tilt={tilt}
                finish={finish}
                width={p.width}
                height={p.height}
                depth={p.depth}
                length={p.length}
              />
            </div>

            {/* Drag/swipe hint at bottom */}
            <span className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 text-[12px] md:text-[14px] uppercase tracking-[0.06em] text-neutral-600 select-none pointer-events-none">
              <span className="hidden md:inline">Drag to rotate</span>
              <span className="md:hidden">Swipe to rotate</span>
            </span>

          </div>
        </div>

        {/* ============================================================= */}
        {/* LEFT COLUMN — controls (scrollable on mobile) */}
        {/* ============================================================= */}
        <div className="order-2 md:order-1 md:row-span-2 border-t md:border-t-0 md:border-r border-squarage-black flex flex-col flex-1 md:flex-none overflow-y-auto md:overflow-hidden pb-20 md:pb-0">

          {/* Design Section */}
          <div className="px-5 md:px-7 flex flex-col" style={{ paddingTop: vs(24), paddingBottom: vs(20), gap: vs(20) }}>
            <div className="flex items-center justify-between md:flex-col md:items-start" style={{ gap: vs(20) }}>
              <SectionLabel>Design</SectionLabel>

              <div className="flex">
                {(['standard', 'corner'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      set('isCorner', type === 'corner');
                      setRotation(type === 'corner' ? 15 * Math.PI / 180 : 350 * Math.PI / 180);
                      targetSpeedRef.current = type === 'corner' ? -0.0012 : -0.0012;
                      velocityRef.current = 0.0008;
                    }}
                    className={`px-4 py-1 text-[14px] uppercase tracking-[0.06em] border transition-colors ${
                      (type === 'corner') === p.isCorner
                        ? 'bg-squarage-black text-cream border-squarage-black'
                        : 'bg-cream text-neutral-600 border-neutral-300 hover:border-squarage-black hover:text-squarage-black'
                    } ${type === 'standard' ? 'border-r-0' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {!p.isCorner && (
              <div className="flex items-center justify-between">
                <span className="text-[14px] uppercase tracking-[0.06em] text-neutral-600">Round Edges</span>
                <div className="flex gap-4">
                  <MiniCheck checked={p.roundLeft} onChange={(v) => set('roundLeft', v)} label={<><span className="md:hidden">Left</span><span className="hidden md:inline">L</span></>} />
                  <MiniCheck checked={p.roundRight} onChange={(v) => set('roundRight', v)} label={<><span className="md:hidden">Right</span><span className="hidden md:inline">R</span></>} />
                </div>
              </div>
            )}
          </div>

          <div className="h-[1.5px] bg-squarage-black shrink-0" />

          {/* Dimensions Section */}
          <div className="px-5 md:px-7 flex flex-col" style={{ paddingTop: vs(20), paddingBottom: vs(16), gap: vs(6) }}>
            <div className="flex items-center justify-between">
              <SectionLabel>Dimensions</SectionLabel>
              <div className="flex">
                {(['in', 'cm'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setDimUnit(u)}
                    className={`px-4 py-1 text-[13px] uppercase tracking-[0.08em] border transition-colors ${
                      dimUnit === u
                        ? 'bg-squarage-black text-cream border-squarage-black'
                        : 'bg-cream text-neutral-600 border-neutral-300 hover:border-squarage-black hover:text-squarage-black'
                    } ${u === 'in' ? 'border-r-0' : ''}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col" style={{ marginTop: vs(12), gap: vs(3) }}>
              {dimUnit === 'in' ? (
                <>
                  <CompactSlider label="Width" value={p.width} min={p.isCorner ? 10 : 24} max={76} unit={'"'} onChange={(v) => set('width', v)} />
                  {p.isCorner && (
                    <CompactSlider label="Length" value={p.length} min={10} max={76} unit={'"'} onChange={(v) => set('length', v)} />
                  )}
                  <CompactSlider label="Height" value={p.height} min={24} max={76} unit={'"'} onChange={(v) => set('height', v)} />
                  <CompactSlider label="Depth" value={p.depth} min={p.isCorner ? 3 : 4} max={14} unit={'"'} onChange={(v) => set('depth', v)} />
                </>
              ) : (
                <>
                  <CompactSlider label="Width" value={Math.round(p.width * 2.54)} min={Math.round((p.isCorner ? 10 : 24) * 2.54)} max={Math.round(76 * 2.54)} unit="" onChange={(v) => set('width', Math.round(v / 2.54))} />
                  {p.isCorner && (
                    <CompactSlider label="Length" value={Math.round(p.length * 2.54)} min={Math.round(10 * 2.54)} max={Math.round(76 * 2.54)} unit="" onChange={(v) => set('length', Math.round(v / 2.54))} />
                  )}
                  <CompactSlider label="Height" value={Math.round(p.height * 2.54)} min={Math.round(24 * 2.54)} max={Math.round(76 * 2.54)} unit="" onChange={(v) => set('height', Math.round(v / 2.54))} />
                  <CompactSlider label="Depth" value={Math.round(p.depth * 2.54)} min={Math.round((p.isCorner ? 3 : 4) * 2.54)} max={Math.round(14 * 2.54)} unit="" onChange={(v) => set('depth', Math.round(v / 2.54))} />
                </>
              )}
            </div>
          </div>

          <div className="h-[1.5px] bg-squarage-black shrink-0" />

          {/* Layout Section */}
          <div className="px-5 md:px-7 flex flex-col" style={{ paddingTop: vs(16), paddingBottom: vs(16), gap: vs(6) }}>
            <SectionLabel>Layout</SectionLabel>
            <div className="flex flex-col" style={{ marginTop: vs(12), gap: vs(3) }}>
              <CompactSlider label="Shelves" value={p.shelfCount} min={2} max={8} onChange={(v) => set('shelfCount', v)} />
              <CompactSlider label="Columns" value={p.columnCount} min={2} max={8} onChange={(v) => set('columnCount', v)} />
            </div>
          </div>

          <div className="h-[1.5px] bg-squarage-black shrink-0" />
          <div className="px-5 md:px-7 flex flex-col" style={{ paddingTop: vs(20), paddingBottom: vs(24), gap: vs(16) }}>
            <SectionLabel>Finish</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {WOOD_FINISHES.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setFinish(f.name)}
                  className={`px-4 py-3 border-2 font-medium font-neue-haas text-sm transition-all ${
                    finish === f.name
                      ? 'border-squarage-green bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 border border-gray-300 rounded-full"
                      style={{ backgroundColor: f.color }}
                    />
                    <span>{f.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT COLUMN — SAVED DESIGNS (hidden on mobile) */}
        {/* ============================================================= */}
        <div className="hidden md:flex md:order-3 border-l border-squarage-black flex-col min-h-0">
          <div className="px-7 pt-6 pb-4 shrink-0">
            <SectionLabel>Saved Designs</SectionLabel>
          </div>
          <div className="px-7 flex flex-col flex-1 min-h-0 gap-4">
            {renderDesignsGrid()}
          </div>
        </div>

        {/* ============================================================= */}
        {/* BOTTOM ROW — Estimated Price (hidden on mobile, shown in sticky bar) */}
        {/* ============================================================= */}
        <div className="hidden md:flex md:order-4 border-l border-t border-squarage-black px-7 py-6 flex-col justify-between">
          <div>
            <SectionLabel>Estimated Price</SectionLabel>
            <div className="mt-4">
              <span className="text-[42px] font-semibold text-squarage-black tabular-nums leading-none">
                ${Math.round(price)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-[14px] uppercase tracking-[0.06em] text-neutral-600 mt-5">
            {p.isCorner && (
              <div className="flex justify-between">
                <span>Type</span>
                <span>Corner Unit</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shelves</span>
              <span>{p.shelfCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Columns</span>
              <span>{p.columnCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Finish</span>
              <span>{finish}</span>
            </div>
            <div className="flex justify-between">
              <span>Size</span>
              <span className="tabular-nums">{dimStr}</span>
            </div>
          </div>

          <button className="mt-5 w-full py-4 bg-squarage-orange text-white text-2xl font-bold font-neue-haas hover:bg-squarage-yellow hover:scale-105 transition-all duration-300">
            Get Quote
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MOBILE: Sticky bottom price bar */}
      {/* ============================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-squarage-black bg-cream px-4 pt-3 flex items-center justify-between"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-col">
          <span className="text-[28px] font-semibold text-squarage-black tabular-nums leading-none">
            ${Math.round(price)}
          </span>
          <span className="text-[12px] uppercase tracking-[0.06em] text-neutral-500 mt-1 tabular-nums">
            {dimStr} &middot; {finish}
          </span>
        </div>
        <button className="px-6 py-3 bg-squarage-orange text-white text-xl font-bold font-neue-haas hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 shrink-0">
          Get Quote
        </button>
      </div>

      {/* ============================================================= */}
      {/* MOBILE: Slide-in designs panel */}
      {/* ============================================================= */}
      {showDesignsPanel && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Scrim */}
          <div
            className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${closingDesignsPanel ? 'opacity-0' : 'opacity-100'}`}
            onClick={closeDesignsPanel}
          />
          {/* Panel */}
          <div
            className="absolute inset-y-0 right-0 w-full bg-cream flex flex-col"
            style={{ animation: `${closingDesignsPanel ? 'slideOutRight' : 'slideInRight'} 300ms ease-${closingDesignsPanel ? 'in' : 'out'} forwards` }}
            onAnimationEnd={() => {
              if (closingDesignsPanel) {
                setShowDesignsPanel(false);
                setClosingDesignsPanel(false);
              }
            }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <SectionLabel>Saved Designs</SectionLabel>
              <button
                onClick={closeDesignsPanel}
                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-squarage-black text-[20px]"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
              {renderDesignsGrid((design) => {
                handleLoad(design);
                closeDesignsPanel();
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
