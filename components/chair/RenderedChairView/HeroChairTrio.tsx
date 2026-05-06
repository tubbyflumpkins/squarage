'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import BoomerangCamera from '@/components/shelf/RenderedShelfView/BoomerangCamera';
import ChairMeshes from './ChairMeshes';
import ChairFloor from './ChairFloor';
import { posePresets } from '@/lib/posePresets';
import { pickDistinctRandomColors } from '@/lib/poseColors';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Five Posé chairs arranged on a circle, each facing radially outward,
// with the camera slowly orbiting the whole arrangement.
const CHAIR_COUNT = 5;
const CIRCLE_RADIUS = 34; // distance from arrangement center to each chair's center
const CAMERA_TILT = 14;
const CAMERA_AUTO_ROTATE_SPEED = 0.06;

interface HeroChairTrioProps {
  className?: string;
}

export default function HeroChairTrio({ className }: HeroChairTrioProps) {
  const params = posePresets.pose.params;

  // Same tight chair height the variant view uses, so the floor lines up
  // exactly with where the chair geometry's bbox bottom lands.
  const alpha = (params.backAngle * Math.PI) / 180;
  const chairHeight =
    params.seatHeight +
    params.backHeight * Math.cos(alpha) +
    (params.thickness / 2) * Math.cos(alpha);

  // 5 of the 10 labs palette colors, randomized per mount so the page
  // looks slightly different each visit.
  const colors = useMemo(() => pickDistinctRandomColors(CHAIR_COUNT), []);

  // Place each chair on the circle and rotate so its forward direction
  // (chair-local +Z, which is the chair's "front") points radially outward
  // from the arrangement center. Chair's local +Z reaches world direction
  // (sin α, 0, cos α) under a Y rotation of α; we want that to equal
  // (cos θ, 0, sin θ), so α = π/2 - θ.
  const chairs = useMemo(
    () =>
      Array.from({ length: CHAIR_COUNT }, (_, n) => {
        const theta = (2 * Math.PI * n) / CHAIR_COUNT;
        return {
          x: CIRCLE_RADIUS * Math.cos(theta),
          z: CIRCLE_RADIUS * Math.sin(theta),
          rotY: Math.PI / 2 - theta,
        };
      }),
    [],
  );

  // Floor must reach past the front-most foot of the outermost chair, with
  // a comfortable margin so the radial fade visibly hugs the arrangement.
  const chairCornerReach = Math.max(
    Math.hypot(params.seatWidth / 2, params.seatDepth / 2),
    12,
  );
  const floorRadius = CIRCLE_RADIUS + chairCornerReach + 4;

  // Camera fit. Treat the arrangement as a flat disc of radius
  // (CIRCLE_RADIUS + chairCornerReach) plus a chair's vertical height.
  // Inflate height to include the floor's projected screen-space extent
  // and shift the group up by floorVisualHeight/4 so chair-top and
  // floor-bottom sit symmetric around the camera target.
  const arrangementRadius = CIRCLE_RADIUS + chairCornerReach;
  const tiltRad = (CAMERA_TILT * Math.PI) / 180;
  const floorVisualHeight = 2 * floorRadius * Math.sin(tiltRad);
  // yShift = 0 puts the chair circle's geometric center at world origin
  // (camera target), which renders the chairs at canvas vertical center
  // while the floor sweeps out below them — a touch lower on screen than
  // when we shifted the whole group up by floorVisualHeight/4.
  const yShift = 0;
  // Tighter framing — passing 0.48× the actual arrangement diameter pulls
  // the camera in much closer than the bounding box would suggest. The
  // arrangement is rotationally symmetric and aspect > 1.2 always (hero is
  // wider than tall), so chairs at the back/sides still fit horizontally
  // even at this distance. Effect: chairs occupy a much taller slice of
  // the canvas.
  const camWidth = 2 * arrangementRadius * 0.48;
  const camDepth = 2 * arrangementRadius * 0.48;
  const camHeight = chairHeight + floorVisualHeight;

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 35, near: 0.1, far: 2000 }}
      gl={{ antialias: !isMobile, alpha: true }}
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
          {chairs.map(({ x, z, rotY }, n) => (
            <group
              key={n}
              position={[x, 0, z]}
              rotation={[0, rotY, 0]}
            >
              <ChairMeshes
                params={params}
                color={colors[n]}
                center
              />
            </group>
          ))}
          <ChairFloor
            y={-chairHeight / 2}
            radius={floorRadius}
            color="#fffaf4"
          />
        </group>
      </Suspense>

      <directionalLight
        position={[-60, 100, 80]}
        intensity={2.5}
        castShadow
        shadow-radius={8}
        shadow-mapSize-width={isMobile ? 1024 : 2048}
        shadow-mapSize-height={isMobile ? 1024 : 2048}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-bias={-0.002}
      />
      <directionalLight position={[40, 40, -20]} intensity={0.12} />
      <ambientLight intensity={0.12} />

      <BoomerangCamera
        rotation={0}
        tilt={CAMERA_TILT}
        width={camWidth}
        height={camHeight}
        depthOrLength={camDepth}
        autoRotate
        autoRotateSpeed={CAMERA_AUTO_ROTATE_SPEED}
      />
    </Canvas>
  );
}
