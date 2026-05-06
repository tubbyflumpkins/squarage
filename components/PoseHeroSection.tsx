'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

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
      style={{ height: isMobile ? '45vh' : 'clamp(55vh, 50vh + 25vw, 90vh)' }}
    >
      <div className="absolute inset-0 z-0">
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
        <div
          style={{
            backgroundColor: '#E2692E',
            borderRadius: '60% 40% 50% 70% / 50% 65% 35% 50%',
            padding: isMobile
              ? '1.5rem 2.5rem'
              : 'clamp(1.2rem, 1.8vw, 1.8rem) clamp(3rem, 4vw, 4rem)',
          }}
        >
          <div className="text-center">
            <h1
              className="font-bold font-neue-haas text-squarage-white"
              style={{
                fontSize: isMobile ? '3.5rem' : 'clamp(4rem, 8vw, 8rem)',
              }}
            >
              Posé
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
