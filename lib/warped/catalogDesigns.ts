/**
 * Where the designer's presets and the Warped catalog meet: which preset is which product, and
 * the way from a product page into the designer. Kept out of `data/presetDesigns.ts` (78 KB of
 * thumbnails) so a product page can import it.
 */

export const DESIGNER_PATH = '/collections/warped/designer';

/**
 * Preset id → the Shopify product it is. The designer shows that product's price on the
 * preset, so a preset belongs here only while its size and its shelf and column counts match
 * the listing.
 */
export const PRESET_PRODUCT_HANDLES: Record<string, string> = {
  'preset-short-standard': 'wall-mounted-shelf', // 45 x 24 x 10, 3 shelves, 4 columns
};

/** The `?design=` value that opens the designer on a preset: 'preset-short-standard' → 'short-standard'. */
export const designKey = (presetId: string) => presetId.replace(/^preset-/, '');

/** The preset that is this product, if one is. */
export const presetIdForProduct = (handle: string): string | undefined =>
  Object.keys(PRESET_PRODUCT_HANDLES).find((id) => PRESET_PRODUCT_HANDLES[id] === handle);

/**
 * A Warped product page's link into the designer. With a preset the designer opens on that
 * product ("Customize this design"); without one it opens on its default shelf, and the label
 * says so.
 */
export function designerLinkForProduct(handle: string): { href: string; label: string } {
  const presetId = presetIdForProduct(handle);
  return presetId
    ? { href: `${DESIGNER_PATH}?design=${designKey(presetId)}`, label: 'Customize this design' }
    : { href: DESIGNER_PATH, label: 'Design your own' };
}
