import { useEffect, useMemo } from "react";

import { useGLTF, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { ModelDefinition } from "../data/models";
import { computeAutoFit } from "../three/meshUtils";
import { upgradeMeshTextures } from "../three/textures";

import { SurfaceRole, isSurfaceRole } from "../data/surface";

import type { SlabDefinition } from "../data/slabs";

interface ModelProps {
  model: ModelDefinition;
  slab: SlabDefinition;
}

export function Model({ model, slab }: ModelProps) {
  const { scene: source } = useGLTF(model.path);
  const slabTexture = useTexture(slab.texture);

  const gl = useThree((state) => state.gl);

  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  useEffect(() => {
    // TextureLoader textures use normal image orientation by default.
    // glTF UVs expect this flipped setting.
    slabTexture.flipY = false;

    // This is a colour/albedo texture, not linear data.
    slabTexture.colorSpace = THREE.SRGBColorSpace;

    slabTexture.wrapS = THREE.RepeatWrapping;
    slabTexture.wrapT = THREE.RepeatWrapping;

    slabTexture.anisotropy = maxAnisotropy;
    slabTexture.needsUpdate = true;
  }, [slabTexture, maxAnisotropy]);

  const scene = useMemo(() => {
    const clone = source.clone(true);

    const prepareMaterial = (
      originalMaterial: THREE.Material,
    ): THREE.Material => {
      if (!isSurfaceRole(originalMaterial.name)) {
        return originalMaterial.clone();
      }

      switch (originalMaterial.name) {
        case SurfaceRole.StoneBenchtop:
          return new THREE.MeshBasicMaterial({
            name: SurfaceRole.StoneBenchtop,
            map: slabTexture,
            color: 0xffffff,
            side: THREE.DoubleSide,
          });

        case SurfaceRole.StoneSplashback:
          return new THREE.MeshBasicMaterial({
            name: SurfaceRole.StoneSplashback,
            map: slabTexture,
            color: 0xffffff,
            side: THREE.DoubleSide,
          });

        case SurfaceRole.Cabinetry:
        case SurfaceRole.Floor:
        default:
          return originalMaterial.clone();
      }
    };

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) return;

      // Don't mutate useGLTF's cached materials.
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(prepareMaterial);
      } else if (mesh.material) {
        mesh.material = prepareMaterial(mesh.material);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    return clone;
  }, [source, slabTexture]);

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
