import { useMemo } from 'react';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import { generateShelfGeometry } from '@/components/shelf/ShelfVisualizer/geometry';
import { buildFlatShelfGeo, buildFlatColumnGeo, offsetUVs } from './buildExtrudedGeometry';
import { useWoodMaterial } from './useWoodMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const THICKNESS = 0.5; // inches

interface FlatShelfMeshesProps {
  params: ShelfParams;
  finish: WoodFinish;
}

export default function FlatShelfMeshes({ params, finish }: FlatShelfMeshesProps) {
  const material = useWoodMaterial(finish);

  const geometries = useMemo(() => {
    const geo = generateShelfGeometry(params);
    const { width, height, depth } = params;

    const shelfGeos = geo.shelves.map((piece, i) => {
      const g = buildFlatShelfGeo(piece, THICKNESS, width, height, depth);
      offsetUVs(g, i);
      return g;
    });
    const columnGeos = geo.columns.map((piece, i) => {
      const g = buildFlatColumnGeo(piece, THICKNESS, width, height, depth);
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
