import rawSlabs from "./slabs.json";
import type { SlabSurfaceRole } from "./surface";

export interface SlabDefinition {
  id: string;
  sku: string;
  name: string;
  level: number;
  texture: string;
}

export type SurfaceSlabMap = Partial<Record<SlabSurfaceRole, SlabDefinition>>;

export const SLABS = rawSlabs as SlabDefinition[];
