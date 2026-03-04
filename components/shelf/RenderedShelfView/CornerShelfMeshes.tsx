import { useMemo } from 'react';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import { generateCornerMeshData, meshDataToGeometry } from '@/lib/shelfGeometryWasm';
import { useWoodMaterial } from './useWoodMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const THICKNESS = 0.5; // inches

interface CornerShelfMeshesProps {
  params: CornerShelfParams;
  finish: WoodFinish;
  wireframe?: boolean;
}

export default function CornerShelfMeshes({ params, finish, wireframe }: CornerShelfMeshesProps) {
  const material = useWoodMaterial(finish);

  const geometries = useMemo(() => {
    const result = generateCornerMeshData({
      width: params.width,
      height: params.height,
      depth: params.depth,
      length: params.length,
      shelfCount: params.shelfCount,
      columnCount: params.columnCount,
      thickness: THICKNESS,
    });

    return {
      shelfGeos: result.shelves.map(meshDataToGeometry),
      columnGeos: result.columns.map(meshDataToGeometry),
    };
  }, [params]);

  return (
    <group>
      {geometries.shelfGeos.map((geo, i) => (
        <mesh key={`s${i}`} geometry={geo} castShadow receiveShadow>
          {wireframe ? (
            <meshStandardMaterial wireframe color="white" />
          ) : (
            <primitive object={material} attach="material" />
          )}
        </mesh>
      ))}
      {geometries.columnGeos.map((geo, i) => (
        <mesh key={`c${i}`} geometry={geo} castShadow receiveShadow>
          {wireframe ? (
            <meshStandardMaterial wireframe color="white" />
          ) : (
            <primitive object={material} attach="material" />
          )}
        </mesh>
      ))}
    </group>
  );
}
