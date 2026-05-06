'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import BoomerangCamera from '@/components/shelf/RenderedShelfView/BoomerangCamera';
import ChairMeshes from './ChairMeshes';
import { posePresets, poseVariantOrder } from '@/lib/posePresets';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface HeroChairTrioProps {
  finish?: WoodFinish;
  autoRotateSpeed?: number;
  tilt?: number;
  className?: string;
}

const GAP = 6;

export default function HeroChairTrio({
  finish = 'Walnut',
  autoRotateSpeed = 0.25,
  tilt = 8,
  className,
}: HeroChairTrioProps) {
  const variants = poseVariantOrder.map((id) => ({ id, params: posePresets[id].params }));

  let cursorX = 0;
  let maxHeight = 0;
  let maxDepth = 0;
  const placements = variants.map(({ id, params }) => {
    const alpha = (params.backAngle * Math.PI) / 180;
    const beta = (params.benchAngle * Math.PI) / 180;
    const w = params.seatWidth;
    const h = params.seatHeight + params.backHeight * Math.cos(alpha);
    const d =
      params.seatDepth +
      params.seatHeight * Math.tan(alpha) +
      params.seatHeight * Math.tan(beta) +
      params.backHeight * Math.sin(alpha);
    const placement = { id, params, xOffset: cursorX, width: w, height: h, depth: d };
    cursorX += w + GAP;
    if (h > maxHeight) maxHeight = h;
    if (d > maxDepth) maxDepth = d;
    return placement;
  });

  const totalWidth = cursorX - GAP;

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

        {/* Center the trio at world origin so the camera orbits around the whole group */}
        <group position={[-totalWidth / 2, -maxHeight / 2, 0]}>
          {placements.map(({ id, params, xOffset }) => (
            <group key={id} position={[xOffset, 0, 0]}>
              <ChairMeshes params={params} finish={finish} center={false} />
            </group>
          ))}
        </group>
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
        width={totalWidth}
        height={maxHeight}
        depthOrLength={maxDepth}
        autoRotate
        autoRotateSpeed={autoRotateSpeed}
      />
    </Canvas>
  );
}
