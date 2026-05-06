'use client';

import dynamic from 'next/dynamic';
import { posePresets, poseVariantOrder } from '@/lib/posePresets';

const RenderedChairView = dynamic(() => import('@/components/chair/RenderedChairView'), {
  ssr: false,
  loading: () => null,
});

export default function PoseVariantsStack() {
  return (
    <section className="bg-cream pt-4 pb-16 md:pt-8 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {poseVariantOrder.map((id, index) => {
          const { name } = posePresets[id];
          const reversed = index % 2 === 1;
          return (
            <div
              key={id}
              className={`flex flex-col md:flex-row ${
                reversed ? 'md:flex-row-reverse' : ''
              } items-center gap-4 md:gap-12 py-2 md:py-4`}
            >
              <div className="w-full md:w-1/2 aspect-[4/3] relative">
                <div className="absolute inset-0 md:-inset-12 z-10 pointer-events-none">
                  <RenderedChairView preset={id} autoRotate />
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
