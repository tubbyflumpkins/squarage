// Regression harness for the Warped shelf render geometry (flat and corner).
//
// Fingerprints the pieces the 3D view is built from (generateShelfGeometry /
// generateCornerShelfGeometry, then the slot cutters) across a matrix of resolved
// params, so a geometry sync from labs can prove what changed and what did not.
// `check` lists, per variation, which coordinates moved and by how much.
//
// Usage:
//   npx tsx scripts/verifyShelfGeometry.ts write <baseline.json>
//   npx tsx scripts/verifyShelfGeometry.ts check <baseline.json>
import * as fs from 'fs';
import { generateShelfGeometry } from '../components/shelf/ShelfVisualizer/geometry';
import type { ShelfParams } from '../components/shelf/ShelfVisualizer/types';
import { generateCornerShelfGeometry } from '../components/shelf/CornerShelfVisualizer/geometry';
import type { CornerShelfParams } from '../components/shelf/CornerShelfVisualizer/types';
import { addFlatShelfSlots, addFlatColumnSlots, addCornerShelfSlots, addCornerColumnSlots } from '../components/shelf/RenderedShelfView/slotGeometry';

const FLAT_DEFAULTS: ShelfParams = {
  width: 45, length: 36, depth: 10, height: 24, amplitude: 1.5, shelfCount: 3, columnCount: 4,
  shelfOffset: 2, columnOffset: 3.5, roundLeft: false, roundRight: false,
};

const FLAT: { name: string; overrides: Partial<ShelfParams> }[] = [
  { name: 'defaults', overrides: {} },
  { name: 'tall', overrides: { width: 76, height: 76, shelfCount: 6, columnCount: 6, amplitude: 2.5, shelfOffset: 6, columnOffset: 6 } },
  { name: 'short-wide', overrides: { width: 60, height: 24, depth: 12, shelfCount: 2, columnCount: 5 } },
  { name: 'rounded', overrides: { roundLeft: true, roundRight: true } },
  { name: 'round-left', overrides: { roundLeft: true } },
  { name: 'no-wave', overrides: { amplitude: 0 } },
  { name: 'dense', overrides: { shelfCount: 8, columnCount: 8, shelfOffset: 1, columnOffset: 1 } },
];

const CORNER: { name: string; params: CornerShelfParams }[] = [
  { name: 'corner-defaults', params: { width: 45, length: 36, depth: 10, height: 24, amplitude: 1.5, shelfCount: 3, columnCount: 4, shelfOffset: 2, columnOffset: 4, columnAngle: 45, wallAlign: 1 } },
  { name: 'corner-tall', params: { width: 60, length: 60, depth: 12, height: 72, amplitude: 1.5, shelfCount: 6, columnCount: 5, shelfOffset: 5, columnOffset: 6, columnAngle: 45, wallAlign: 1 } },
];

function snapshot(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const v of FLAT) {
    const params = { ...FLAT_DEFAULTS, ...v.overrides };
    const geo = generateShelfGeometry(params);
    out[v.name] = {
      shelves: geo.shelves,
      columns: geo.columns,
      slottedShelves: geo.shelves.map((s) => addFlatShelfSlots(s, params)),
      slottedColumns: geo.columns.map((c) => addFlatColumnSlots(c, params)),
    };
  }
  for (const v of CORNER) {
    const geo = generateCornerShelfGeometry(v.params);
    out[v.name] = {
      shelves: geo.shelves,
      columns: geo.columns,
      slottedShelves: geo.shelves.map((s) => addCornerShelfSlots(s, v.params)),
      slottedColumns: geo.columns.map((c) => addCornerColumnSlots(c, v.params)),
    };
  }
  return out;
}

const serialize = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === 'number' ? Math.round(x * 1e9) / 1e9 : x));

/** Largest numeric move per "group.edge.axis" (e.g. shelves.frontEdge.y), plus any structural mismatch. */
function diff(a: unknown, b: unknown, path: string[], moved: Map<string, number>, structural: Set<string>) {
  if (typeof a === 'number' && typeof b === 'number') {
    const d = Math.abs(a - b);
    if (d > 1e-9) {
      const key = path.filter((p) => !/^\d+$/.test(p)).join('.');
      moved.set(key, Math.max(moved.get(key) ?? 0, d));
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) structural.add(`${path.filter((p) => !/^\d+$/.test(p)).join('.')} length ${a.length} → ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) diff(a[i], b[i], [...path, String(i)], moved, structural);
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], [...path, k], moved, structural);
    return;
  }
  if (a !== b) structural.add(`${path.join('.')}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
}

const [mode, file] = process.argv.slice(2);
if ((mode !== 'write' && mode !== 'check') || !file) {
  console.log('Usage: npx tsx scripts/verifyShelfGeometry.ts <write|check> <baseline.json>');
  process.exit(2);
}

const current = serialize(snapshot());
if (mode === 'write') {
  fs.writeFileSync(file, current);
  console.log(`Wrote ${file} (${FLAT.length} flat + ${CORNER.length} corner variations)`);
} else {
  const baseline = fs.readFileSync(file, 'utf8');
  if (baseline === current) {
    console.log(`IDENTICAL to ${file} (${FLAT.length} flat + ${CORNER.length} corner variations)`);
  } else {
    const was = JSON.parse(baseline) as Record<string, unknown>;
    const now = JSON.parse(current) as Record<string, unknown>;
    for (const name of Object.keys(now)) {
      const moved = new Map<string, number>();
      const structural = new Set<string>();
      diff(was[name], now[name], [], moved, structural);
      if (moved.size === 0 && structural.size === 0) { console.log(`  ${name}: identical`); continue; }
      console.log(`  ${name}: CHANGED`);
      for (const s of structural) console.log(`    ${s}`);
      for (const [key, d] of [...moved].sort()) console.log(`    ${key} moved up to ${d.toFixed(4)}"`);
    }
    process.exit(1);
  }
}
