export enum SurfaceRole {
  StoneBenchtop = "STONE_BENCHTOP",
  StoneSplashback = "STONE_SPLASHBACK",
  StoneIsland = "STONE_ISLAND",
  Cabinetry = "CABINETRY",
  Floor = "FLOOR",
}

/*
 * These are the surfaces that accept slab textures.
 *
 * Add future stone surfaces HERE and the rest of the app
 * automatically generates state + selectors + texture mapping.
 */
export const SLAB_SURFACES = [
  {
    role: SurfaceRole.StoneBenchtop,
    label: "Benchtop",
  },
  {
    role: SurfaceRole.StoneSplashback,
    label: "Splashback",
  },
  {
    role: SurfaceRole.StoneIsland,
    label: "Island",
  },
] as const;

export type SlabSurfaceRole = (typeof SLAB_SURFACES)[number]["role"];

export function isSurfaceRole(
  materialName: string,
): materialName is SurfaceRole {
  return Object.values(SurfaceRole).includes(materialName as SurfaceRole);
}

export function isSlabSurfaceRole(
  materialName: string,
): materialName is SlabSurfaceRole {
  return SLAB_SURFACES.some(({ role }) => role === materialName);
}
