import { useEffect, useMemo, useReducer } from 'react';
import * as THREE from 'three';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const EDGE_TEXTURE_PATHS: Record<WoodFinish, string> = {
  Walnut: '/textures/walnut_edge.png',
  Oak: '/textures/oak_edge.png',
  Birch: '/textures/birch_edge.png',
};

const loader = new THREE.TextureLoader();

function loadTex(path: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    loader.load(
      path,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        tex.anisotropy = 8;
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

// ---------------------------------------------------------------------------
// Texture cache — loads each finish once on demand, serves from cache after
// ---------------------------------------------------------------------------

const edgeTextureCache: Record<string, THREE.Texture | null> = {};
const edgeLoads: Partial<Record<WoodFinish, Promise<void>>> = {};

export function loadEdgeTexture(finish: WoodFinish): Promise<void> {
  const existing = edgeLoads[finish];
  if (existing) return existing;
  const load = loadTex(EDGE_TEXTURE_PATHS[finish]).then((tex) => {
    edgeTextureCache[finish] = tex;
  });
  edgeLoads[finish] = load;
  return load;
}

// Warm-up for pages with a finish picker (the shelf designer) so switching
// finishes never flashes the untextured fallback.
export function preloadAllEdgeTextures(): Promise<void> {
  return Promise.all(
    (['Walnut', 'Oak', 'Birch'] as WoodFinish[]).map(loadEdgeTexture),
  ).then(() => {});
}

// ---------------------------------------------------------------------------
// Material cache — one base material per finish
// ---------------------------------------------------------------------------

const edgeMaterialCache: Record<string, THREE.MeshStandardMaterial> = {};

function buildEdgeMaterial(finish: WoodFinish, texture: THREE.Texture | null): THREE.MeshStandardMaterial {
  const opts: THREE.MeshStandardMaterialParameters = {
    color: new THREE.Color(1, 1, 1),
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0,
  };
  if (texture) opts.map = texture;
  const mat = new THREE.MeshStandardMaterial(opts);
  if (texture) edgeMaterialCache[finish] = mat;
  return mat;
}

/**
 * Loads plywood edge texture and builds a MeshStandardMaterial.
 * Color correction is baked into the textures (no tint needed).
 */
export function useEdgeMaterial(finish: WoodFinish): THREE.MeshStandardMaterial {
  // Re-render when the requested finish's texture lands. A boolean would go
  // stale once true and swallow the re-render for later-loaded finishes.
  const [, bump] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    let cancelled = false;
    loadEdgeTexture(finish).then(() => {
      if (!cancelled) bump();
    });
    return () => { cancelled = true; };
  }, [finish]);

  const texture = edgeTextureCache[finish] ?? null;

  const material = useMemo(() => {
    if (texture && edgeMaterialCache[finish]) return edgeMaterialCache[finish];
    return buildEdgeMaterial(finish, texture);
  }, [texture, finish]);

  return material;
}
