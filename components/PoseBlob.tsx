import type { ReactNode } from 'react';

// Smooth, asymmetric pebble. Cubic Béziers with matched tangent vectors at
// every anchor — guarantees C1 continuity, so there are no curvature kinks
// the way CSS border-radius produces at the midpoint of each edge.
//
// Anchors (clockwise from top): (52,8) → (92,42) → (48,92) → (8,58)
// Tangent magnitude is 24 at top/bottom and 28 at sides — slightly less than
// the magic-circle constant (~27.6) at top/bottom for a flatter horizontal
// silhouette and slightly more at the sides for fuller cheeks.
const POSE_BLOB_PATH =
  'M 52,8 C 76,8 92,14 92,42 C 92,70 72,92 48,92 C 24,92 8,86 8,58 C 8,30 28,8 52,8 Z';

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
