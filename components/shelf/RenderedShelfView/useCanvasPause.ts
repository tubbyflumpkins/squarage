import { useEffect, useRef, useState } from 'react';

/**
 * Stop a Canvas's render loop while it is fully offscreen or the tab is hidden: `paused` goes
 * on the Canvas's `frameloop` ('never' while paused), `canvasRef` on the Canvas itself. This
 * also covers QuoteFlow's always-mounted copies of the shelf view, which sit translated
 * off-viewport and would otherwise render at 60fps unseen.
 */
export function useCanvasPause() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let offscreen = false;
    let hidden = document.visibilityState === 'hidden';
    const update = () => setPaused(offscreen || hidden);
    const io = new IntersectionObserver(([entry]) => {
      offscreen = !entry.isIntersecting;
      update();
    });
    io.observe(el);
    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden';
      update();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return { canvasRef, paused };
}
