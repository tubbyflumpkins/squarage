import type { PoseVariantId } from '@/lib/posePresets';

// The Mateo chair is ONE page backed by THREE Shopify products (one per
// style, each Color-only). The unified handle is virtual — no Shopify
// product exists behind it; app/products/[handle]/page.tsx special-cases it
// and fetches the three real products below. The real per-style handles
// 308-redirect into the unified page so the style toggle stays an in-page
// switch rather than a navigation.
export const MATEO_UNIFIED_HANDLE = 'mateo-chair';

export const MATEO_PRODUCT_HANDLES: Record<PoseVariantId, string> = {
  pose: 'mateo-pose',
  tabouret: 'mateo-tabouret',
  dine: 'mateo-diner',
};

const STYLE_BY_HANDLE = new Map<string, PoseVariantId>(
  (Object.entries(MATEO_PRODUCT_HANDLES) as Array<[PoseVariantId, string]>).map(
    ([style, handle]) => [handle, style],
  ),
);

export function mateoStyleForHandle(handle: string): PoseVariantId | undefined {
  return STYLE_BY_HANDLE.get(handle);
}

export function mateoUnifiedUrl(style: PoseVariantId, colorHex?: string): string {
  const color = colorHex ? `&color=${encodeURIComponent(colorHex)}` : '';
  return `/products/${MATEO_UNIFIED_HANDLE}?style=${style}${color}`;
}
