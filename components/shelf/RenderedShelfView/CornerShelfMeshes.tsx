import { useMemo } from 'react';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import { generateCornerShelfGeometry } from '@/components/shelf/CornerShelfVisualizer/geometry';
import { buildCornerShelfGeo, buildCornerColumnGeo, offsetUVs } from './buildExtrudedGeometry';
import { useWoodMaterial } from './useWoodMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const THICKNESS = 0.5; // inches

interface CornerShelfMeshesProps {
  params: CornerShelfParams;
  finish: WoodFinish;
}

export default function CornerShelfMeshes({ params, finish }: CornerShelfMeshesProps) {
  const material = useWoodMaterial(finish);

  const geometries = useMemo(() => {
    const geo = generateCornerShelfGeometry(params);
    const { width, length, height, columnAngle } = params;
    const angleRad = (Math.max(0.01, Math.min(89.99, columnAngle)) * Math.PI) / 180;

    const shelfGeos = geo.shelves.map((piece, i) => {
      const g = buildCornerShelfGeo(piece, THICKNESS, width, length, height);
      offsetUVs(g, i);
      return g;
    });
    const columnGeos = geo.columns.map((piece, i) => {
      const g = buildCornerColumnGeo(piece, THICKNESS, width, length, height, angleRad);
      offsetUVs(g, i + geo.shelves.length);
      return g;
    });

    return { shelfGeos, columnGeos };
  }, [params]);

  return (
    <group>
      {geometries.shelfGeos.map((geo, i) => (
        <mesh key={`s${i}`} geometry={geo} material={material} castShadow receiveShadow />
      ))}
      {geometries.columnGeos.map((geo, i) => (
        <mesh key={`c${i}`} geometry={geo} material={material} castShadow receiveShadow />
      ))}
    </group>
  );
}
