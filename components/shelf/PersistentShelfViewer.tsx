'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useShelfViewer } from '@/stores/useShelfViewer';

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[16px] uppercase tracking-[0.1em] text-neutral-400 animate-pulse">
          Loading 3D view...
        </span>
      </div>
    ),
  },
);

export default function PersistentShelfViewer() {
  const {
    activeSlotId,
    targetRect,
    shouldAnimate,
    config,
    flatParams,
    cornerParams,
    minAngleDeg,
    maxAngleDeg,
  } = useShelfViewer();

  // Rotation state — managed here, shared via ref for the RAF loop
  const [rotation, setRotation] = useState(15 * Math.PI / 180);
  const rotationRef = useRef(rotation);
  const lastFrameTime = useRef(0);
  const velocityRef = useRef(0.0008);
  const targetSpeedRef = useRef(-0.0012);

  // Keep refs in sync
  const rotationSyncRef = useRef(rotation);
  if (rotation !== rotationSyncRef.current) {
    rotationRef.current = rotation;
    rotationSyncRef.current = rotation;
  }

  // Expose rotation control for drag handlers in ShelfViewerSlot
  const minAngleDegRef = useRef(minAngleDeg);
  const maxAngleDegRef = useRef(maxAngleDeg);
  minAngleDegRef.current = minAngleDeg;
  maxAngleDegRef.current = maxAngleDeg;

  // Track whether a drag is happening (set by ShelfViewerSlot via global)
  const isDraggingRef = useRef(false);

  const baseSpeed = 0.0012;
  const friction = 0.97;
  const blendRate = 0.01;

  const normalizeAngle = (rad: number): number => {
    let deg = (rad * 180 / Math.PI) % 360;
    if (deg > 180) deg -= 360;
    if (deg < -180) deg += 360;
    return deg;
  };

  // Expose rotation and velocity refs globally so ShelfViewerSlot can control them
  useEffect(() => {
    (window as any).__shelfViewer = {
      rotationRef,
      velocityRef,
      targetSpeedRef,
      isDraggingRef,
      setRotation,
    };
    return () => { delete (window as any).__shelfViewer; };
  }, []);

  // Auto-rotation RAF loop
  useEffect(() => {
    let id: number;
    let lastStateUpdate = 0;
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const STATE_INTERVAL = mobile ? 33 : 0;

    const tick = (time: number) => {
      const dt = lastFrameTime.current ? Math.min((time - lastFrameTime.current) / 16.667, 3) : 1;
      lastFrameTime.current = time;

      if (!isDraggingRef.current) {
        for (let i = 0; i < dt; i++) {
          velocityRef.current = velocityRef.current * friction + (targetSpeedRef.current - velocityRef.current) * blendRate;
        }

        const newRotation = rotationRef.current + velocityRef.current * dt;
        const angleDeg = normalizeAngle(newRotation);

        if (angleDeg <= minAngleDegRef.current && targetSpeedRef.current < 0) {
          targetSpeedRef.current = baseSpeed;
        } else if (angleDeg >= maxAngleDegRef.current && targetSpeedRef.current > 0) {
          targetSpeedRef.current = -baseSpeed;
        }

        rotationRef.current = ((newRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        if (time - lastStateUpdate > STATE_INTERVAL) {
          setRotation(rotationRef.current);
          lastStateUpdate = time;
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  // Hide after a delay when no slot is active (navigated to unrelated page)
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeSlotId) {
      // A slot registered — show immediately
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setVisible(true);
    } else {
      // No slot — hide after delay to allow page transitions
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 600);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [activeSlotId]);

  if (!visible || !targetRect) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: targetRect.top,
    left: targetRect.left,
    width: targetRect.width,
    height: targetRect.height,
    zIndex: 40,
    pointerEvents: 'none',
    transition: shouldAnimate
      ? 'top 0.5s ease-in-out, left 0.5s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out'
      : 'none',
    willChange: 'top, left, width, height',
  };

  return (
    <div style={style}>
      <RenderedShelfView
        isCorner={config.isCorner}
        flatParams={flatParams}
        cornerParams={cornerParams}
        rotation={rotation + Math.PI / 4}
        tilt={config.tilt}
        finish={config.finish}
        width={config.width}
        height={config.height}
        depth={config.depth}
        length={config.length}
      />
    </div>
  );
}
