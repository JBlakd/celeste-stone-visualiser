import rawModels from "./models.json";

export interface ModelDefinition {
  id: string;
  name: string;
  path: string;
  description?: string;

  autoFit?: boolean;
  fitSize?: number;

  scale?: [number, number, number];
  rotation?: [number, number, number];
  position?: [number, number, number];

  minDistance?: number;
  maxDistance?: number;
}

export const MODELS = rawModels as ModelDefinition[];
