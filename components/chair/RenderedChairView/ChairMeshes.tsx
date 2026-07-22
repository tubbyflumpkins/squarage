'use client';
import { useEffect, useMemo } from 'react';
import type { ChairParams, ChairPiece } from '@/components/chair/ChairVisualizer/types';
import { generateChairGeometry } from '@/components/chair/ChairVisualizer/geometry';
import {
  buildClosedPolygonGeo,
  offsetUVs,
  S,
  SE,
  ST,
} from '@/components/shelf/RenderedShelfView/buildExtrudedGeometry';
import type { V3 } from '@/components/shelf/RenderedShelfView/buildExtrudedGeometry';
import { useWoodMaterial, useColorChairMaterial } from '@/components/shelf/RenderedShelfView/useWoodMaterial';
import { useEdgeMaterial } from '@/components/shelf/RenderedShelfView/useEdgeMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const PHI_STEP = 7;
function stableOffset(i: number): number {
  return i * PHI_STEP;
}

// Chair coord (x=width, y=depth, z=height) → Three.js (X=x, Y=z, Z=y)
function getPieceNormal(piece: ChairPiece, params: ChairParams): V3 {
  const alpha = (params.backAngle * Math.PI) / 180;
  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const beta = ((params.benchAngle ?? 0) * Math.PI) / 180;
  const sinB = Math.sin(beta);
  const cosB = Math.cos(beta);

  switch (piece.type) {
    case 'sideFrame':
      return [1, 0, 0];
    case 'frontCrosspiece':
    case 'seatSlatLR':
      return [0, sinB, cosB];
    case 'seatSlatFB':
      return [1, 0, 0];
    case 'rearCrosspiece':
      return [0, -sinA, cosA];
    case 'backSlat':
      return [0, cosA, -sinA];
    default:
      return [1, 0, 0];
  }
}

type UVFnType = (v: V3) => [number, number];

function getPieceUVs(piece: ChairPiece, params: ChairParams): { uvFlat: UVFnType; uvWall: UVFnType } {
  const alpha = (params.backAngle * Math.PI) / 180;
  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const beta = ((params.benchAngle ?? 0) * Math.PI) / 180;
  const sinB = Math.sin(beta);
  const cosB = Math.cos(beta);

  switch (piece.type) {
    case 'sideFrame':
      return {
        uvFlat: (v) => [v[2] * S, v[1] * S],
        uvWall: (v) => [v[1] * SE, v[0] * ST],
      };
    case 'frontCrosspiece':
    case 'seatSlatLR':
      return {
        uvFlat: (v) => [v[0] * S, (v[1] * cosB - v[2] * sinB) * S],
        uvWall: (v) => [(v[1] * cosB - v[2] * sinB) * SE, (v[1] * sinB + v[2] * cosB) * ST],
      };
    case 'seatSlatFB':
      return {
        uvFlat: (v) => [v[2] * S, v[1] * S],
        uvWall: (v) => [v[1] * SE, v[0] * ST],
      };
    case 'rearCrosspiece':
      return {
        uvFlat: (v) => [v[0] * S, (v[1] * cosA + v[2] * sinA) * S],
        uvWall: (v) => [(v[1] * cosA + v[2] * sinA) * SE, (v[2] * cosA - v[1] * sinA) * ST],
      };
    case 'backSlat':
      return {
        uvFlat: (v) => [v[0] * S, (v[1] * sinA + v[2] * cosA) * S],
        uvWall: (v) => [(v[1] * sinA + v[2] * cosA) * SE, (v[2] * sinA - v[1] * cosA) * ST],
      };
    default:
      return {
        uvFlat: (v) => [v[0] * S, v[1] * S],
        uvWall: (v) => [v[0] * SE, v[1] * ST],
      };
  }
}

interface ChairMeshesProps {
  params: ChairParams;
  finish?: WoodFinish;
  color?: string;
  center?: boolean;
}

export default function ChairMeshes({ params, finish = 'Walnut', color, center = true }: ChairMeshesProps) {
  // Always invoke all four hooks — color finishes pair the tinted face
  // material with Birch's plywood edge so the cut edges still read as ply.
  // When a color is active the wood-finish pair is unused, so request Birch
  // there too rather than fetching a texture set the page never renders.
  const woodMaterial = useWoodMaterial(color ? 'Birch' : finish);
  const woodEdgeMaterial = useEdgeMaterial(color ? 'Birch' : finish);
  const colorMaterial = useColorChairMaterial(color ?? '#888888');
  const birchEdgeMaterial = useEdgeMaterial('Birch');

  const materials = useMemo(
    () =>
      color
        ? [colorMaterial, birchEdgeMaterial]
        : [woodMaterial, woodEdgeMaterial],
    [color, colorMaterial, birchEdgeMaterial, woodMaterial, woodEdgeMaterial],
  );

  const geometries = useMemo(() => {
    const { pieces } = generateChairGeometry(params, center);
    return pieces.map((piece, i) => {
      const outline: V3[] = piece.outline.map((p) => [p.x, p.z, p.y]);
      const normal = getPieceNormal(piece, params);
      const { uvFlat, uvWall } = getPieceUVs(piece, params);
      const holes: V3[][] | undefined = piece.holes?.map(
        (hole) => hole.map((p) => [p.x, p.z, p.y] as V3),
      );

      const geo = buildClosedPolygonGeo(outline, normal, params.thickness, uvFlat, uvWall, holes);
      offsetUVs(geo, stableOffset(i));
      return geo;
    });
  }, [params, center]);

  // R3F never disposes geometries passed via the `geometry` prop (only
  // objects it constructs itself), and the style morph replaces this array
  // every animation frame — WebGL buffers are not garbage-collected, so
  // without explicit disposal each morph leaks ~40 GPU buffer sets per
  // frame until iOS kills the tab. React runs this cleanup after the commit
  // that attached the NEW geometries, so it only ever disposes the
  // superseded set — and the final set on unmount.
  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
    };
  }, [geometries]);

  return (
    <group>
      {geometries.map((geo, i) => (
        <mesh key={`chair-${i}`} geometry={geo} material={materials} castShadow receiveShadow />
      ))}
    </group>
  );
}
