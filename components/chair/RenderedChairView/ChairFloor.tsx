'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface ChairFloorProps {
  y: number;          // vertical position; place at chair's bottom edge
  radius: number;     // outer radius of the disc
  color?: string;     // base color (should match the page bg)
}

let cachedAlphaTex: THREE.Texture | null = null;

function getRadialAlphaTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  if (cachedAlphaTex) return cachedAlphaTex;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  // Hold full opacity through the inner half, then ease to transparent at the rim.
  grad.addColorStop(0.0, '#ffffff');
  grad.addColorStop(0.45, '#ffffff');
  grad.addColorStop(1.0, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;
  cachedAlphaTex = tex;
  return tex;
}

/**
 * Soft circular floor under a chair. Receives shadows where opaque; fades
 * radially to fully transparent at the rim so the shadow blends into the
 * page background instead of ending in a hard edge.
 */
export default function ChairFloor({ y, radius, color = '#fffaf4' }: ChairFloorProps) {
  const alphaMap = useMemo(() => getRadialAlphaTexture(), []);

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[radius, 64]} />
      <meshStandardMaterial
        color={color}
        alphaMap={alphaMap ?? undefined}
        transparent
        depthWrite={false}
        roughness={0.95}
        metalness={0}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
