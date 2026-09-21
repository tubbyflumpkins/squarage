// Structural checks for the Warped console's render geometry (the render half of labs'
// scripts/verify-console-geometry.ts; labs checks the CNC parts too).
//
// The console is the standard shelf with its top shelf turned into a surface: the first
// and last columns run the full height and the top slots into them, while every column
// in between stops at the top's underside and takes no slot for it. Everything below the
// top is the standard shelf, and with two columns or fewer so is the whole piece.
//
// Usage: npx tsx scripts/verifyConsoleGeometry.ts
import { generateShelfGeometry, getFrontSurfaceY } from '../components/shelf/ShelfVisualizer/geometry';
import type { ShelfParams } from '../components/shelf/ShelfVisualizer/types';
import { addFlatShelfSlots, addFlatColumnSlots } from '../components/shelf/RenderedShelfView/slotGeometry';
import { shelfLayout, consoleSurfaceHeight, NOMINAL_PLY } from '../lib/warped/shelfLayout';

const CONSOLE: ShelfParams = {
  width: 48, length: 36, depth: 14, height: 26, amplitude: 1.52, shelfCount: 3, columnCount: 4,
  shelfOffset: 2.11, columnOffset: 3.33, roundLeft: false, roundRight: false, consoleTop: true,
};

const VARIATIONS: { name: string; overrides: Partial<ShelfParams> }[] = [
  { name: 'defaults', overrides: {} },
  { name: 'low-deep', overrides: { width: 72, height: 16, depth: 20, shelfCount: 2, columnCount: 5 } },
  { name: 'tall', overrides: { height: 40, shelfCount: 5, columnCount: 6 } },
  { name: 'rounded', overrides: { roundLeft: true, roundRight: true } },
  { name: 'three-columns', overrides: { columnCount: 3 } },
  // Nothing sits between the first and last column: the console is the standard shelf
  { name: 'two-columns', overrides: { columnCount: 2 } },
];

let failures = 0;
let checks = 0;
function check(name: string, ok: boolean, detail = '') {
  checks++;
  if (!ok) { failures++; console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}
const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
const serialize = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === 'number' ? Math.round(x * 1e9) / 1e9 : x));

for (const v of VARIATIONS) {
  const params = { ...CONSOLE, ...v.overrides };
  const { width, height, depth, amplitude, shelfCount, columnCount } = params;
  const isInner = (c: number) => c > 0 && c < columnCount - 1;
  const geo = generateShelfGeometry(params);
  const standard = generateShelfGeometry({ ...params, consoleTop: false });
  const topZ = geo.shelves[shelfCount - 1].frontEdge[0].z;

  check(`${v.name} shelves are the standard shelf's`, serialize(geo.shelves) === serialize(standard.shelves));
  check(`${v.name} surface height is the top's upper face`, near(consoleSurfaceHeight(params) as number, topZ + NOMINAL_PLY / 2));
  check(`${v.name} top as far from the column tops as the bottom shelf is from the floor`, near(height - topZ, geo.shelves[0].frontEdge[0].z));

  geo.columns.forEach((column, c) => {
    check(`${v.name} column ${c + 1} ${isInner(c) ? 'stops under the top' : 'runs the full height'}`, near(column.topSide[1].z, isInner(c) ? topZ - NOMINAL_PLY / 2 : height));
    if (!isInner(c)) check(`${v.name} column ${c + 1} is the standard shelf's`, serialize(column) === serialize(standard.columns[c]));
    // Each slot shows as two back-edge points stepped in from the wall
    const slots = addFlatColumnSlots(column, params).backEdge.filter((p) => p.y > 1e-9).length / 2;
    check(`${v.name} column ${c + 1} slot count`, slots === (isInner(c) ? shelfCount - 1 : shelfCount), `${slots}`);
  });

  geo.shelves.forEach((shelf, i) => {
    // A slot's two inner corners sit half the ply either side of its column, halfway back from the wave
    const z = shelf.frontEdge[0].z;
    const slotted = addFlatShelfSlots(shelf, params).frontEdge;
    const slottedColumns = geo.columns.map((column) => {
      const colX = column.frontEdge[0].x;
      const innerY = getFrontSurfaceY(colX, z, width, height, depth, amplitude, params.roundLeft, params.roundRight) / 2;
      return [-1, 1].every((side) => slotted.some((p) => near(p.x, colX + (side * NOMINAL_PLY) / 2) && near(p.y, innerY)));
    });
    const expected = geo.columns.map((_, c) => i !== shelfCount - 1 || !isInner(c));
    check(`${v.name} shelf ${i + 1} slots into ${i === shelfCount - 1 ? 'the first and last columns only' : 'every column'}`, serialize(slottedColumns) === serialize(expected), serialize(slottedColumns));
  });

  if (columnCount <= 2) check(`${v.name} is the standard shelf`, serialize(geo) === serialize(standard));
}

// --- The middle of three shelves moved off centre (set by labs on shared designs, never by the builder)
for (const consoleTop of [true, false]) {
  const base = { ...CONSOLE, consoleTop };
  const shifted = { ...base, middleShelfShift: 3 };
  const even = generateShelfGeometry(base);
  const moved = generateShelfGeometry(shifted);
  const tag = consoleTop ? 'console' : 'standard';
  check(`${tag} shift moves the middle shelf up 3"`, near(moved.shelves[1].frontEdge[0].z, even.shelves[1].frontEdge[0].z + 3));
  check(`${tag} shift leaves the outer shelves and the columns alone`, serialize([moved.shelves[0], moved.shelves[2], moved.columns]) === serialize([even.shelves[0], even.shelves[2], even.columns]));
  const slotZs = addFlatColumnSlots(moved.columns[0], shifted).backEdge.filter((p) => p.y > 1e-9).map((p) => p.z);
  check(`${tag} shift: the column is slotted where the shelf now is`, [0.25, -0.25].every((d) => slotZs.some((z) => near(z, moved.shelves[1].frontEdge[0].z + d))));
  check(`${tag} shift is ignored with four shelves`, serialize(generateShelfGeometry({ ...shifted, shelfCount: 4 })) === serialize(generateShelfGeometry({ ...base, shelfCount: 4 })));
  check(`${tag} no shift, zero shift: the same shelf`, serialize(generateShelfGeometry({ ...base, middleShelfShift: 0 })) === serialize(even));
}

// --- Without the flag nothing is a console
const plain = shelfLayout({ ...CONSOLE, consoleTop: false });
check('standard layout has no top and full-height columns', plain.topIndex === null && plain.columns.every((c) => !c.underTop && c.topZ === CONSOLE.height) && consoleSurfaceHeight({ ...CONSOLE, consoleTop: false }) === null);

if (failures) {
  console.log(`\n${failures} of ${checks} check(s) failed`);
  process.exit(1);
}
console.log(`All ${checks} console checks pass.`);
