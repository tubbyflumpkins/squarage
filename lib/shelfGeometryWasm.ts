import * as THREE from 'three';

// Types matching the WASM output (camelCase via serde)

export interface DerivedParams {
  amplitude: number;
  shelfOffset: number;
  columnOffset: number;
  columnAngle: number;
  price: number;
}

export interface PieceMeshData {
  positions: number[];
  uvs: number[];
}

export interface FlatMeshResult {
  shelves: PieceMeshData[];
  columns: PieceMeshData[];
  derived: DerivedParams;
}

export interface CornerMeshResult {
  shelves: PieceMeshData[];
  columns: PieceMeshData[];
  derived: DerivedParams;
}

interface SvgShelfPaths {
  frontPath: string;
  backPath: string;
  sidePoints: number[];
}

interface SvgCornerShelfPaths {
  frontPath: string;
  backXPath: string;
  backYPath: string;
  widthSide: number[];
  lengthSide: number[];
}

interface SvgColumnPaths {
  frontPath: string;
  backPath: string;
  sidePoints: number[];
}

interface SvgBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface FlatSvgResult {
  shelves: SvgShelfPaths[];
  columns: SvgColumnPaths[];
  bounds: SvgBounds;
}

export interface CornerSvgResult {
  shelves: SvgCornerShelfPaths[];
  columns: SvgColumnPaths[];
  bounds: SvgBounds;
}

export type SvgResult =
  | { type: 'flat' } & FlatSvgResult
  | { type: 'corner' } & CornerSvgResult;

// Input types

export interface FlatMeshInput {
  width: number;
  height: number;
  depth: number;
  shelfCount: number;
  columnCount: number;
  roundLeft: boolean;
  roundRight: boolean;
  thickness: number;
}

export interface CornerMeshInput {
  width: number;
  height: number;
  depth: number;
  length: number;
  shelfCount: number;
  columnCount: number;
  thickness: number;
}

export interface SvgInput {
  isCorner: boolean;
  width: number;
  height: number;
  depth: number;
  length: number;
  shelfCount: number;
  columnCount: number;
  roundLeft: boolean;
  roundRight: boolean;
  rotation: number;
  tilt: number;
}

export interface DerivedParamsInput {
  isCorner: boolean;
  width: number;
  height: number;
  depth: number;
  length: number;
  shelfCount: number;
  columnCount: number;
}

// ---------------------------------------------------------------------------
// Lazy WASM loading
// ---------------------------------------------------------------------------

type WasmModule = typeof import('./wasm-pkg/wasm_shelf_geometry');

let wasmModule: WasmModule | null = null;
let wasmPromise: Promise<WasmModule> | null = null;

export async function preloadShelfWasm(): Promise<void> {
  if (wasmModule) return;
  if (!wasmPromise) {
    wasmPromise = import('./wasm-pkg/wasm_shelf_geometry').then((mod) => {
      wasmModule = mod;
      return mod;
    });
  }
  await wasmPromise;
}

function getWasm(): WasmModule {
  if (!wasmModule) throw new Error('WASM not loaded — call preloadShelfWasm() first');
  return wasmModule;
}

export function isWasmReady(): boolean {
  return wasmModule !== null;
}

// React hook
import { useState, useEffect } from 'react';

export function useShelfWasm(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    preloadShelfWasm().then(() => setReady(true));
  }, []);
  return ready;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function generateFlatMeshData(input: FlatMeshInput): FlatMeshResult {
  return getWasm().generate_flat_mesh_data(input) as FlatMeshResult;
}

export function generateCornerMeshData(input: CornerMeshInput): CornerMeshResult {
  return getWasm().generate_corner_mesh_data(input) as CornerMeshResult;
}

export function generateSvgProjection(input: SvgInput): SvgResult {
  return getWasm().generate_svg_projection(input) as SvgResult;
}

export function computeDerivedParams(input: DerivedParamsInput): DerivedParams {
  return getWasm().compute_derived_params(input) as DerivedParams;
}

// ---------------------------------------------------------------------------
// THREE.js helper
// ---------------------------------------------------------------------------

export function meshDataToGeometry(data: PieceMeshData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
  geo.computeVertexNormals();
  return geo;
}
