'use client';

import { useEffect, useMemo } from 'react';
import type { Point3D } from '@/components/shelf/ShelfVisualizer/types';
import { buildFlatShelfGeo, offsetUVs } from './buildExtrudedGeometry';
import { useWoodMaterial } from './useWoodMaterial';
import { useEdgeMaterial } from './useEdgeMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface SheetStackMeshesProps {
  /** One sheet, in inches: its short side, its long side (along X) and its thickness. */
  widthIn: number;
  lengthIn: number;
  thicknessIn: number;
  /** How many sheets lie on the stack. */
  count: number;
  finish?: WoodFinish;
}

const PHI = 0.6180339887;
/** Inches a sheet may sit off the one under it, so the stack reads as plywood and not a block. */
const JITTER = 0.35;

/**
 * A stack of plywood sheets, lying flat and centred on the origin: `count` slabs of
 * `lengthIn × widthIn × thicknessIn`. Each slab is a straight-edged shelf piece through the
 * shelf's own geometry builder, so it gets the wood faces, the ply edges and the grain scale
 * the shelves have.
 */
export default function SheetStackMeshes({ widthIn, lengthIn, thicknessIn, count, finish = 'Birch' }: SheetStackMeshesProps) {
  const wood = useWoodMaterial(finish);
  const edge = useEdgeMaterial(finish);
  const materials = useMemo(() => [wood, edge], [wood, edge]);

  const sheets = useMemo(() => {
    const stackHeight = count * thicknessIn;
    return Array.from({ length: count }, (_, i) => {
      // Shelf coordinates: x along the width passed to the builder, y its depth, z its height
      const z = thicknessIn / 2 + i * thicknessIn;
      const front: [Point3D, Point3D] = [{ x: 0, y: widthIn, z }, { x: lengthIn, y: widthIn, z }];
      const back: [Point3D, Point3D] = [{ x: 0, y: 0, z }, { x: lengthIn, y: 0, z }];
      const geo = buildFlatShelfGeo(
        { frontEdge: front, backEdge: back, leftSide: [back[0], front[0]], rightSide: [back[1], front[1]] },
        thicknessIn, lengthIn, stackHeight, widthIn,
      );
      offsetUVs(geo, i * 7);
      // The bottom sheet sits square; the rest settle a little off it, the same way every time
      const jx = i === 0 ? 0 : (((i * PHI) % 1) - 0.5) * 2 * JITTER;
      const jz = i === 0 ? 0 : (((i * PHI * 1.7) % 1) - 0.5) * 2 * JITTER;
      return { geo, offset: [jx, 0, jz] as [number, number, number] };
    });
  }, [widthIn, lengthIn, thicknessIn, count]);

  // R3F never disposes geometries passed via the `geometry` prop: free the superseded set
  // (the mobile OOM rule, see FlatShelfMeshes).
  useEffect(() => {
    return () => { sheets.forEach((s) => s.geo.dispose()); };
  }, [sheets]);

  return (
    <group>
      {sheets.map((s, i) => (
        <mesh key={i} geometry={s.geo} material={materials} position={s.offset} castShadow receiveShadow />
      ))}
    </group>
  );
}
