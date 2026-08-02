'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditCardIcon, CheckBadgeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/formatPrice';
import { useStickyCartVisibility } from '@/lib/useStickyCartVisibility';
import { SerializedProduct } from '@/lib/productTypes';
import { useMetaViewContent } from '@/lib/metaPixel';
import ProductFAQ from '@/components/ProductFAQ';
import ShippingEstimator from '@/components/ShippingEstimator';
import StickyAddToCart from '@/components/StickyAddToCart';
import ProductDetailsAccordion from '@/components/ProductDetailsAccordion';
import ProductTrustBadges from '@/components/ProductTrustBadges';
import { posePresets, poseVariantOrder, type PoseVariantId } from '@/lib/posePresets';
import { POSE_FINISHES, finishNameForHex, finishForColorParam, poseColorSlug } from '@/lib/poseColors';
import { useChairMorph } from '@/hooks/useChairMorph';

const RenderedChairView = dynamic(() => import('@/components/chair/RenderedChairView'), {
  ssr: false,
  loading: () => null,
});

interface MateoProductPageProps {
  // One serialized Shopify product per chair style — the style toggle
  // switches products, not variants. null = that style failed to load and
  // its button renders disabled.
  products: Record<PoseVariantId, SerializedProduct | null>;
}

const DEFAULT_COLOR_HEX = '#4A9B4E'; // Squarage green
const DEFAULT_STYLE: PoseVariantId = 'pose';

const GALLERY_IMAGES: Array<{ src: string; alt: string; width: number; height: number }> = [
  { src: '/images/pose/posegallery/1.jpg', alt: 'Cream Mateo lounge chair in front of a weathered green wooden door', width: 1537, height: 2318 },
  { src: '/images/pose/posegallery/2.jpg', alt: 'Orange Mateo dining chair on the banks of the Los Angeles River', width: 1535, height: 2316 },
  { src: '/images/pose/posegallery/3.jpg', alt: 'Natural birch Mateo lounge chair in warm light beside a record collection', width: 1536, height: 2318 },
  { src: '/images/pose/posegallery/4.jpg', alt: 'Orange Mateo dining chair beneath a concrete bridge with tiled cubes', width: 1535, height: 2316 },
  { src: '/images/pose/posegallery/5.jpg', alt: 'Cream Mateo lounge chair on a poolside wood deck', width: 1376, height: 2075 },
  { src: '/images/pose/posegallery/6.jpg', alt: 'Orange Mateo dining chair on a hilltop overlooking the downtown Los Angeles skyline', width: 1253, height: 1890 },
];

// Mobile's two-column grid pairs the photos differently: 1-2 / 4-3 / 5-6.
const MOBILE_GALLERY_IMAGES = [0, 1, 3, 2, 4, 5].map((i) => GALLERY_IMAGES[i]);

// Dimension drawing for each style variant — the Dimensions accordion
// tab shows the one matching the selected style.
const DIMENSIONS_IMAGES: Record<PoseVariantId, { id: string; src: string; altText: string; width: number; height: number }> = {
  pose: { id: 'pose-dimensions', src: '/images/pose/dimensions/pose_dimensions.png', altText: 'Posé lounge chair dimensions: 28⅛ inches tall, 27¾ inches deep, 18 inches wide, 12 to 15 inch seat height', width: 603, height: 554 },
  tabouret: { id: 'tabouret-dimensions', src: '/images/pose/dimensions/tabouret_dimensions.png', altText: 'Tabouret stool dimensions: 40 inches tall, 30 inch seat height, 19 inches wide, 16 inches deep', width: 581, height: 763 },
  dine: { id: 'dine-dimensions', src: '/images/pose/dimensions/diner_dimensions.png', altText: 'Dîner chair dimensions: 34⅝ inches tall, 18 inch seat height, 22¼ inches wide, 18 inches deep', width: 604, height: 689 },
};

// Locate the Shopify variant matching the selected color. Each style is its
// own Color-only Shopify product, so style picks the product and color picks
// the variant within it. Tolerant of common option-name spellings
// ("Color"/"Colour"/"Finish") so the page keeps working if the option is
// renamed later. Color is matched via the named finish (e.g. "Squarage")
// we get from the hex.
function findMateoColorVariant(
  product: SerializedProduct,
  colorName: string | undefined,
): SerializedProduct['variants'][number] | undefined {
  if (!colorName) return undefined;
  const colorNamesLower = ['color', 'colour', 'finish'];
  return product.variants.find((v) =>
    v.selectedOptions.some(
      (o) => colorNamesLower.includes(o.name.toLowerCase()) && o.value === colorName,
    ),
  );
}

export default function MateoProductPage({ products }: MateoProductPageProps) {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  // Initial selection from URL params (deep-links from the collection page
  // and the catalog cards), restricted to styles whose product loaded.
  const initialStyle = useMemo<PoseVariantId>(() => {
    const raw = searchParams.get('style');
    if (raw && (poseVariantOrder as readonly string[]).includes(raw) && products[raw as PoseVariantId]) {
      return raw as PoseVariantId;
    }
    if (products[DEFAULT_STYLE]) return DEFAULT_STYLE;
    return poseVariantOrder.find((id) => products[id]) ?? DEFAULT_STYLE;
  }, [searchParams, products]);
  const initialColor = useMemo<string>(() => {
    const raw = searchParams.get('color');
    if (!raw) return DEFAULT_COLOR_HEX;
    // Accepts the color-name slug ("merlot") or a legacy hex ("#7B3542").
    return finishForColorParam(raw)?.hex ?? DEFAULT_COLOR_HEX;
  }, [searchParams]);

  const [selectedStyle, setSelectedStyle] = useState<PoseVariantId>(initialStyle);
  const [selectedColorHex, setSelectedColorHex] = useState<string>(initialColor);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<(typeof GALLERY_IMAGES)[number] | null>(null);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const showStickyCart = useStickyCartVisibility(addToCartRef);

  const morphedParams = useChairMorph(selectedStyle, 2000);

  // Which layout branch hosts the chair canvas (Tailwind lg = 1024px).
  // Both branches are always in the React tree (CSS-toggled), so rendering
  // the chair in both would spawn a second live WebGL context the moment
  // the viewport ever crosses the breakpoint. null until mounted — SSR
  // renders no canvas anyway (RenderedChairView is ssr:false).
  const [canvasSlot, setCanvasSlot] = useState<'mobile' | 'desktop' | null>(null);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const apply = () => setCanvasSlot(mql.matches ? 'desktop' : 'mobile');
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);

  // Close lightbox on Escape and lock page scroll while it's open.
  useEffect(() => {
    if (!lightboxImage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxImage]);

  const selectedColorName = finishNameForHex(selectedColorHex);
  // Non-null: the route 404s before rendering when all three products are
  // missing, and style selection is restricted to loaded products.
  const selectedProduct = (products[selectedStyle] ?? products[initialStyle])!;
  const selectedVariant = useMemo(
    () => findMateoColorVariant(selectedProduct, selectedColorName),
    [selectedProduct, selectedColorName],
  );

  // Fires once per distinct product viewed (the hook keeps a seen-set), so
  // toggling styles reports each chair product to Meta exactly once.
  useMetaViewContent(selectedProduct);

  // Keep the address bar in sync with the selection so a copied URL always
  // shares exactly what's on screen. Native replaceState (no navigation, no
  // server round-trip) — Next keeps useSearchParams consistent with it.
  // Color is written as its readable name slug ("merlot"), not the hex.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('style', selectedStyle);
    params.set('color', selectedColorName ? poseColorSlug(selectedColorName) : selectedColorHex);
    const next = `${window.location.pathname}?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [selectedStyle, selectedColorHex, selectedColorName]);

  const handleAddToCart = async () => {
    if (!selectedVariant || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await addToCart(selectedVariant.id);
    } catch (err) {
      console.error('Error adding Mateo chair to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // All three Mateo products live in the Posé collection; the serializer
  // doesn't emit collections, so this is a constant.
  const collection = { handle: 'pose', title: 'Posé Collection' };

  const titleNode = (
    <>
      <span className="font-soap font-normal text-squarage-green">Mateo</span>{' '}
      <span className="font-bold font-neue-haas text-squarage-black">Chair</span>
    </>
  );

  const styleSelector = (
    <div>
      <h3 className="text-lg md:text-xl font-medium font-neue-haas text-squarage-black mb-3 md:mb-4">
        1. Select Style
      </h3>
      <div className="relative grid grid-cols-3">
        {/* The active cell's look comes entirely from its button (background +
            border color), which lands on the same pixel grid as the black lines —
            crisp at any window width. Buttons share single 2px lines by collapsing
            borders with -ml-0.5; the button right of the active one turns its left
            border green so the shared line belongs to the selection. */}
        {poseVariantOrder.map((id, index) => {
          const isActive = id === selectedStyle;
          const afterActive = index > 0 && poseVariantOrder[index - 1] === selectedStyle;
          const isAvailable = products[id] !== null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => isAvailable && setSelectedStyle(id)}
              disabled={!isAvailable}
              aria-pressed={isActive}
              className={`relative border-2 px-3 md:px-4 py-3 font-medium font-neue-haas text-sm md:text-base transition-colors duration-200 ${
                index > 0 ? '-ml-0.5 ' : ''
              }${
                isActive
                  ? 'border-squarage-green bg-squarage-green text-white'
                  : `${afterActive ? 'border-l-squarage-green ' : ''}border-squarage-black text-squarage-black ${
                      isAvailable ? 'hover:text-squarage-green' : 'opacity-40 cursor-not-allowed'
                    }`
              }`}
            >
              <span className="relative z-10">{posePresets[id].name}</span>
            </button>
          );
        })}
        {/* Motion accent — glides between cells on change. Inset so it never
            defines an edge; transformed layers don't pixel-snap like layout does,
            so it must not be responsible for lining up with the grid. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 p-1 transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${poseVariantOrder.indexOf(selectedStyle) * 100}%)` }}
        >
          <div className="h-full w-full bg-squarage-green" />
        </div>
      </div>
    </div>
  );

  const colorSelector = (
    <div>
      <h3 className="text-lg md:text-xl font-medium font-neue-haas text-squarage-black mb-3 md:mb-4">
        2. Select Color:
        {selectedColorName && (
          <span className="ml-2 font-normal text-gray-600">{selectedColorName}</span>
        )}
      </h3>
      <div className="flex flex-wrap gap-3 md:gap-4">
        {POSE_FINISHES.map((finish) => {
          const isActive = finish.hex.toLowerCase() === selectedColorHex.toLowerCase();
          return (
            <button
              key={finish.hex}
              type="button"
              onClick={() => setSelectedColorHex(finish.hex)}
              aria-label={finish.name}
              aria-pressed={isActive}
              title={finish.name}
              className={`relative w-9 h-9 md:w-11 md:h-11 transition-transform ${
                isActive ? 'scale-125' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: finish.hex }}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 ring-offset-2 ring-offset-cream transition-all ${
                  isActive
                    ? 'ring-2 ring-squarage-green'
                    : 'ring-1 ring-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  const cartButton = (
    <div ref={addToCartRef}>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!selectedVariant || isAddingToCart}
        className="w-full bg-squarage-orange font-bold font-neue-haas text-xl md:text-2xl py-4 text-white hover:bg-squarage-yellow hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isAddingToCart ? 'Adding...' : selectedVariant ? 'Add to Cart' : 'Unavailable'}
      </button>
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-500 font-neue-haas">
        <div className="flex items-center gap-1">
          <CreditCardIcon className="w-3.5 h-3.5" />
          <span>Secure checkout powered by Shopify</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <CheckBadgeIcon className="w-3.5 h-3.5" />
          <span>SSL encrypted</span>
        </div>
      </div>
    </div>
  );

  const renderGallery = (images: typeof GALLERY_IMAGES) => (
    <section aria-labelledby="mateo-gallery-heading">
      <h2
        id="mateo-gallery-heading"
        className="text-2xl lg:text-3xl font-bold font-neue-haas text-squarage-black mb-6"
      >
        Gallery
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {images.map((img) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setLightboxImage(img)}
            aria-label={`View larger: ${img.alt}`}
            className="relative block w-full aspect-[2/3] overflow-hidden cursor-zoom-in group"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1023px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>
    </section>
  );

  const madeByHand = (
    <section>
      <h2 className="text-2xl lg:text-3xl font-bold font-neue-haas text-squarage-black mb-6">
        Made by hand in Los Angeles
      </h2>
      <div className="space-y-6 text-xl md:text-2xl font-medium font-neue-haas text-brown-medium leading-relaxed">
        <p>
          The Mateo chair was designed in house and is manufactured by hand in our Los Feliz
          studio. We cut everything on our own CNC machine and finish it all by hand. Nothing is
          mass produced, nothing is outsourced. Every Mateo that leaves the shop is one we
          actually built.
        </p>
        <p>
          Squarage was started as a passion project to bring a sense of playfulness and whimsy to
          the objects around us. We believe that a piece only has a soul if it&rsquo;s made locally
          by people who love the process. That&rsquo;s us.
        </p>
      </div>
    </section>
  );

  // The layout slot stays aspect-square so the page grid math is
  // unchanged; an absolute-positioned wrapper extends the actual
  // canvas past the slot bounds. Top + right are anchored; bottom
  // and left are pulled out further to enlarge the canvas in the
  // bottom-left direction (and shift the chair lower + leftward
  // within its slot). cameraPadding tightens up to fill the new
  // room with a larger chair instead of more whitespace.
  const renderChairCanvas = (slot: 'mobile' | 'desktop') => (
    <div className="relative w-full aspect-square">
      <div className="absolute -top-2 -bottom-20 -left-4 right-0 md:-top-12 md:-bottom-56 md:-left-40 md:-right-20">
        {canvasSlot === slot && (
          <RenderedChairView
            params={morphedParams}
            color={selectedColorHex}
            autoRotate
            interactive
            cameraPadding={0.4}
          />
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-cream">
      {selectedVariant && (
        <StickyAddToCart
          product={{ title: selectedProduct.title, images: selectedProduct.images }}
          selectedVariant={selectedVariant}
          onAddToCart={handleAddToCart}
          variantLabel="Color"
          isVisible={showStickyCart}
        />
      )}

      <div className="pt-24 md:pt-32 pb-24">
        <div className="w-full max-w-7xl mx-auto">
          {/* Mobile layout */}
          <div className="lg:hidden px-6">
            <div className="mb-6">
              <h1
                className="leading-tight"
                style={{ fontSize: 'clamp(2.5rem, 9vw, 3.5rem)' }}
              >
                {titleNode}
              </h1>
              <Link
                href={`/collections/${collection.handle}`}
                className="text-base font-neue-haas text-gray-600 hover:text-squarage-orange transition-colors"
              >
                Part of the {collection.title} →
              </Link>
            </div>

            <div className="mb-6">{renderChairCanvas('mobile')}</div>

            <div className="mb-6">
              <p className="text-2xl font-bold font-neue-haas text-squarage-black mb-2">
                {selectedVariant
                  ? formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)
                  : '—'}
              </p>
              {selectedProduct.description && (
                <p className="text-base font-neue-haas text-squarage-black leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}
            </div>

            <div className="mb-6">{styleSelector}</div>
            <div className="mb-8">{colorSelector}</div>

            <div className="mb-6">
              <ShippingEstimator />
            </div>

            <div className="mb-8">{cartButton}</div>

            <div className="mb-8">
              <ProductDetailsAccordion productType="pose" metafields={selectedProduct.metafields} dimensionsImage={DIMENSIONS_IMAGES[selectedStyle]} />
            </div>
            <div className="mb-8">{renderGallery(MOBILE_GALLERY_IMAGES)}</div>
            <div className="mb-8">{madeByHand}</div>
            <div className="mb-8">
              <ProductTrustBadges />
            </div>
            <div className="mb-8">
              <ProductFAQ productType="pose" />
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:block w-full px-6">
            <div className="flex flex-row">
              {/* max-h caps the sticky containing block so the chair
                  releases earlier — without it, the column flex-stretches
                  to match the right column and the chair would stay
                  pinned long enough to overlap the trust-badge section
                  scrolling up beneath it. */}
              <div className="w-1/2 pr-8 max-h-[900px]">
                <div className="sticky top-32">{renderChairCanvas('desktop')}</div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="mb-8">
                  <p
                    className="leading-tight mb-2"
                    style={{ fontSize: 'clamp(3rem, 4.5vw, 5rem)' }}
                  >
                    {titleNode}
                  </p>
                  <Link
                    href={`/collections/${collection.handle}`}
                    className="text-lg font-neue-haas text-gray-600 hover:text-squarage-orange transition-colors inline-flex items-center"
                  >
                    Part of the {collection.title} →
                  </Link>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold font-neue-haas text-squarage-black">
                    {selectedVariant
                      ? formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)
                      : '—'}
                  </p>
                </div>

                {selectedProduct.description && (
                  <p className="text-lg font-neue-haas text-squarage-black leading-relaxed mb-8">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="mb-8">{styleSelector}</div>
                <div className="mb-8">{colorSelector}</div>

                <div className="mb-8">
                  <ShippingEstimator />
                </div>

                <div className="mb-8">{cartButton}</div>

                <div className="mb-8">
                  <ProductDetailsAccordion productType="pose" metafields={selectedProduct.metafields} dimensionsImage={DIMENSIONS_IMAGES[selectedStyle]} />
                </div>
              </div>
            </div>

            <div className="mt-12 mb-12">{renderGallery(GALLERY_IMAGES)}</div>
            <div className="mb-12">{madeByHand}</div>
            <div className="mb-12">
              <ProductTrustBadges />
            </div>
            <div>
              <ProductFAQ productType="pose" />
            </div>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/85 p-4 md:p-10 cursor-zoom-out"
        >
          <button
            type="button"
            autoFocus
            onClick={() => setLightboxImage(null)}
            aria-label="Close image"
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-8 h-8 md:w-9 md:h-9" />
          </button>
          <Image
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            width={lightboxImage.width}
            height={lightboxImage.height}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full w-auto h-auto object-contain cursor-default"
            sizes="(max-width: 767px) 100vw, 60vw"
          />
        </div>
      )}
    </main>
  );
}
