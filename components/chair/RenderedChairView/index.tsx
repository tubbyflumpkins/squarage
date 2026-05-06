'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import BoomerangCamera from '@/components/shelf/RenderedShelfView/BoomerangCamera';
import ChairMeshes from './ChairMeshes';
import ChairFloor from './ChairFloor';
import { posePresets, type PoseVariantId } from '@/lib/posePresets';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface RenderedChairViewProps {
  preset: PoseVariantId;
  finish?: WoodFinish;
  color?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  tilt?: number;
  className?: string;
  showFloor?: boolean;
  floorColor?: string;
}

export default function RenderedChairView({
  preset,
  finish = 'Walnut',
  color,
  autoRotate = true,
  autoRotateSpeed = 0.2,
  tilt = 12,
  className,
  showFloor = true,
  floorColor = '#fffaf4',
}: RenderedChairViewProps) {
  const params = posePresets[preset].params;

  const alpha = (params.backAngle * Math.PI) / 180;
  const beta = (params.benchAngle * Math.PI) / 180;
  const width = params.seatWidth + 2 * params.frameWidth;
  // Tight chair height — matches what generateChairGeometry's bbox produces
  // (back leg foot at z=0, backrest top at sH + bH·cosα, plywood half-
  // thickness extruded along the backrest normal). The geometry centers on
  // this bbox, so the chair's bottom lands at y = -chairHeight/2 in three.js.
  const chairHeight =
    params.seatHeight +
    params.backHeight * Math.cos(alpha) +
    (params.thickness / 2) * Math.cos(alpha);
  const depth =
    params.seatDepth +
    params.seatHeight * Math.tan(alpha) +
    params.seatHeight * Math.tan(beta) +
    params.backHeight * Math.sin(alpha);

  // Floor sizing + viewport adjustment. The disc lives at the chair's
  // bottom (y = -chairHeight/2) and extends ±floorRadius in X/Z. Viewed at
  // the camera tilt it projects to a screen-space ellipse with vertical
  // extent 2·floorRadius·sin(tilt), all below the chair bbox. Inflate the
  // height passed to BoomerangCamera so the camera pulls back to include
  // the disc, and shift the chair+floor group up by half so chair-top and
  // floor-bottom sit symmetric around the camera target.
  const floorRadius = showFloor ? Math.max(width, depth) * 0.6 : 0;
  const tiltRad = (tilt * Math.PI) / 180;
  const floorVisualHeight = 2 * floorRadius * Math.sin(Math.abs(tiltRad));
  const yShift = floorVisualHeight / 2;
  const effectiveHeight = chairHeight + floorVisualHeight;
  const effectiveWidth = Math.max(width, 2 * floorRadius);
  const effectiveDepth = Math.max(depth, 2 * floorRadius);
  const chairBottomY = -chairHeight / 2;

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
        <group position={[0, yShift, 0]}>
          <ChairMeshes params={params} finish={finish} color={color} />
          {showFloor && (
            <ChairFloor y={chairBottomY} radius={floorRadius} color={floorColor} />
          )}
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
        width={effectiveWidth}
        height={effectiveHeight}
        depthOrLength={effectiveDepth}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
      />
    </Canvas>
  );
}
