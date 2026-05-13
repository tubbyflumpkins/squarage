'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { posePresets, poseVariantOrder } from '@/lib/posePresets';
import { POSE_COLOR_PALETTE, pickDistinctRandomColors } from '@/lib/poseColors';

const RenderedChairView = dynamic(() => import('@/components/chair/RenderedChairView'), {
  ssr: false,
  loading: () => null,
});

export default function PoseVariantsStack() {
  // Use a deterministic initial set (first N palette colors) for SSR + first
  // client render to avoid hydration mismatch on the link hrefs, then
  // randomize after mount so each visit still feels fresh.
  const [colors, setColors] = useState<string[]>(() =>
    POSE_COLOR_PALETTE.slice(0, poseVariantOrder.length),
  );
  useEffect(() => {
    setColors(pickDistinctRandomColors(poseVariantOrder.length));
  }, []);

  return (
    <section className="bg-cream pt-2 pb-12 md:pt-4 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {poseVariantOrder.map((id, index) => {
          const { name } = posePresets[id];
          const color = colors[index];
          // First row: chair on the RIGHT, title on the LEFT. Alternates.
          const reversed = index % 2 === 0;
          const href = `/products/mateo-chair?style=${id}&color=${encodeURIComponent(color)}`;
          return (
            <Link
              key={id}
              href={href}
              prefetch
              aria-label={`Open the Mateo ${name} product page`}
              className={`group flex flex-col md:flex-row ${
                reversed ? 'md:flex-row-reverse' : ''
              } items-center gap-2 md:gap-8 py-1 md:py-2 cursor-pointer`}
            >
              <div className="w-full md:w-1/2 aspect-[4/3] relative">
                <div className="absolute inset-0 md:-inset-20 z-10 pointer-events-none">
                  <RenderedChairView
                    preset={id}
                    color={color}
                    autoRotate
                    initialRotation={(index * 2 * Math.PI) / 3}
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 text-center">
                <h3
                  className="font-bold font-neue-haas text-squarage-black transition-colors duration-300 group-hover:text-squarage-green"
                  style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}
                >
                  {name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
