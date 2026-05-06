'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PoseBlob from '@/components/PoseBlob';

const HeroChairTrio = dynamic(() => import('@/components/chair/RenderedChairView/HeroChairTrio'), {
  ssr: false,
  loading: () => null,
});

export default function PoseHeroSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section
      className="relative w-full overflow-visible bg-cream"
      style={{ height: isMobile ? '35vh' : 'clamp(40vh, 30vh + 15vw, 60vh)' }}
    >
      {/* Canvas extends past the section bottom, all the way down to where
          the Posé blob's bottom edge lands (the blob is half in / half
          below the section, so we drop the canvas by ~half-blob-height).
          Chairs are still composed to render at section center via the
          yShift prop inside HeroChairTrio, but they're no longer clipped
          at the bottom of their viewport. */}
      <div
        className="absolute left-0 right-0 top-0 z-0 pointer-events-none"
        style={{ bottom: isMobile ? '-2.5rem' : '-4.5rem' }}
      >
        <HeroChairTrio />
      </div>

      <div
        className={`absolute bottom-0 z-50 ${isMobile ? 'w-full flex justify-center px-4' : 'left-[25%]'}`}
        style={{
          transform: isMobile
            ? 'translateY(calc(50% - 1rem)) scale(0.7)'
            : 'translateY(calc(50% - 2vw)) translateX(-50%) scale(clamp(1, 1.1, 1.2))',
        }}
      >
        <PoseBlob>
          <div
            className="text-center"
            style={{
              padding: isMobile
                ? '1.3rem 2.5rem'
                : 'clamp(1.1rem, 1.7vw, 1.9rem) clamp(3rem, 4vw, 4rem)',
            }}
          >
            <h1
              className="font-bold font-neue-haas text-squarage-white leading-none"
              style={{
                fontSize: isMobile ? '3.5rem' : 'clamp(4rem, 8vw, 8rem)',
              }}
            >
              Posé
            </h1>
          </div>
        </PoseBlob>
      </div>
    </section>
  );
}
