'use client';

import { useEffect, useRef, useState } from 'react';
import { posePresets, type PoseVariantId } from '@/lib/posePresets';
import { interpolateChairParams } from '@/lib/chairInterpolation';
import { easeInOut } from '@/lib/easing';
import type { ChairParams } from '@/components/chair/ChairVisualizer/types';

export function useChairMorph(
  targetVariant: PoseVariantId,
  durationMs: number = 2000,
): ChairParams {
  // Live params displayed each frame.
  const [params, setParams] = useState<ChairParams>(() => posePresets[targetVariant].params);

  // Refs that need to survive re-renders without retriggering the effect.
  const fromRef = useRef<ChairParams>(posePresets[targetVariant].params);
  const targetRef = useRef<PoseVariantId>(targetVariant);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetRef.current === targetVariant) return;

    // Capture current interpolated params as the new "from" so a click
    // mid-morph re-targets smoothly without snapping.
    fromRef.current = params;
    targetRef.current = targetVariant;
    startTimeRef.current = performance.now();

    if (rafRef.current === null) {
      const tick = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const rawT = Math.min(1, elapsed / durationMs);
        const easedT = easeInOut(rawT);
        const next = interpolateChairParams(
          fromRef.current,
          posePresets[targetRef.current].params,
          easedT,
        );
        setParams(next);

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }
    // We intentionally exclude `params` from deps — it would re-run this
    // effect every frame and reset the morph. `params` is read once here
    // to capture the snapshot at retarget time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetVariant, durationMs]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return params;
}
