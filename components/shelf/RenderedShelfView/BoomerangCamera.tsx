import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BoomerangCameraProps {
  rotation: number;
  tilt: number;
  width: number;
  height: number;
  depthOrLength: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number; // radians per second
  /**
   * Phase offset for the auto-rotate, in radians. Used by sibling chair
   * scenes that share a rotation speed but should not all face the same
   * direction at the same time.
   */
  initialRotation?: number;
  /**
   * Multiplier on the bounding-sphere distance. Smaller = camera closer
   * = subject larger on screen. Default 0.45 keeps existing call sites
   * unchanged; the product page passes ~0.32 to zoom in.
   */
  cameraPadding?: number;
  /**
   * If true, horizontal pointer drags rotate the camera around Y.
   * Auto-rotate pauses while dragging and resumes after a brief idle.
   */
  interactive?: boolean;
}

const _target = new THREE.Vector3();
const RESUME_DELAY_MS = 1500;
const DRAG_SENSITIVITY = 0.008; // radians per pixel

export default function BoomerangCamera({
  rotation,
  tilt,
  width,
  height,
  depthOrLength,
  autoRotate = false,
  autoRotateSpeed = 0.4,
  initialRotation = 0,
  cameraPadding = 0.45,
  interactive = false,
}: BoomerangCameraProps) {
  const { camera, size, gl } = useThree();
  const rotationRef = useRef(initialRotation);
  const isDraggingRef = useRef(false);
  const lastClientXRef = useRef(0);
  // -Infinity so auto-rotate runs from the very first frame (until the
  // user actually drags). After a drag, set to performance.now() so the
  // resume delay starts from release.
  const lastInteractionRef = useRef(-Infinity);

  useEffect(() => {
    if (!interactive) return;
    const dom = gl.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';

    const onDown = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0) return; // left button only
      isDraggingRef.current = true;
      lastClientXRef.current = e.clientX;
      dom.style.cursor = 'grabbing';
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {}
    };
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastClientXRef.current;
      lastClientXRef.current = e.clientX;
      rotationRef.current += dx * DRAG_SENSITIVITY;
    };
    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      lastInteractionRef.current = performance.now();
      dom.style.cursor = 'grab';
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {}
    };

    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerup', onUp);
    dom.addEventListener('pointercancel', onUp);
    return () => {
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointercancel', onUp);
      dom.style.cursor = '';
      dom.style.touchAction = '';
    };
  }, [interactive, gl]);

  useFrame((_state, delta) => {
    const tiltRad = (tilt * Math.PI) / 180;

    const diag = Math.sqrt(width * width + height * height + depthOrLength * depthOrLength);
    const fovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    let dist = (diag * cameraPadding) / Math.tan(fovRad / 2);

    const aspect = size.width / size.height;
    if (aspect < 1.2) {
      dist *= 1.2 / aspect;
    }

    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    let rot: number;
    if (interactive) {
      const idleMs = performance.now() - lastInteractionRef.current;
      const shouldAutoRotate =
        autoRotate && !isDraggingRef.current && idleMs > RESUME_DELAY_MS;
      if (shouldAutoRotate) {
        rotationRef.current += delta * autoRotateSpeed;
      }
      rot = rotationRef.current;
    } else if (autoRotate) {
      rotationRef.current += delta * autoRotateSpeed;
      rot = rotationRef.current;
    } else {
      rot = rotation;
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
