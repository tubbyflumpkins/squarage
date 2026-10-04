'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { DimUnit, Range } from './useDesign';

/**
 * The designer's form controls. Their language is the soft half of the site's: the round pills
 * of the Warped collection page, thin gray outlines like the product pages' finish chips, and
 * green for whatever is selected. No rules between things: space does that.
 */

export const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-squarage-green';

// ---------------------------------------------------------------------------
// Panel: one floating card of the accordion
// ---------------------------------------------------------------------------

interface PanelProps {
  title: string;
  /** What is chosen inside, shown in the header so a closed card still says something. */
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function Panel({ title, value, open, onToggle, children }: PanelProps) {
  const bodyId = useId();
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm transition-shadow duration-300 ${
        open ? 'shadow-[0_10px_30px_rgba(51,51,51,0.08)]' : 'shadow-[0_1px_2px_rgba(51,51,51,0.04)]'
      }`}
    >
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className={`flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left ${focusRing}`}
        >
          <span className="font-neue-haas text-lg font-medium text-squarage-black">{title}</span>
          <span className="flex min-w-0 items-center gap-2 font-neue-haas text-base text-gray-500">
            <span className="truncate">{value}</span>
            <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </h2>
      {/* Height animates through the grid row; the content stays mounted so a field keeps its state */}
      <div
        id={bodyId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        inert={!open}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Segmented pill
// ---------------------------------------------------------------------------

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Small, for a secondary choice (units). */
  compact?: boolean;
  label: string;
}

export function Segmented<T extends string>({ options, value, onChange, compact = false, label }: SegmentedProps<T>) {
  const active = options.findIndex((o) => o.value === value);
  return (
    <div
      role="group"
      aria-label={label}
      className={`relative grid rounded-full bg-squarage-black/[0.06] p-1 ${compact ? 'w-max' : 'w-full'}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {/* The selection: one green pill that glides between the options */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1 transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${Math.max(0, active) * 100}%)` }}
      >
        <div className="h-full w-full rounded-full bg-squarage-green shadow-sm" />
      </div>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={index === active}
          className={`relative z-10 rounded-full font-neue-haas font-medium transition-colors duration-200 ${focusRing} ${
            compact ? 'px-3.5 py-1 text-sm' : 'px-3 py-2.5 text-sm md:text-base'
          } ${index === active ? 'text-white' : 'text-squarage-black/70 hover:text-squarage-black'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface TogglePillProps {
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  children: React.ReactNode;
}

/** An on/off choice, as a pill that fills green when on. */
export function TogglePill({ pressed, onChange, children }: TogglePillProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={`rounded-full border px-4 py-2 font-neue-haas text-sm font-medium transition-colors duration-200 md:text-base ${focusRing} ${
        pressed
          ? 'border-squarage-green bg-squarage-green text-white'
          : 'border-gray-300 bg-white text-squarage-black/80 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
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

interface StepButtonProps {
  direction: 'down' | 'up';
  label: string;
  disabled: boolean;
  onStep: () => void;
}

function StepButton({ direction, label, disabled, onStep }: StepButtonProps) {
  const hold = useHoldRepeat(onStep, disabled);
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      {...hold}
      // Keyboard and assistive tech press without a pointer
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStep(); } }}
      className={`flex h-9 w-9 shrink-0 touch-manipulation select-none items-center justify-center rounded-full border border-gray-300 bg-white font-neue-haas text-lg leading-none text-squarage-black transition-colors duration-200 hover:border-squarage-green hover:text-squarage-green disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 ${focusRing}`}
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
        <label htmlFor={id} className="font-neue-haas text-base font-medium text-squarage-black">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <StepButton direction="down" label={`Decrease ${label.toLowerCase()}`} disabled={value <= range.min} onStep={() => step(-1)} />
          {/* The field: a white pill with its unit inside, so it reads as something to type in */}
          <div className="flex h-9 w-[5.75rem] items-baseline justify-center rounded-full border border-gray-300 bg-white px-3 transition-colors duration-200 focus-within:border-squarage-green focus-within:ring-2 focus-within:ring-squarage-green/20">
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
              className="h-9 w-full min-w-0 bg-transparent text-right font-neue-haas text-base font-medium tabular-nums text-squarage-black outline-none"
            />
            <span className="pl-1 font-neue-haas text-sm text-gray-500">{unit}</span>
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
