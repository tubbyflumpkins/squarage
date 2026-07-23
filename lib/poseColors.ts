// Posé chair color finishes — copied verbatim from the labs /design page's
// COLOR_FINISH_HEX (src/lib/designParams.ts). These are the named finishes
// the chair was designed against; the chairs were stained/painted with
// these specific tones and the rendered look was tuned to them.
export interface PoseFinish {
  name: string;
  hex: string;
}

// Aligned to the Color option values shared by the three Mateo Shopify
// products (mateo-pose / mateo-tabouret / mateo-diner) so each hex resolves
// to a real Shopify variant.
export const POSE_FINISHES: readonly PoseFinish[] = [
  { name: 'Squarage', hex: '#4A9B4E' },
  { name: 'Rosé', hex: '#E0908A' },
  { name: 'Sky', hex: '#7EB5D5' },
  { name: 'Mint', hex: '#8FB89A' },
  { name: 'Yellow', hex: '#F0DC73' },
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

// URL-friendly color identifier: lowercase with diacritics stripped, so
// "Rosé" reads as plain "rose" in a shared link.
export function poseColorSlug(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function poseColorSlugForHex(hex: string): string | undefined {
  const name = finishNameForHex(hex);
  return name ? poseColorSlug(name) : undefined;
}

// Resolve a ?color= URL param to a finish. Accepts the slug name (what the
// site writes now, e.g. "merlot") and legacy hex values ("#7B3542") so
// previously shared links keep working.
export function finishForColorParam(raw: string): PoseFinish | undefined {
  const value = raw.trim();
  const byHex = POSE_FINISHES.find((f) => f.hex.toLowerCase() === value.toLowerCase());
  if (byHex) return byHex;
  const slug = poseColorSlug(value);
  return POSE_FINISHES.find((f) => poseColorSlug(f.name) === slug);
}

export function pickDistinctRandomColors(count: number): string[] {
  const pool = [...POSE_COLOR_PALETTE];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
