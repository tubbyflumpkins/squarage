'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import BoomerangCamera from '@/components/shelf/RenderedShelfView/BoomerangCamera';
import ChairMeshes from './ChairMeshes';
import { posePresets, type PoseVariantId } from '@/lib/posePresets';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface RenderedChairViewProps {
  preset: PoseVariantId;
  finish?: WoodFinish;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  tilt?: number;
  className?: string;
}

export default function RenderedChairView({
  preset,
  finish = 'Walnut',
  autoRotate = true,
  autoRotateSpeed = 0.4,
  tilt = 12,
  className,
}: RenderedChairViewProps) {
  const params = posePresets[preset].params;

  // Approximate axis-aligned bounding box for camera fitting. Slight overshoot
  // is fine — BoomerangCamera's 0.45 padding factor keeps the chair in frame.
  const alpha = (params.backAngle * Math.PI) / 180;
  const beta = (params.benchAngle * Math.PI) / 180;
  const width = params.seatWidth + 2 * params.frameWidth;
  const height = params.seatHeight + params.backHeight * Math.cos(alpha);
  const depth =
    params.seatDepth +
    params.seatHeight * Math.tan(alpha) +
    params.seatHeight * Math.tan(beta) +
    params.backHeight * Math.sin(alpha);

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 35, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: true }}
      dpr={isMobile ? [1.5, 3] : undefined}
      style={{ background: 'transparent' }}
      className={className}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <Suspense fallback={null}>
        <Environment
          preset="apartment"
          environmentIntensity={0.25}
          environmentRotation={[0, Math.PI + 0.4, 0]}
        />
        <ChairMeshes params={params} finish={finish} />
      </Suspense>

      <directionalLight
        position={[-40, 60, 50]}
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
        width={width}
        height={height}
        depthOrLength={depth}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
      />
    </Canvas>
  );
}
