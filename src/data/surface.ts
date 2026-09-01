export enum SurfaceRole {
  StoneBenchtop = "STONE_BENCHTOP",
  StoneSplashback = "STONE_SPLASHBACK",
  Cabinetry = "CABINETRY",
  Floor = "FLOOR",
}

export function isSurfaceRole(
  materialName: string,
): materialName is SurfaceRole {
  return Object.values(SurfaceRole).includes(materialName as SurfaceRole);
}
