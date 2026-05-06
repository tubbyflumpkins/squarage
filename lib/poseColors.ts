// Posé chair color finishes — copied verbatim from the labs /design page's
// COLOR_FINISH_HEX (src/lib/designParams.ts). These are the named finishes
// the chair was designed against; the chairs were stained/painted with
// these specific tones and the rendered look was tuned to them.
export const POSE_COLOR_PALETTE = [
  '#4A9B4E', // Squarage
  '#E0908A', // Rose
  '#7EB5D5', // Sky
  '#DAB42F', // Mustard
  '#8FB89A', // Mint
  '#2B4570', // Midnight
  '#E2692E', // Orange
  '#7B3542', // Merlot
  '#78868F', // Slate
  '#F4E8D0', // White
] as const;

export function pickDistinctRandomColors(count: number): string[] {
  const pool = [...POSE_COLOR_PALETTE];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
