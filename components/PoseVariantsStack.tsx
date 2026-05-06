'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { posePresets, poseVariantOrder } from '@/lib/posePresets';
import { pickDistinctRandomColors } from '@/lib/poseColors';

const RenderedChairView = dynamic(() => import('@/components/chair/RenderedChairView'), {
  ssr: false,
  loading: () => null,
});

export default function PoseVariantsStack() {
  const colors = useMemo(() => pickDistinctRandomColors(poseVariantOrder.length), []);

  return (
    <section className="bg-cream pt-2 pb-12 md:pt-4 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {poseVariantOrder.map((id, index) => {
          const { name } = posePresets[id];
          // First row: chair on the RIGHT, title on the LEFT. Alternates.
          const reversed = index % 2 === 0;
          return (
            <div
              key={id}
              className={`flex flex-col md:flex-row ${
                reversed ? 'md:flex-row-reverse' : ''
              } items-center gap-2 md:gap-8 py-1 md:py-2`}
            >
              <div className="w-full md:w-1/2 aspect-[4/3] relative">
                <div className="absolute inset-0 md:-inset-20 z-10 pointer-events-none">
                  <RenderedChairView preset={id} color={colors[index]} autoRotate />
                </div>
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h3
                  className="font-bold font-neue-haas text-squarage-black"
                  style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}
                >
                  {name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
