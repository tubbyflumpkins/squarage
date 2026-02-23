'use client';

import { useRef, useEffect, useCallback, useId } from 'react';
import { useShelfViewer, type ShelfConfig } from '@/stores/useShelfViewer';

interface ShelfViewerSlotProps {
  className?: string;
  /** Shelf configuration to apply when this slot mounts */
  config?: Partial<ShelfConfig>;
  /** Rotation bounds for auto-rotation */
  rotationBounds?: { min: number; max: number };
  /** Show drag/swipe hint text */
  showDragHint?: boolean;
  /** Children rendered on top (e.g., floating buttons) */
  children?: React.ReactNode;
}

/**
 * Drop-in placeholder for the persistent 3D shelf viewer.
 * Reserves space in the page layout and tells the PersistentShelfViewer
 * where to position itself. Handles drag/touch interaction.
 */
export default function ShelfViewerSlot({
  className = '',
  config,
  rotationBounds,
  showDragHint = true,
  children,
}: ShelfViewerSlotProps) {
  const slotId = useId();
  const slotRef = useRef<HTMLDivElement>(null);
  const { registerSlot, unregisterSlot, updateSlotRect, setConfig, setRotationBounds } = useShelfViewer();

  // Measure and register this slot
  const measure = useCallback(() => {
    if (!slotRef.current) return;
    const rect = slotRef.current.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Set config and bounds on mount
  useEffect(() => {
    if (config) setConfig(config);
    if (rotationBounds) setRotationBounds(rotationBounds.min, rotationBounds.max);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Register slot and track position
  useEffect(() => {
    const rect = measure();
    if (rect) registerSlot(slotId, rect);

    // Re-measure on resize and scroll
    const handleResize = () => {
      const r = measure();
      if (r) updateSlotRect(slotId, r);
    };

    const observer = new ResizeObserver(handleResize);
    if (slotRef.current) observer.observe(slotRef.current);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      unregisterSlot(slotId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotId]);

  // Drag handlers — communicate with PersistentShelfViewer via window global
  const lastMouseX = useRef(0);
  const lastTime = useRef(0);
  const dragVelocityRef = useRef(0);
  const isDragging = useRef(false);

  const getViewer = () => (window as any).__shelfViewer as {
    rotationRef: React.MutableRefObject<number>;
    velocityRef: React.MutableRefObject<number>;
    isDraggingRef: React.MutableRefObject<boolean>;
    setRotation: (r: number) => void;
  } | undefined;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const viewer = getViewer();
    if (!viewer) return;
    isDragging.current = true;
    viewer.isDraggingRef.current = true;
    lastMouseX.current = e.clientX;
    lastTime.current = performance.now();
    dragVelocityRef.current = 0;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const viewer = getViewer();
    if (!isDragging.current || !viewer) return;
    const now = performance.now();
    const dx = e.clientX - lastMouseX.current;
    const dt = now - lastTime.current;
    if (dt > 0) dragVelocityRef.current = (dx * 0.002) / Math.max(dt, 8);
    const r = viewer.rotationRef.current;
    const newR = ((r + dx * 0.005) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    viewer.rotationRef.current = newR;
    viewer.setRotation(newR);
    lastMouseX.current = e.clientX;
    lastTime.current = now;
  }, []);

  const handleMouseUp = useCallback(() => {
    const viewer = getViewer();
    if (!isDragging.current || !viewer) return;
    viewer.velocityRef.current = Math.max(-0.05, Math.min(0.05, dragVelocityRef.current * 30));
    isDragging.current = false;
    viewer.isDraggingRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const viewer = getViewer();
    if (!viewer) return;
    isDragging.current = true;
    viewer.isDraggingRef.current = true;
    lastMouseX.current = e.touches[0].clientX;
    lastTime.current = performance.now();
    dragVelocityRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const viewer = getViewer();
    if (!viewer) return;
    const now = performance.now();
    const dx = e.touches[0].clientX - lastMouseX.current;
    const dt = now - lastTime.current;
    if (dt > 0) dragVelocityRef.current = (-dx * 0.004) / Math.max(dt, 8);
    const r = viewer.rotationRef.current;
    const newR = ((r - dx * 0.01) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    viewer.rotationRef.current = newR;
    viewer.setRotation(newR);
    lastMouseX.current = e.touches[0].clientX;
    lastTime.current = now;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const viewer = getViewer();
    if (!isDragging.current || !viewer) return;
    viewer.velocityRef.current = Math.max(-0.05, Math.min(0.05, dragVelocityRef.current * 30));
    isDragging.current = false;
    viewer.isDraggingRef.current = false;
  }, []);

  return (
    <div ref={slotRef} className={`relative ${className}`}>
      {/* Drag interaction layer — transparent, captures pointer events */}
      <div
        className="absolute inset-0 z-[41] cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {/* Page-specific overlay content (buttons, hints, etc.) */}
      <div className="absolute inset-0 z-[42] pointer-events-none">
        {showDragHint && (
          <span className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 text-[12px] md:text-[14px] font-medium tracking-[0.01em] text-squarage-black/40 select-none pointer-events-none">
            <span className="hidden md:inline">Drag to rotate</span>
            <span className="md:hidden">Swipe to rotate</span>
          </span>
        )}
        {children}
      </div>
    </div>
  );
}
