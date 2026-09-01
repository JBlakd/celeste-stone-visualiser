import { Box3, Vector3 } from "three";
import type * as THREE from "three";

export function computeAutoFit(scene: THREE.Object3D, targetSize = 1.2) {
  scene.updateMatrixWorld(true);

  const box = new Box3().setFromObject(scene);

  const size = new Vector3();
  const center = new Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;

  return {
    scale: targetSize / maxDimension,
    center,
    size,
  };
}
