'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import BoomerangCamera from './BoomerangCamera';
import SheetStackMeshes from './SheetStackMeshes';
import ShelfFloor from './ShelfFloor';
import { useCanvasPause } from './useCanvasPause';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

interface RenderedSheetViewProps {
  /** The sheet, in inches, and how many lie on the stack. */
  sheet: { widthIn: number; lengthIn: number; thicknessIn: number; count: number };
  rotation: number;
  tilt: number;
  /** Camera distance multiplier (BoomerangCamera's). */
  cameraPadding?: number;
}

/**
 * The invoice page's viewer: a stack of plywood sheets on the slight floor, in the shelf
 * view's scene (same canvas, environment, lights and camera as RenderedShelfView, which is
 * tied to shelf params and cannot draw a plain slab).
 */
export default function RenderedSheetView({ sheet, rotation, tilt, cameraPadding }: RenderedSheetViewProps) {
  const { canvasRef, paused } = useCanvasPause();
  const stackHeight = sheet.count * sheet.thicknessIn;

  return (
    <Canvas
      ref={canvasRef}
      frameloop={paused ? 'never' : 'always'}
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ fov: 35, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        if (process.env.NODE_ENV !== 'production') {
          (window as unknown as Record<string, unknown>).__shelfGL = gl;
          (gl.domElement as unknown as Record<string, unknown>).__gl = gl;
        }
      }}
    >
      <Suspense fallback={null}>
        <Environment preset="apartment" environmentIntensity={0.25} environmentRotation={[0, Math.PI + 0.4, 0]} />
        <SheetStackMeshes widthIn={sheet.widthIn} lengthIn={sheet.lengthIn} thicknessIn={sheet.thicknessIn} count={sheet.count} />
      </Suspense>

      <ShelfFloor spanX={sheet.lengthIn} spanZ={sheet.widthIn} y={-stackHeight / 2} />

      {/* Key light — upper-left-front, casts shadows */}
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
        rotation={rotation}
        tilt={tilt}
        width={sheet.lengthIn}
        height={stackHeight}
        depthOrLength={sheet.widthIn}
        cameraPadding={cameraPadding}
      />
    </Canvas>
  );
}
