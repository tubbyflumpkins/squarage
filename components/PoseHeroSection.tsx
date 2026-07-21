'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import PoseBlob from '@/components/PoseBlob';

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
      {/* The image is clipped to the section while the blob below hangs
          half outside it, so the overflow-hidden lives on this wrapper
          rather than the section itself. */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/pose/posehero.png"
          alt="Cream Mateo lounge chair on a wood deck beside a pool"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Mobile scales from the bottom-left corner so the doubled blob
          grows up/right from its left margin instead of clipping
          off-screen. The blob deliberately pokes a little past the
          hero's bottom edge, overlapping whatever sits below. */}
      <div
        className={`absolute bottom-0 z-50 ${isMobile ? 'left-4 origin-bottom-left' : 'left-[25%]'}`}
        style={{
          transform: isMobile
            ? 'translateY(50%) scale(1.05)'
            : 'translateY(calc(50% - 4vw)) translateX(-50%) scale(1.65)',
        }}
      >
        <PoseBlob>
          <div
            className="text-center"
            style={{
              padding: isMobile
                ? '1rem 1.9rem'
                : 'clamp(0.85rem, 1.3vw, 1.5rem) clamp(2.25rem, 3vw, 3rem)',
            }}
          >
            <h1
              className="font-bold font-neue-haas text-squarage-white leading-none"
              style={{
                fontSize: isMobile ? '2.75rem' : 'clamp(3rem, 6vw, 6rem)',
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
