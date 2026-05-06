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
    <section className="bg-cream pt-4 pb-16 md:pt-8 md:pb-24">
      {poseVariantOrder.map((id, index) => {
        const { name } = posePresets[id];
        const reversed = index % 2 === 1;
        return (
          <div
            key={id}
            className="relative w-full"
            style={{ height: 'clamp(60vh, 50vh + 18vw, 75vh)' }}
          >
            {/* Chair canvas spans the full row width — gives the camera enough
                pixels to render the chair large without cropping the floor. */}
            <div className="absolute inset-0">
              <RenderedChairView preset={id} color={colors[index]} autoRotate />
            </div>
            {/* Title floats over the canvas on the opposite side from the chair's
                visual weight. The chair is centered in the canvas, so the empty
                area on either edge has plenty of room. */}
            <div
              className={`absolute inset-y-0 z-20 flex items-center pointer-events-none ${
                reversed ? 'right-0 pr-6 md:pr-16' : 'left-0 pl-6 md:pl-16'
              }`}
            >
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
    </section>
  );
}
