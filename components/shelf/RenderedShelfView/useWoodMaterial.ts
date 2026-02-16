import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

const TEXTURE_PATHS: Record<WoodFinish, { color: string; roughness: string; normal: string }> = {
  Walnut: {
    color: '/textures/walnut.png',
    roughness: '/textures/walnut_roughness.png',
    normal: '/textures/walnut_normal.png',
  },
  Oak: {
    color: '/textures/oak.png',
    roughness: '/textures/oak_roughness.png',
    normal: '/textures/oak_normal.png',
  },
  Birch: {
    color: '/textures/birch.png',
    roughness: '/textures/birch_roughness.png',
    normal: '/textures/birch_normal.png',
  },
};

// Fallback colors shown while textures load (or if files are missing)
const FALLBACK_COLORS: Record<WoodFinish, string> = {
  Walnut: '#7A6B55',
  Oak: '#B08D57',
  Birch: '#E8D5B7',
};

// Per-finish color tints applied on top of the texture map.
// Values > 1 brighten; < 1 darken. Walnut and birch textures are too dark.
const COLOR_TINTS: Record<WoodFinish, [number, number, number]> = {
  Walnut: [1.28, 1.05, 0.82], // warm chocolate brown
  Oak: [1.0, 1.0, 1.0],       // no tint
  Birch: [1.4, 1.3, 1.05],     // warm tan
};

const loader = new THREE.TextureLoader();

function loadTex(path: string, srgb: boolean): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    loader.load(
      path,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        tex.anisotropy = 8;
        // Color maps use sRGB; data maps (roughness, normal) stay linear
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

// ---------------------------------------------------------------------------
// Texture cache — preloads all finishes on first call, serves from cache after
// ---------------------------------------------------------------------------

type TexSet = { color: THREE.Texture | null; roughness: THREE.Texture | null; normal: THREE.Texture | null };

const textureCache: Record<string, TexSet> = {};
let preloadPromise: Promise<void> | null = null;

function preloadAllTextures(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadPromise = Promise.all(
    (['Walnut', 'Oak', 'Birch'] as WoodFinish[]).map(async (f) => {
      const paths = TEXTURE_PATHS[f];
      const [color, roughness, normal] = await Promise.all([
        loadTex(paths.color, true),
        loadTex(paths.roughness, false),
        loadTex(paths.normal, false),
      ]);
      textureCache[f] = { color, roughness, normal };
    }),
  ).then(() => {});
  return preloadPromise;
}

/**
 * Loads PBR wood textures (color, roughness, normal) and builds a
 * MeshStandardMaterial. All finishes are preloaded on first mount so
 * switching between them is instant.
 */
export function useWoodMaterial(finish: WoodFinish): THREE.MeshStandardMaterial {
  const [textures, setTextures] = useState<TexSet>(
    () => textureCache[finish] ?? { color: null, roughness: null, normal: null },
  );

  useEffect(() => {
    let cancelled = false;
    preloadAllTextures().then(() => {
      if (!cancelled && textureCache[finish]) setTextures(textureCache[finish]);
    });
    return () => { cancelled = true; };
  }, [finish]);

  return useMemo(() => {
    const hasTexture = textures.color !== null;

    const tint = COLOR_TINTS[finish];
    const opts: THREE.MeshStandardMaterialParameters = {
      color: hasTexture
        ? new THREE.Color(tint[0], tint[1], tint[2])
        : new THREE.Color(FALLBACK_COLORS[finish]),
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.75,
      metalness: 0.0,
      side: THREE.DoubleSide,
      envMapIntensity: 0.18,
    };
    if (textures.color) opts.map = textures.color;
    if (textures.roughness) opts.roughnessMap = textures.roughness;
    if (textures.normal) opts.normalMap = textures.normal;
    return new THREE.MeshStandardMaterial(opts);
  }, [textures, finish]);
}
