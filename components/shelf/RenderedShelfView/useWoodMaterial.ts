import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { preloadAllEdgeTextures } from './useEdgeMaterial';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

// Mobile gets 1024x1024 textures, desktop gets 2048x2048
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const TEX_PREFIX = isMobile ? '/textures/mobile' : '/textures';

const TEXTURE_PATHS: Record<WoodFinish, { color: string; roughness: string; normal: string }> = {
  Walnut: {
    color: `${TEX_PREFIX}/walnut.webp`,
    roughness: `${TEX_PREFIX}/walnut_roughness.webp`,
    normal: `${TEX_PREFIX}/walnut_normal.png`,
  },
  Oak: {
    color: `${TEX_PREFIX}/oak.webp`,
    roughness: `${TEX_PREFIX}/oak_roughness.webp`,
    normal: `${TEX_PREFIX}/oak_normal.png`,
  },
  Birch: {
    color: `${TEX_PREFIX}/birch.webp`,
    roughness: `${TEX_PREFIX}/birch_roughness.webp`,
    normal: `${TEX_PREFIX}/birch_normal.png`,
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

// ---------------------------------------------------------------------------
// Material cache — one base material per finish, reused across all components
// ---------------------------------------------------------------------------

const materialCache: Record<string, THREE.MeshStandardMaterial> = {};
const EMPTY_TEX: TexSet = { color: null, roughness: null, normal: null };

function buildMaterial(finish: WoodFinish, textures: TexSet): THREE.MeshStandardMaterial {
  const hasTexture = textures.color !== null;
  const tint = COLOR_TINTS[finish];
  const opts: THREE.MeshStandardMaterialParameters = {
    color: hasTexture
      ? new THREE.Color(tint[0], tint[1], tint[2])
      : new THREE.Color(FALLBACK_COLORS[finish]),
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0,
  };
  if (textures.color) opts.map = textures.color;
  if (textures.roughness) opts.roughnessMap = textures.roughness;
  if (textures.normal) opts.normalMap = textures.normal;
  const mat = new THREE.MeshStandardMaterial(opts);
  if (hasTexture) materialCache[finish] = mat;
  return mat;
}

// ---------------------------------------------------------------------------
// Color finish — solid color riding on the Birch plywood grain.
// Used for chairs that get tinted with a non-wood color but should still feel
// like painted plywood (subtle grain through the paint, edges still show ply
// layers via useEdgeMaterial('Birch')).
// ---------------------------------------------------------------------------

const colorMaterialCache: Record<string, THREE.MeshStandardMaterial> = {};

function buildColorMaterial(color: string, birchTextures: TexSet): THREE.MeshStandardMaterial {
  const opts: THREE.MeshStandardMaterialParameters = {
    color: new THREE.Color(color),
    normalScale: new THREE.Vector2(0.15, 0.15),
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0,
  };
  // No diffuse map — solid color paints over the grain. Roughness + normal
  // maps from Birch retain the plywood surface microstructure.
  if (birchTextures.roughness) opts.roughnessMap = birchTextures.roughness;
  if (birchTextures.normal) opts.normalMap = birchTextures.normal;
  return new THREE.MeshStandardMaterial(opts);
}

/**
 * Build a color-tinted plywood material. Same texture preload pipeline as
 * useWoodMaterial — Birch maps are reused as the grain layer.
 */
export function useColorChairMaterial(color: string): THREE.MeshStandardMaterial {
  const [, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([preloadAllTextures(), preloadAllEdgeTextures()]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const birchTextures = textureCache['Birch'] ?? EMPTY_TEX;

  return useMemo(() => {
    const cacheKey = color.toLowerCase();
    if (birchTextures.roughness && colorMaterialCache[cacheKey]) {
      return colorMaterialCache[cacheKey];
    }
    const mat = buildColorMaterial(color, birchTextures);
    if (birchTextures.roughness) colorMaterialCache[cacheKey] = mat;
    return mat;
  }, [birchTextures, color]);
}

/**
 * Loads PBR wood textures (color, roughness, normal) and builds a
 * MeshStandardMaterial. All finishes are preloaded on first mount so
 * switching between them is instant.
 *
 * Reads from the module-level texture/material caches synchronously to
 * avoid the one-frame stale-state flash that useState + useEffect caused
 * when the finish prop changed mid-animation.
 */
export function useWoodMaterial(finish: WoodFinish): THREE.MeshStandardMaterial {
  // Trigger one re-render when textures first finish loading
  const [, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([preloadAllTextures(), preloadAllEdgeTextures()]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Read directly from the module-level cache — synchronous, no stale state
  const textures = textureCache[finish] ?? EMPTY_TEX;

  const material = useMemo(() => {
    // Reuse cached material if already built with textures loaded
    if (textures.color && materialCache[finish]) return materialCache[finish];
    return buildMaterial(finish, textures);
  }, [textures, finish]);

  return material;
}
