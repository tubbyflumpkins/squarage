import type { ReactNode } from 'react';

// Smooth, asymmetric pebble. Cubic Béziers with matched tangent vectors at
// every anchor — guarantees C1 continuity, so there are no curvature kinks
// the way CSS border-radius produces at the midpoint of each edge.
//
// Anchors (clockwise from top): (52,8) → (92,42) → (48,92) → (8,58)
// Tangent magnitudes: 32 at top/bottom (broader shoulders so wide text fits
// inside the blob's narrowing curves) and 28 at sides for fuller cheeks.
const POSE_BLOB_PATH =
  'M 52,8 C 84,8 92,14 92,42 C 92,70 80,92 48,92 C 16,92 8,86 8,58 C 8,30 20,8 52,8 Z';

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
