import { useMemo } from 'react';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import { generateCornerShelfGeometry } from '@/components/shelf/CornerShelfVisualizer/geometry';
import { buildCornerShelfGeo, buildCornerColumnGeo, offsetUVs } from './buildExtrudedGeometry';
import { addCornerShelfSlots, addCornerColumnSlots } from './slotGeometry';
import { useWoodMaterial } from './useWoodMaterial';
import { useEdgeMaterial } from './useEdgeMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const THICKNESS = 0.5; // inches

// Stable UV offset — see FlatShelfMeshes.tsx for rationale
const ANCHOR = 60;
const STEP = 7;
function stableOffset(i: number, n: number): number {
  if (n <= 1) return 0;
  if (i <= (n - 1) / 2) return i * STEP;
  return ANCHOR - (n - 1 - i) * STEP;
}

interface CornerShelfMeshesProps {
  params: CornerShelfParams;
  finish: WoodFinish;
  opacity?: number;
  depthBias?: boolean;
  center?: boolean;
}

export default function CornerShelfMeshes({ params, finish, opacity = 1, depthBias = false, center = true }: CornerShelfMeshesProps) {
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
    const geo = generateCornerShelfGeometry(params);
    const { width, length, height, columnAngle } = params;
    const angleRad = (Math.max(0.01, Math.min(89.99, columnAngle)) * Math.PI) / 180;

    const shelfGeos = geo.shelves.map((piece, i) => {
      const slotted = addCornerShelfSlots(piece, params);
      const g = buildCornerShelfGeo(slotted, THICKNESS, width, length, height, angleRad, center);
      offsetUVs(g, stableOffset(i, geo.shelves.length));
      return g;
    });
    const columnGeos = geo.columns.map((piece, i) => {
      const slotted = addCornerColumnSlots(piece, params);
      const g = buildCornerColumnGeo(slotted, THICKNESS, width, length, height, angleRad, center);
      offsetUVs(g, stableOffset(i, geo.columns.length) + 50);
      return g;
    });

    return { shelfGeos, columnGeos };
  }, [params, center]);

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
