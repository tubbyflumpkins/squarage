import { useMemo } from 'react';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import { generateFlatMeshData, meshDataToGeometry } from '@/lib/shelfGeometryWasm';
import { useWoodMaterial } from './useWoodMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const THICKNESS = 0.5; // inches

interface FlatShelfMeshesProps {
  params: ShelfParams;
  finish: WoodFinish;
  wireframe?: boolean;
}

export default function FlatShelfMeshes({ params, finish, wireframe }: FlatShelfMeshesProps) {
  const material = useWoodMaterial(finish);

  const geometries = useMemo(() => {
    const result = generateFlatMeshData({
      width: params.width,
      height: params.height,
      depth: params.depth,
      shelfCount: params.shelfCount,
      columnCount: params.columnCount,
      roundLeft: params.roundLeft ?? false,
      roundRight: params.roundRight ?? false,
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
