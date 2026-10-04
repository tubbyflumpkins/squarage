'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { DimUnit, Range } from './useDesign';

/**
 * The designer's form controls, in the product pages' language: square corners, 2px rules,
 * green for the selection. The segmented toggle is the Mateo page's style picker.
 */

// ---------------------------------------------------------------------------
// Group heading
// ---------------------------------------------------------------------------

export function GroupHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4 md:mb-4">
      <h2 className="font-neue-haas text-lg font-medium text-squarage-black md:text-xl">{children}</h2>
      {aside}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented toggle
// ---------------------------------------------------------------------------

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Small, for a heading's aside (the unit toggle). */
  compact?: boolean;
  label: string;
}

export function Segmented<T extends string>({ options, value, onChange, compact = false, label }: SegmentedProps<T>) {
  const active = options.findIndex((o) => o.value === value);
  return (
    <div role="group" aria-label={label} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {/* Buttons share single 2px lines by collapsing borders with -ml-0.5; the button right of
          the active one turns its left border green so the shared line belongs to the selection. */}
      {options.map((option, index) => {
        const isActive = index === active;
        const afterActive = index > 0 && index - 1 === active;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={`relative border-2 font-neue-haas font-medium transition-colors duration-200 focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-squarage-black ${
              compact ? 'px-3 py-1 text-sm' : 'px-3 py-3 text-sm md:px-4 md:text-base'
            } ${index > 0 ? '-ml-0.5 ' : ''}${
              isActive
                ? 'border-squarage-green bg-squarage-green text-white'
                : `${afterActive ? 'border-l-squarage-green ' : ''}border-squarage-black text-squarage-black hover:text-squarage-green`
            }`}
          >
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
      {/* Motion accent: glides between cells on change. Inset so it never defines an edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 p-1 transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${100 / options.length}%`, transform: `translateX(${Math.max(0, active) * 100}%)` }}
      >
        <div className="h-full w-full bg-squarage-green" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Press-and-hold repeat for the plus and minus buttons
// ---------------------------------------------------------------------------

function useHoldRepeat(callback: () => void, disabled: boolean) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(() => {
    callbackRef.current();
    let delay = 150;
    const tick = () => {
      callbackRef.current();
      delay = Math.max(40, delay * 0.85);
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, 400);
  }, []);

  // A button that reaches its limit mid-hold goes disabled and never sees the pointer lift
  useEffect(() => { if (disabled) stop(); }, [disabled, stop]);
  useEffect(() => stop, [stop]);
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop };
}

function StepButton({ direction, label, disabled, onStep }: { direction: 'down' | 'up'; label: string; disabled: boolean; onStep: () => void }) {
  const hold = useHoldRepeat(onStep, disabled);
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      {...hold}
      // Keyboard and assistive tech press without a pointer
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep(); } }}
      className="flex h-10 w-10 shrink-0 touch-manipulation select-none items-center justify-center border-2 border-squarage-black font-neue-haas text-xl font-medium leading-none text-squarage-black transition-colors duration-200 hover:border-squarage-green hover:text-squarage-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-squarage-black disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300"
    >
      {direction === 'down' ? '−' : '+'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Typed dimension: a number field with its unit, plus and minus, and a slider
// ---------------------------------------------------------------------------

/** Typed sizes land on the nearest quarter inch. */
const TYPED_STEP = 0.25;

/**
 * What the customer typed → inches, or null when it is not a length. Takes "34.5", "34,5",
 * "34 1/2", "34-1/2", with or without a trailing unit mark.
 */
export function parseLength(text: string, unit: DimUnit): number | null {
  const cleaned = text.trim().toLowerCase().replace(/(["”″]|inches|inch|in\.?|cm)$/u, '').trim();
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)?[\s-]*(?:(\d+)\s*\/\s*(\d+))?$/);
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;
  const whole = match[1] !== undefined ? parseFloat(match[1].replace(',', '.')) : 0;
  const fraction = match[2] !== undefined ? Number(match[2]) / Number(match[3]) : 0;
  const value = whole + fraction;
  if (!Number.isFinite(value)) return null;
  return unit === 'cm' ? value / 2.54 : value;
}

const shownLength = (inches: number, unit: DimUnit) => (unit === 'cm' ? String(Math.round(inches * 2.54)) : String(+inches.toFixed(2)));

interface DimensionFieldProps {
  label: string;
  value: number;
  range: Range;
  unit: DimUnit;
  onChange: (inches: number) => void;
}

export function DimensionField({ label, value, range, unit, onChange }: DimensionFieldProps) {
  const id = useId();
  // While the field has focus it holds what the customer is typing; otherwise it shows the value
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const inches = parseLength(draft, unit);
    if (inches !== null) {
      const snapped = Math.round(inches / TYPED_STEP) * TYPED_STEP;
      onChange(Math.max(range.min, Math.min(range.max, snapped)));
    }
    setDraft(null);
  };

  const valueRef = useRef(value);
  valueRef.current = value;
  // Plus and minus move a whole inch, landing on whole inches from a typed fraction
  const step = (delta: 1 | -1) => {
    const v = valueRef.current;
    const next = delta > 0 ? Math.floor(v) + 1 : Math.ceil(v) - 1;
    onChange(Math.max(range.min, Math.min(range.max, next)));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-neue-haas text-base font-medium text-squarage-black md:text-lg">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <StepButton direction="down" label={`Decrease ${label.toLowerCase()}`} disabled={value <= range.min} onStep={() => step(-1)} />
          <div className="flex items-baseline border-b-2 border-squarage-black focus-within:border-squarage-green">
            <input
              id={id}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={draft ?? shownLength(value, unit)}
              onFocus={(e) => { setDraft(shownLength(value, unit)); e.currentTarget.select(); }}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { setDraft(null); e.currentTarget.blur(); }
              }}
              className="w-14 bg-transparent py-1 text-right font-neue-haas text-lg font-medium tabular-nums text-squarage-black outline-none md:text-xl"
            />
            <span className="w-7 pl-1 font-neue-haas text-sm text-gray-600">{unit}</span>
          </div>
          <StepButton direction="up" label={`Increase ${label.toLowerCase()}`} disabled={value >= range.max} onStep={() => step(1)} />
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        min={range.min}
        max={range.max}
        step={1}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="designer-range mt-1 block w-full"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Count: a whole number with plus and minus
// ---------------------------------------------------------------------------

interface CountFieldProps {
  label: string;
  value: number;
  range: Range;
  onChange: (count: number) => void;
}

export function CountField({ label, value, range, onChange }: CountFieldProps) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const step = (delta: 1 | -1) => onChange(Math.max(range.min, Math.min(range.max, valueRef.current + delta)));
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-neue-haas text-base font-medium text-squarage-black md:text-lg">{label}</span>
      <div className="flex items-center gap-2">
        <StepButton direction="down" label={`Fewer ${label.toLowerCase()}`} disabled={value <= range.min} onStep={() => step(-1)} />
        <span aria-live="polite" className="w-[5.25rem] text-center font-neue-haas text-lg font-medium tabular-nums text-squarage-black md:text-xl">
          {value}
        </span>
        <StepButton direction="up" label={`More ${label.toLowerCase()}`} disabled={value >= range.max} onStep={() => step(1)} />
      </div>
    </div>
  );
}
