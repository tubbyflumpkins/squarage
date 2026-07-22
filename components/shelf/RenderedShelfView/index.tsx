'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import BoomerangCamera from './BoomerangCamera';
import FlatShelfMeshes from './FlatShelfMeshes';
import CornerShelfMeshes from './CornerShelfMeshes';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface RenderedShelfViewProps {
  isCorner: boolean;
  flatParams: ShelfParams;
  cornerParams: CornerShelfParams;
  rotation: number;
  tilt: number;
  finish: WoodFinish;
  width: number;
  height: number;
  depth: number;
  length: number;
}

export default function RenderedShelfView({
  isCorner,
  flatParams,
  cornerParams,
  rotation,
  tilt,
  finish,
  width,
  height,
  depth,
  length,
}: RenderedShelfViewProps) {
  // Stop the render loop while the canvas is fully offscreen or the tab is
  // hidden. This also covers QuoteFlow's always-mounted copies, which sit
  // translated off-viewport and otherwise render at 60fps unseen.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let offscreen = false;
    let hidden = document.visibilityState === 'hidden';
    const update = () => setPaused(offscreen || hidden);
    const io = new IntersectionObserver(([entry]) => {
      offscreen = !entry.isIntersecting;
      update();
    });
    io.observe(el);
    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden';
      update();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

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
          // Dev-only leak diagnostics: read __shelfGL.info.memory in the
          // console — `geometries` must stay flat while scrubbing sliders.
          (window as unknown as Record<string, unknown>).__shelfGL = gl;
        }
      }}
    >
      <Suspense fallback={null}>
        {/* Soft environment for subtle reflections — "apartment" is much
            gentler than "studio" which has harsh bright panels */}
        <Environment preset="apartment" environmentIntensity={0.25} environmentRotation={[0, Math.PI + 0.4, 0]} />

        {/* Shelf geometry */}
        {isCorner ? (
          <CornerShelfMeshes params={cornerParams} finish={finish} />
        ) : (
          <FlatShelfMeshes params={flatParams} finish={finish} />
        )}
      </Suspense>

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
      {/* Fill light — right side, softer */}
      <directionalLight position={[30, 30, -10]} intensity={0.12} />
      {/* Ambient base — prevents pure black shadows */}
      <ambientLight intensity={0.12} />

      {/* Camera control */}
      <BoomerangCamera
        rotation={rotation}
        tilt={tilt}
        width={width}
        height={height}
        depthOrLength={isCorner ? Math.max(depth, length) : depth}
      />
    </Canvas>
  );
}
