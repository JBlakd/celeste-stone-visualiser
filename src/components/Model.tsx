import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { ModelDefinition } from "../data/models";
import { computeAutoFit } from "../three/meshUtils";
import { upgradeMeshTextures } from "../three/textures";

interface ModelProps {
  model: ModelDefinition;
}

export function Model({ model }: ModelProps) {
  const { scene: source } = useGLTF(model.path);

  const gl = useThree((state) => state.gl);

  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  const scene = useMemo(() => {
    const clone = source.clone(true);

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) return;

      // Don't mutate useGLTF's cached materials.
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((material) => material.clone());
      } else if (mesh.material) {
        mesh.material = mesh.material.clone();
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    return clone;
  }, [source]);

  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) return;

      upgradeMeshTextures(mesh, maxAnisotropy);
    });
  }, [scene, maxAnisotropy]);

  const autoFit = useMemo(() => {
    if (model.autoFit === false) {
      return {
        scale: 1,
        center: new THREE.Vector3(),
      };
    }

    return computeAutoFit(scene, model.fitSize ?? 1.2);
  }, [scene, model.autoFit, model.fitSize]);

  const baseScale = model.scale ?? [1, 1, 1];

  const finalScale: [number, number, number] = [
    baseScale[0] * autoFit.scale,
    baseScale[1] * autoFit.scale,
    baseScale[2] * autoFit.scale,
  ];

  return (
    <group
      scale={finalScale}
      rotation={model.rotation ?? [0, 0, 0]}
      position={model.position ?? [0, 0, 0]}
    >
      <group
        position={[-autoFit.center.x, -autoFit.center.y, -autoFit.center.z]}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
}
