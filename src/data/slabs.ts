import rawSlabs from "./slabs.json";

export interface SlabDefinition {
  id: string;
  sku: string;
  name: string;
  level: number;
  texture: string;
}

export const SLABS = rawSlabs as SlabDefinition[];
