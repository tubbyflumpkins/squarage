'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import BoomerangCamera from '@/components/shelf/RenderedShelfView/BoomerangCamera';
import ChairMeshes from './ChairMeshes';
import { posePresets, poseVariantOrder, type PoseVariantId } from '@/lib/posePresets';
import { POSE_COLOR_PALETTE } from '@/lib/poseColors';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Hero is now an isometric grid: chairs tiled across rows × cols, viewed from
// a static camera at 45° azimuth + 45° tilt, all colors visible at once.
const COLS = 5;
const ROWS = 3;
const CELL_W = 26; // inches per cell (chair width + gap)
const CELL_D = 28; // inches per cell (chair depth + gap)

interface HeroChairTrioProps {
  className?: string;
}

function chairHeightOf(preset: PoseVariantId): number {
  const p = posePresets[preset].params;
  const alpha = (p.backAngle * Math.PI) / 180;
  return (
    p.seatHeight +
    p.backHeight * Math.cos(alpha) +
    (p.thickness / 2) * Math.cos(alpha)
  );
}

export default function HeroChairTrio({ className }: HeroChairTrioProps) {
  const cells = useMemo(() => {
    const out: Array<{
      preset: PoseVariantId;
      color: string;
      col: number;
      row: number;
    }> = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        // Cycle through the three presets so each model appears in every row.
        const preset = poseVariantOrder[idx % poseVariantOrder.length];
        // Cycle through the labs palette — 10 colors, 15 cells, so 5 colors
        // appear twice. Offsetting by row prevents adjacent same-color repeats.
        const color =
          POSE_COLOR_PALETTE[
            (idx + r * 2) % POSE_COLOR_PALETTE.length
          ];
        out.push({ preset, color, col: c, row: r });
      }
    }
    return out;
  }, []);

  const totalW = COLS * CELL_W;
  const totalD = ROWS * CELL_D;

  // Camera fit: pass the grid's diagonal as the dominant dimension so the
  // 45°-azimuth view (which sees the grid corner-to-corner) fits the
  // intended bounds. Slight under-sizing crops the grid edges off-screen,
  // giving the "chair texture" feel where the pattern continues past the
  // viewport.
  const gridDiag = Math.sqrt(totalW * totalW + totalD * totalD);
  const camWidth = gridDiag * 0.7;
  const camDepth = gridDiag * 0.7;
  const camHeight = 40;

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

        {/* Grid centered at world origin so the camera (looking at origin) sees
            it head-on. Each cell sits at its center; chairs are vertically
            centered geometry-wise so we lift each by half its own height to
            land its feet at y = 0. */}
        <group position={[-totalW / 2 + CELL_W / 2, 0, -totalD / 2 + CELL_D / 2]}>
          {cells.map(({ preset, color, col, row }) => {
            const h = chairHeightOf(preset);
            return (
              <group
                key={`${col}-${row}`}
                position={[col * CELL_W, h / 2, row * CELL_D]}
              >
                <ChairMeshes
                  params={posePresets[preset].params}
                  color={color}
                  center
                />
              </group>
            );
          })}
        </group>
      </Suspense>

      <directionalLight
        position={[-60, 100, 80]}
        intensity={2.5}
        castShadow
        shadow-radius={8}
        shadow-mapSize-width={isMobile ? 1024 : 2048}
        shadow-mapSize-height={isMobile ? 1024 : 2048}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-bias={-0.002}
      />
      <directionalLight position={[40, 40, -20]} intensity={0.12} />
      <ambientLight intensity={0.12} />

      <BoomerangCamera
        rotation={Math.PI / 4}
        tilt={45}
        width={camWidth}
        height={camHeight}
        depthOrLength={camDepth}
      />
    </Canvas>
  );
}
