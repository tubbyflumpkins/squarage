// Posé chair color finishes — copied verbatim from the labs /design page's
// COLOR_FINISH_HEX (src/lib/designParams.ts). These are the named finishes
// the chair was designed against; the chairs were stained/painted with
// these specific tones and the rendered look was tuned to them.
export interface PoseFinish {
  name: string;
  hex: string;
}

// Aligned to the Shopify product `mateo-chair`'s Color option values so each
// hex resolves to a real Shopify variant.
export const POSE_FINISHES: readonly PoseFinish[] = [
  { name: 'Squarage', hex: '#4A9B4E' },
  { name: 'Rose', hex: '#E0908A' },
  { name: 'Sky', hex: '#7EB5D5' },
  { name: 'Mint', hex: '#8FB89A' },
  { name: 'Mustard', hex: '#DAB42F' },
  { name: 'Midnight', hex: '#2B4570' },
  { name: 'Orange', hex: '#E2692E' },
  { name: 'Merlot', hex: '#7B3542' },
  { name: 'Cream', hex: '#F4E8D0' },
] as const;

export const POSE_COLOR_PALETTE = POSE_FINISHES.map((f) => f.hex);

export function finishNameForHex(hex: string): string | undefined {
  const target = hex.toLowerCase();
  return POSE_FINISHES.find((f) => f.hex.toLowerCase() === target)?.name;
}

export function pickDistinctRandomColors(count: number): string[] {
  const pool = [...POSE_COLOR_PALETTE];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
