'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// Directional key light that orbits with the camera around the world Y axis.
// Why: BoomerangCamera moves the camera around the scene; if the light stays
// fixed in world space, the chair's lit side rotates relative to the viewer's
// frame, which reads as "the light is glued to the scene." Re-deriving the
// light position each frame from the camera's current Y rotation keeps the
// light's apparent direction constant from the viewer's perspective.
interface CameraOrbitingLightProps {
  basePosition: [number, number, number];
  intensity?: number;
  castShadow?: boolean;
  'shadow-radius'?: number;
  'shadow-mapSize-width'?: number;
  'shadow-mapSize-height'?: number;
  'shadow-camera-left'?: number;
  'shadow-camera-right'?: number;
  'shadow-camera-top'?: number;
  'shadow-camera-bottom'?: number;
  'shadow-camera-near'?: number;
  'shadow-camera-far'?: number;
  'shadow-bias'?: number;
}

export default function CameraOrbitingLight({
  basePosition,
  ...props
}: CameraOrbitingLightProps) {
  const { camera } = useThree();
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    // Camera's azimuth (angle around world Y, measured from +Z toward +X).
    const angle = Math.atan2(camera.position.x, camera.position.z);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const [bx, by, bz] = basePosition;
    // Apply the same Y-rotation to the base light position so the light
    // stays at a fixed offset relative to the camera.
    lightRef.current.position.set(
      bx * c + bz * s,
      by,
      -bx * s + bz * c,
    );
  });

  return (
    <directionalLight ref={lightRef} position={basePosition} {...props} />
  );
}
