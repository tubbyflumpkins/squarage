'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import BoomerangCamera from '@/components/shelf/RenderedShelfView/BoomerangCamera';
import ChairMeshes from './ChairMeshes';
import ChairFloor from './ChairFloor';
import CameraOrbitingLight from './CameraOrbitingLight';
import { posePresets, type PoseVariantId } from '@/lib/posePresets';
import type { ChairParams } from '@/components/chair/ChairVisualizer/types';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface RenderedChairViewProps {
  // Either pass a preset id (resolved via posePresets) OR pass `params`
  // directly (used by the morph hook so the chair can interpolate
  // between presets every frame). `params` wins if both are supplied.
  preset?: PoseVariantId;
  params?: ChairParams;
  finish?: WoodFinish;
  color?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  // Phase offset for the camera orbit, in radians. Lets sibling scenes
  // share an autoRotateSpeed without facing the same direction.
  initialRotation?: number;
  tilt?: number;
  className?: string;
  showFloor?: boolean;
  floorColor?: string;
  // Smaller = camera closer = chair larger on screen. Default 0.45.
  cameraPadding?: number;
  // Drag the chair to spin it. Auto-rotate pauses during drag and resumes
  // after a short idle.
  interactive?: boolean;
}

export default function RenderedChairView({
  preset,
  params: paramsProp,
  finish = 'Walnut',
  color,
  autoRotate = true,
  autoRotateSpeed = 0.1,
  initialRotation = 0,
  tilt = 12,
  className,
  showFloor = true,
  floorColor = '#fffaf4',
  cameraPadding = 0.45,
  interactive = false,
}: RenderedChairViewProps) {
  if (!paramsProp && !preset) {
    throw new Error('RenderedChairView: must pass either `preset` or `params`');
  }
  const params = paramsProp ?? posePresets[preset!].params;

  const alpha = (params.backAngle * Math.PI) / 180;
  const beta = (params.benchAngle * Math.PI) / 180;
  // Side frames sit inside the seat (x = fw/2 and sW-fw/2); seat slats span
  // 0..sW. Real bbox width is just seatWidth — adding frame width on top
  // would over-pull the camera back.
  const width = params.seatWidth;
  // Tight chair height — matches what generateChairGeometry's bbox produces.
  // Top of chair = max(side-frame inner-top corner z, top-back-slat extruded z)
  //              = sH + bH·cosα + max(frameWidth·sinα, thickness/2·cosα).
  // Missing the frameWidth·sinα term (the dominant one for tilted backrests
  // like Posé) puts the floor slightly above the chair's real feet.
  const chairHeight =
    params.seatHeight +
    params.backHeight * Math.cos(alpha) +
    Math.max(
      params.frameWidth * Math.sin(alpha),
      (params.thickness / 2) * Math.cos(alpha),
    );
  const depth =
    params.seatDepth +
    params.seatHeight * Math.tan(alpha) +
    params.seatHeight * Math.tan(beta) +
    params.backHeight * Math.sin(alpha);

  // Floor disc, sized to comfortably cover the chair's feet at all four
  // corners. Projected onto the screen at the camera tilt it becomes an
  // ellipse with vertical screen extent 2·radius·sin(tilt); inflate ONLY
  // the height passed to BoomerangCamera by that amount — horizontal
  // viewport at aspect>1.2 is already much larger than the disc needs, so
  // inflating w/d would only over-pull the camera. Shift the chair group
  // up by floorVisualHeight/4 so chair-top and floor-bottom land symmetric
  // around the camera target (geometry center = -fvh/4 before the shift).
  const floorRadius = showFloor ? Math.max(width, depth) * 0.7 : 0;
  const tiltRad = (tilt * Math.PI) / 180;
  const floorVisualHeight = 2 * floorRadius * Math.sin(Math.abs(tiltRad));
  const yShift = floorVisualHeight / 4;
  const effectiveHeight = chairHeight + floorVisualHeight;
  const effectiveWidth = width;
  const effectiveDepth = depth;
  const chairBottomY = -chairHeight / 2;

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 35, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      className={className}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        if (process.env.NODE_ENV !== 'production') {
          // Dev-only leak diagnostics: read __chairGL.info.memory in the
          // console — `geometries` must stay flat across style switches.
          (window as unknown as Record<string, unknown>).__chairGL = gl;
        }
      }}
    >
      <Suspense fallback={null}>
        <Environment
          preset="apartment"
          environmentIntensity={0.25}
          environmentRotation={[0, Math.PI + 0.4, 0]}
        />
        <group position={[0, yShift, 0]}>
          <ChairMeshes params={params} finish={finish} color={color} />
          {showFloor && (
            <ChairFloor y={chairBottomY} radius={floorRadius} color={floorColor} />
          )}
        </group>
      </Suspense>

      <CameraOrbitingLight
        basePosition={[-40, 60, 50]}
        intensity={2.5}
        castShadow
        shadow-radius={8}
        shadow-mapSize-width={isMobile ? 1024 : 2048}
        shadow-mapSize-height={isMobile ? 1024 : 2048}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.002}
      />
      <directionalLight position={[30, 30, -10]} intensity={0.12} />
      <ambientLight intensity={0.12} />

      <BoomerangCamera
        rotation={0}
        tilt={tilt}
        width={effectiveWidth}
        height={effectiveHeight}
        depthOrLength={effectiveDepth}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        initialRotation={initialRotation}
        cameraPadding={cameraPadding}
        interactive={interactive}
      />
    </Canvas>
  );
}
