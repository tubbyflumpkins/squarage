import type { ReactNode } from 'react';

// Hand-drawn pebble. Cubic Béziers with matched tangent vectors at every
// anchor — C1 continuity guarantees no curvature kinks the way CSS
// border-radius produces at the midpoint of each edge.
//
// Anchors (clockwise from top): (54,4) → (96,40) → (46,96) → (4,60)
//   - Top apex pulled right of center, bottom apex pulled left.
//   - Right side rides 10 units above middle; left side rides 10 below.
//     This is the dominant "tilt" that makes the blob feel like it's
//     leaning, not symmetrical.
// Tangent magnitudes per anchor: top=40, right=28, bottom=34, left=36.
//   Asymmetric L values produce different curvature on each side — the
//   right side is more compressed; the left side fuller — so even the
//   four arcs themselves don't mirror each other.
const POSE_BLOB_PATH =
  'M 54,4 C 94,4 96,12 96,40 C 96,68 80,96 46,96 C 12,96 4,96 4,60 C 4,24 14,4 54,4 Z';

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
