import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface BoomerangCameraProps {
  rotation: number;
  tilt: number;
  width: number;
  height: number;
  depthOrLength: number;
}

const _target = new THREE.Vector3();

/**
 * Positions the camera on a spherical orbit around the origin each frame.
 * Distance is computed from the bounding diagonal + FOV so the shelf always fits.
 */
export default function BoomerangCamera({
  rotation,
  tilt,
  width,
  height,
  depthOrLength,
}: BoomerangCameraProps) {
  const { camera, size } = useThree();

  useFrame(() => {
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

    camera.position.set(
      dist * cosT * Math.sin(rotation),
      dist * sinT,
      dist * cosT * Math.cos(rotation),
    );
    _target.set(0, 0, 0);
    camera.lookAt(_target);
  });

  return null;
}
