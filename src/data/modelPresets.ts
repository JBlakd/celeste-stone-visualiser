import models from "./models.json";

export interface MaterialConfig {
  id: string;
  name: string;
  description: string;
  defaultColor: string;
}

export interface ModelTextures {
  baseColor?: string;
  normal?: string;
  roughness?: string;
  metallic?: string;
}

export interface ModelPreset {
  id: string;
  name: string;
  path: string;
  loader: "gltf" | "fbx";
  colorMode?: "per-material" | "body" | "per-node";
  description: string;
  materials: MaterialConfig[];
  textures?: ModelTextures;
  scale?: [number, number, number];
  rotation?: [number, number, number];
  position?: [number, number, number];
  // Per-material explode vectors. When present, configurators use these fixed
  // directions instead of the radial fallback derived from mesh centers.
  explodeMap?: Record<string, [number, number, number]>;
}

export const MODEL_PRESETS = models as ModelPreset[];
