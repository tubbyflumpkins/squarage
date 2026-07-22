import { useEffect, useMemo } from 'react';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import { generateShelfGeometry } from '@/components/shelf/ShelfVisualizer/geometry';
import { buildFlatShelfGeo, buildFlatColumnGeo, offsetUVs } from './buildExtrudedGeometry';
import { addFlatShelfSlots, addFlatColumnSlots } from './slotGeometry';
import { useWoodMaterial } from './useWoodMaterial';
import { useEdgeMaterial } from './useEdgeMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const THICKNESS = 0.5; // inches

// Stable UV offset that doesn't shift when piece count changes.
const ANCHOR = 60;
const STEP = 7;
function stableOffset(i: number, n: number): number {
  if (n <= 1) return 0;
  if (i <= (n - 1) / 2) return i * STEP;
  return ANCHOR - (n - 1 - i) * STEP;
}

interface FlatShelfMeshesProps {
  params: ShelfParams;
  finish: WoodFinish;
  opacity?: number;
  depthBias?: boolean;
  center?: boolean;
}

export default function FlatShelfMeshes({ params, finish, opacity = 1, depthBias = false, center = true }: FlatShelfMeshesProps) {
  const baseWoodMaterial = useWoodMaterial(finish);
  const baseEdgeMaterial = useEdgeMaterial(finish);

  const materials = useMemo(() => {
    if (opacity >= 1 && !depthBias) return [baseWoodMaterial, baseEdgeMaterial];
    const woodMat = baseWoodMaterial.clone();
    const edgeMat = baseEdgeMaterial.clone();
    if (opacity < 1) {
      woodMat.transparent = true; woodMat.opacity = opacity;
      edgeMat.transparent = true; edgeMat.opacity = opacity;
    }
    if (depthBias) {
      woodMat.polygonOffset = true; woodMat.polygonOffsetFactor = -1; woodMat.polygonOffsetUnits = -1;
      edgeMat.polygonOffset = true; edgeMat.polygonOffsetFactor = -1; edgeMat.polygonOffsetUnits = -1;
    }
    return [woodMat, edgeMat];
  }, [baseWoodMaterial, baseEdgeMaterial, opacity, depthBias]);

  const geometries = useMemo(() => {
    const geo = generateShelfGeometry(params);
    const { width, height, depth } = params;

    const shelfGeos = geo.shelves.map((piece, i) => {
      const slotted = addFlatShelfSlots(piece, params);
      const g = buildFlatShelfGeo(slotted, THICKNESS, width, height, depth, center);
      offsetUVs(g, stableOffset(i, geo.shelves.length));
      return g;
    });
    const columnGeos = geo.columns.map((piece, i) => {
      const slotted = addFlatColumnSlots(piece, params);
      const g = buildFlatColumnGeo(slotted, THICKNESS, width, height, depth, center);
      offsetUVs(g, stableOffset(i, geo.columns.length) + 50);
      return g;
    });

    return { shelfGeos, columnGeos };
  }, [params, center]);

  // R3F never disposes geometries passed via the `geometry` prop, and
  // designer slider drags regenerate this set every frame — dispose the
  // superseded set or the GPU buffers leak (see ChairMeshes.tsx).
  useEffect(() => {
    return () => {
      geometries.shelfGeos.forEach((g) => g.dispose());
      geometries.columnGeos.forEach((g) => g.dispose());
    };
  }, [geometries]);

  return (
    <group>
      {geometries.shelfGeos.map((geo, i) => (
        <mesh key={`s${i}`} geometry={geo} material={materials} castShadow receiveShadow />
      ))}
      {geometries.columnGeos.map((geo, i) => (
        <mesh key={`c${i}`} geometry={geo} material={materials} castShadow receiveShadow />
      ))}
    </group>
  );
}
