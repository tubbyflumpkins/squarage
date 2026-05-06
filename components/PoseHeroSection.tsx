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
      {/* Canvas is taller than the section itself so the chair render keeps
          the pixel real estate it had with the original tall hero. The
          overflow lands behind the Posé blob (which sits at z-50) and
          inside the next section's top padding. pointer-events-none lets
          clicks fall through to the heading below. */}
      <div
        className="absolute left-0 right-0 top-0 z-0 pointer-events-none"
        style={{
          height: isMobile ? '50vh' : 'clamp(60vh, 50vh + 22vw, 85vh)',
        }}
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
