import { useMemo, useState, useEffect } from 'react';
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
// Texture cache — preloads all finishes on first call
// ---------------------------------------------------------------------------

const edgeTextureCache: Record<string, THREE.Texture | null> = {};
let edgePreloadPromise: Promise<void> | null = null;

export function preloadAllEdgeTextures(): Promise<void> {
  if (edgePreloadPromise) return edgePreloadPromise;
  edgePreloadPromise = Promise.all(
    (['Walnut', 'Oak', 'Birch'] as WoodFinish[]).map(async (f) => {
      const tex = await loadTex(EDGE_TEXTURE_PATHS[f]);
      edgeTextureCache[f] = tex;
    }),
  ).then(() => {});
  return edgePreloadPromise;
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
  const [, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    preloadAllEdgeTextures().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const texture = edgeTextureCache[finish] ?? null;

  const material = useMemo(() => {
    if (texture && edgeMaterialCache[finish]) return edgeMaterialCache[finish];
    return buildEdgeMaterial(finish, texture);
  }, [texture, finish]);

  return material;
}
