import type { ReactNode } from 'react';

// Smooth, asymmetric pebble. Cubic Béziers with matched tangent vectors at
// every anchor — guarantees C1 continuity, so there are no curvature kinks
// the way CSS border-radius produces at the midpoint of each edge.
//
// Anchors (clockwise from top): (54,5) → (94,52) → (46,95) → (6,48)
// Anchors hug the viewBox edges so the curve stays high (or low) at the
// leftmost/rightmost text x positions. Tangent magnitudes are 38 at top
// and bottom for broad shoulders so wide capital letters clear the curve;
// 28 at the sides for slightly fuller cheeks. Slight diagonal asymmetry
// (top biased right, bottom biased left) gives a hand-drawn pebble feel.
const POSE_BLOB_PATH =
  'M 54,5 C 92,5 94,24 94,52 C 94,80 84,95 46,95 C 8,95 6,76 6,48 C 6,20 16,5 54,5 Z';

interface PoseBlobProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export default function PoseBlob({
  children,
  color = '#4A9B4E',
  className,
}: PoseBlobProps) {
  return (
    <div className={`relative inline-block ${className ?? ''}`}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={POSE_BLOB_PATH} fill={color} />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
