'use client';

import dynamic from 'next/dynamic';
import { posePresets, poseVariantOrder } from '@/lib/posePresets';

const RenderedChairView = dynamic(() => import('@/components/chair/RenderedChairView'), {
  ssr: false,
  loading: () => null,
});

export default function PoseVariantsStack() {
  return (
    <section className="bg-cream py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {poseVariantOrder.map((id, index) => {
          const { name } = posePresets[id];
          const reversed = index % 2 === 1;
          return (
            <div
              key={id}
              className={`flex flex-col md:flex-row ${
                reversed ? 'md:flex-row-reverse' : ''
              } items-center gap-8 md:gap-16 py-12 md:py-20`}
            >
              <div className="w-full md:w-1/2 aspect-square">
                <RenderedChairView preset={id} autoRotate />
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
