import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface BoomerangCameraProps {
  rotation: number;
  tilt: number;
  width: number;
  height: number;
  depthOrLength: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number; // radians per second
}

const _target = new THREE.Vector3();

/**
 * Positions the camera on a spherical orbit around the origin each frame.
 * Distance is computed from the bounding diagonal + FOV so the shelf always fits.
 *
 * When autoRotate is true, the rotation prop is ignored and the camera spins
 * continuously around the Y axis at autoRotateSpeed (default 0.4 rad/s).
 */
export default function BoomerangCamera({
  rotation,
  tilt,
  width,
  height,
  depthOrLength,
  autoRotate = false,
  autoRotateSpeed = 0.4,
}: BoomerangCameraProps) {
  const { camera, size } = useThree();
  const autoRotRef = useRef(0);

  useFrame((_state, delta) => {
    const tiltRad = (tilt * Math.PI) / 180;

    // Bounding sphere diagonal with generous padding
    const diag = Math.sqrt(width * width + height * height + depthOrLength * depthOrLength);
    const fovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    let dist = (diag * 0.45) / Math.tan(fovRad / 2);

    // Pull camera back when canvas is narrow so the shelf isn't clipped
    const aspect = size.width / size.height;
    if (aspect < 1.2) {
      dist *= 1.2 / aspect;
    }

    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    let rot = rotation;
    if (autoRotate) {
      autoRotRef.current += delta * autoRotateSpeed;
      rot = autoRotRef.current;
    }

    camera.position.set(
      dist * cosT * Math.sin(rot),
      dist * sinT,
      dist * cosT * Math.cos(rot),
    );
    _target.set(0, 0, 0);
    camera.lookAt(_target);
  });

  return null;
}
