'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ShelfFloorProps {
  /** The shelf's footprint in inches: its width, and its depth (a corner shelf's second wall). */
  spanX: number;
  spanZ: number;
  /** Where the shelf stands. The model is centred, so this is half its height down. */
  y: number;
  /** The page behind the canvas: the floor is that surface, lit. */
  color?: string;
}

/** How far the floor reaches past the shelf: a share of its longer side, within limits (inches). */
const REACH = 0.22;
const MIN_REACH = 8;
const MAX_REACH = 18;
/** The floor is never narrower than this share of its length: a wide shelf stands in a pool, not on a stripe. */
const MIN_ASPECT = 0.5;
/** Full strength out to this share of the radius, easing to nothing at the rim. */
const CORE = 0.5;
/** It also eases to nothing over this share of the canvas at each edge, so no view can cut it off. */
const EDGE = 0.12;

/**
 * labs' shadow floor material (a lit, shadow-receiving surface in the page's colour), with its
 * two fades worked out in the shader: one outwards from the centre, one towards the canvas edges.
 */
function createFloorMaterial(color: string) {
  const bufferSize = new THREE.Vector2(1, 1);
  const material = new THREE.MeshStandardMaterial({ color, transparent: true, depthWrite: false, roughness: 0.95, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBufferSize = { value: bufferSize };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorPos = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorPos;\nuniform vec2 uBufferSize;')
      .replace(
        '#include <alphamap_fragment>',
        `#include <alphamap_fragment>
        float floorFade = 1.0 - smoothstep(${CORE.toFixed(3)}, 1.0, length(vFloorPos));
        vec2 floorScreen = gl_FragCoord.xy / uBufferSize;
        float floorToEdge = min(min(floorScreen.x, 1.0 - floorScreen.x), min(floorScreen.y, 1.0 - floorScreen.y));
        diffuseColor.a *= floorFade * smoothstep(0.0, ${EDGE.toFixed(3)}, floorToEdge);`,
      );
  };
  material.customProgramCacheKey = () => 'shelf-floor';
  return { material, bufferSize };
}

/**
 * A slight floor under a shelf: a soft oval a little larger than its footprint, which catches
 * the shelf's shadow and fades out all round. It sits just under the shelf, so it never cuts
 * into it, and fades before the canvas edges, so it is never cut off by them.
 */
export default function ShelfFloor({ spanX, spanZ, y, color = '#fffaf4' }: ShelfFloorProps) {
  const { material, bufferSize } = useMemo(() => createFloorMaterial(color), [color]);
  useEffect(() => () => material.dispose(), [material]);

  const reach = Math.max(MIN_REACH, Math.min(MAX_REACH, REACH * Math.max(spanX, spanZ)));
  const long = Math.max(spanX, spanZ) / 2 + reach;
  const radiusX = Math.max(spanX / 2 + reach, long * MIN_ASPECT);
  const radiusZ = Math.max(spanZ / 2 + reach, long * MIN_ASPECT);

  return (
    <mesh
      position={[0, y - 0.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[radiusX, radiusZ, 1]}
      material={material}
      receiveShadow
      renderOrder={-1}
      onBeforeRender={(renderer) => { renderer.getDrawingBufferSize(bufferSize); }}
    >
      {/* Unit radius: the shader reads the distance from the centre straight off the position */}
      <circleGeometry args={[1, 64]} />
    </mesh>
  );
}
