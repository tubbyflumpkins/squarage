'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditCardIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import ProductFAQ from '@/components/ProductFAQ';
import ShippingEstimator from '@/components/ShippingEstimator';
import StickyAddToCart from '@/components/StickyAddToCart';
import ProductDetailsAccordion from '@/components/ProductDetailsAccordion';
import ProductTrustBadges from '@/components/ProductTrustBadges';
import { posePresets, poseVariantOrder, type PoseVariantId } from '@/lib/posePresets';
import { POSE_FINISHES, finishNameForHex } from '@/lib/poseColors';
import { useChairMorph } from '@/hooks/useChairMorph';

const RenderedChairView = dynamic(() => import('@/components/chair/RenderedChairView'), {
  ssr: false,
  loading: () => null,
});

interface SerializedProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  createdAt: string;
  updatedAt: string;
  productType: string;
  vendor: string;
  tags: string[];
  options: Array<{ id: string; name: string; values: string[] }>;
  variants: Array<{
    id: string;
    title: string;
    availableForSale: boolean;
    price: { amount: string; currencyCode: string };
    compareAtPrice: { amount: string; currencyCode: string } | null;
    selectedOptions: Array<{ name: string; value: string }>;
    image: { id: string; src: string; altText: string } | null;
  }>;
  images: Array<{ id: string; src: string; altText: string; width: number; height: number }>;
  metafields?: Array<{ id: string; namespace: string; key: string; value: string; type: string }>;
  collections?: Array<{ handle: string; title: string }>;
}

interface MateoProductPageProps {
  product: SerializedProduct;
}

const DEFAULT_COLOR_HEX = '#4A9B4E'; // Squarage green
const DEFAULT_STYLE: PoseVariantId = 'pose';

function formatPrice(price: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(price));
}

// Locate the Shopify variant matching (style, color). Tolerant of common
// option-name spellings ("Style"/"Variant"/"Type" and "Color"/"Colour"/"Finish")
// since the Shopify product was just created and we want the page to keep
// working if the option is renamed later. Color is matched via the named
// finish (e.g. "Squarage") we get from the hex.
function findMateoVariant(
  product: SerializedProduct,
  styleName: string,
  colorName: string | undefined,
): SerializedProduct['variants'][number] | undefined {
  if (!colorName) return undefined;
  const styleNamesLower = ['style', 'variant', 'type', 'shape'];
  const colorNamesLower = ['color', 'colour', 'finish'];
  return product.variants.find((v) => {
    const matchesStyle = v.selectedOptions.some(
      (o) => styleNamesLower.includes(o.name.toLowerCase()) && o.value === styleName,
    );
    const matchesColor = v.selectedOptions.some(
      (o) => colorNamesLower.includes(o.name.toLowerCase()) && o.value === colorName,
    );
    return matchesStyle && matchesColor;
  });
}

export default function MateoProductPage({ product }: MateoProductPageProps) {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  // Initial selection from URL params (deep-link from collection page).
  const initialStyle = useMemo<PoseVariantId>(() => {
    const raw = searchParams.get('style');
    return raw && (poseVariantOrder as readonly string[]).includes(raw)
      ? (raw as PoseVariantId)
      : DEFAULT_STYLE;
  }, [searchParams]);
  const initialColor = useMemo<string>(() => {
    const raw = searchParams.get('color');
    if (!raw) return DEFAULT_COLOR_HEX;
    const matched = POSE_FINISHES.find((f) => f.hex.toLowerCase() === raw.toLowerCase());
    return matched ? matched.hex : DEFAULT_COLOR_HEX;
  }, [searchParams]);

  const [selectedStyle, setSelectedStyle] = useState<PoseVariantId>(initialStyle);
  const [selectedColorHex, setSelectedColorHex] = useState<string>(initialColor);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);

  const morphedParams = useChairMorph(selectedStyle, 2000);

  const selectedColorName = finishNameForHex(selectedColorHex);
  const selectedStyleName = posePresets[selectedStyle].name;
  const selectedVariant = useMemo(
    () => findMateoVariant(product, selectedStyleName, selectedColorName),
    [product, selectedStyleName, selectedColorName],
  );

  useEffect(() => {
    const onScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect();
        setShowStickyCart(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const collection = product.collections?.find((c) => c.handle === 'pose')
    ?? product.collections?.[0]
    ?? { handle: 'pose', title: 'Posé Collection' };

  const titleNode = (
    <>
      <span className="font-soap font-normal text-squarage-green">Mateo</span>{' '}
      <span className="font-bold font-neue-haas text-squarage-black">Chair</span>
    </>
  );

  const styleSelector = (
    <div>
      <h3 className="text-lg md:text-xl font-medium font-neue-haas text-squarage-black mb-3 md:mb-4">
        Select Style
      </h3>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {poseVariantOrder.map((id) => {
          const isActive = id === selectedStyle;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedStyle(id)}
              aria-pressed={isActive}
              className={`px-3 md:px-4 py-3 border-2 font-medium font-neue-haas text-sm md:text-base transition-all ${
                isActive
                  ? 'border-squarage-green bg-squarage-green text-white'
                  : 'border-gray-300 text-squarage-black hover:border-gray-400'
              }`}
            >
              {posePresets[id].name}
            </button>
          );
        })}
      </div>
    </div>
  );

  const colorSelector = (
    <div>
      <h3 className="text-lg md:text-xl font-medium font-neue-haas text-squarage-black mb-3 md:mb-4">
        Select Color
        {selectedColorName && (
          <span className="ml-2 text-base font-normal text-gray-600">— {selectedColorName}</span>
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
              className={`relative w-9 h-9 md:w-11 md:h-11 rounded-full transition-transform ${
                isActive ? 'scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: finish.hex }}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full ring-offset-2 ring-offset-cream transition-all ${
                  isActive
                    ? 'ring-2 ring-squarage-orange'
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

  const chairCanvas = (
    <div className="relative w-full aspect-square">
      <RenderedChairView
        params={morphedParams}
        color={selectedColorHex}
        autoRotate
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-cream">
      {selectedVariant && (
        <StickyAddToCart
          product={{ title: product.title, images: product.images }}
          selectedVariant={selectedVariant}
          onAddToCart={handleAddToCart}
          variantLabel="Style"
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

            <div className="mb-6">{chairCanvas}</div>

            <div className="mb-6">
              <p className="text-2xl font-bold font-neue-haas text-squarage-black mb-2">
                {selectedVariant
                  ? formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)
                  : '—'}
              </p>
              {product.description && (
                <p className="text-base font-neue-haas text-squarage-black leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <div className="mb-6">{styleSelector}</div>
            <div className="mb-8">{colorSelector}</div>

            <div className="mb-6">
              <ShippingEstimator
                price={parseFloat(selectedVariant?.price.amount || '0')}
                productTitle={product.title}
              />
            </div>

            <div className="mb-8">{cartButton}</div>

            <div className="mb-8">
              <ProductDetailsAccordion productType="tiled" metafields={product.metafields} />
            </div>
            <div className="mb-8">
              <ProductTrustBadges />
            </div>
            <div className="mb-8">
              <ProductFAQ productType="tiled" />
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:block w-full px-6">
            <div className="flex flex-row">
              <div className="w-1/2 pr-8">
                <div className="sticky top-32">{chairCanvas}</div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="mb-8">
                  <h1
                    className="leading-tight mb-2"
                    style={{ fontSize: 'clamp(3rem, 4.5vw, 5rem)' }}
                  >
                    {titleNode}
                  </h1>
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

                {product.description && (
                  <p className="text-lg font-neue-haas text-squarage-black leading-relaxed mb-8">
                    {product.description}
                  </p>
                )}

                <div className="mb-8">{styleSelector}</div>
                <div className="mb-8">{colorSelector}</div>

                <div className="mb-8">
                  <ShippingEstimator
                    price={parseFloat(selectedVariant?.price.amount || '0')}
                    productTitle={product.title}
                  />
                </div>

                <div className="mb-8">{cartButton}</div>

                <div className="mb-8">
                  <ProductDetailsAccordion productType="tiled" metafields={product.metafields} />
                </div>
              </div>
            </div>

            <div className="mt-12 mb-12">
              <ProductTrustBadges />
            </div>
            <div>
              <ProductFAQ productType="tiled" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
