import { useEffect, useMemo, useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { ModelDefinition } from "../data/models";
import type { SurfaceSlabMap } from "../data/slabs";

import {
  SLAB_SURFACES,
  isSlabSurfaceRole,
  type SlabSurfaceRole,
} from "../data/surface";

import { computeAutoFit } from "../three/meshUtils";
import { upgradeMeshTextures } from "../three/textures";

interface ModelProps {
  model: ModelDefinition;
  surfaceSlabs: SurfaceSlabMap;
}

export function Model({ model, surfaceSlabs }: ModelProps) {
  const { scene: source } = useGLTF(model.path);

  const gl = useThree((state) => state.gl);

  const currentSlabTextures = useRef(new Map<SlabSurfaceRole, THREE.Texture>());

  const currentSlabUrls = useRef(new Map<SlabSurfaceRole, string>());
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  const isMobile = useIsMobile();

  /*
   * Clone the kitchen ONCE PER MODEL.
   *
   * Slab changes no longer rebuild this entire scene.
   */
  const { scene, slabMaterials } = useMemo(() => {
    const clone = source.clone(true);

    /*
     * One shared material per role.
     *
     * If island + rear bench both use STONE_BENCHTOP,
     * they reuse the exact same material instance.
     */
    const slabMaterials = new Map<
      SlabSurfaceRole,
      THREE.MeshStandardMaterial
    >();

    const prepareMaterial = (
      originalMaterial: THREE.Material,
    ): THREE.Material => {
      if (!isSlabSurfaceRole(originalMaterial.name)) {
        return originalMaterial.clone();
      }

      const role = originalMaterial.name;

      const existing = slabMaterials.get(role);

      if (existing) {
        return existing;
      }

      const material = new THREE.MeshStandardMaterial({
        name: role,
        color: 0xffffff,
        roughness: 0.25,
        metalness: 0,
        side: THREE.DoubleSide,
      });

      slabMaterials.set(role, material);

      return material;
    };

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) return;

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(prepareMaterial);
      } else if (mesh.material) {
        mesh.material = prepareMaterial(mesh.material);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    return {
      scene: clone,
      slabMaterials,
    };
  }, [source]);

  /*
   * Upgrade the kitchen's ORIGINAL textures once.
   */
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) return;

      upgradeMeshTextures(mesh, maxAnisotropy);
    });
  }, [scene, maxAnisotropy]);

  useEffect(() => {
    let cancelled = false;

    const loader = new THREE.TextureLoader();

    loader.setCrossOrigin("anonymous");

    for (const { role } of SLAB_SURFACES) {
      const slab = surfaceSlabs[role];
      const material = slabMaterials.get(role);

      /*
       * Model might not actually contain this role.
       *
       * No material = don't load the fucken texture.
       */
      if (!slab || !material) {
        continue;
      }

      /*
       * Nothing changed for this surface.
       *
       * This is important:
       * changing splashback must NOT reload benchtop.
       */
      if (currentSlabUrls.current.get(role) === slab.texture) {
        continue;
      }

      const textureUrl = slab.texture;

      loader.load(
        textureUrl,

        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }

          texture.flipY = false;
          texture.colorSpace = THREE.SRGBColorSpace;

          texture.wrapS = THREE.RepeatWrapping;

          texture.wrapT = THREE.RepeatWrapping;

          if (isMobile) {
            texture.generateMipmaps = false;

            texture.minFilter = THREE.LinearFilter;

            texture.magFilter = THREE.LinearFilter;

            texture.anisotropy = Math.min(maxAnisotropy, 4);
          } else {
            texture.generateMipmaps = true;

            texture.minFilter = THREE.LinearMipmapLinearFilter;

            texture.magFilter = THREE.LinearFilter;

            texture.anisotropy = maxAnisotropy;
          }

          texture.needsUpdate = true;

          /*
           * Replace ONLY this role.
           */
          material.map = texture;
          material.needsUpdate = true;

          const previousTexture = currentSlabTextures.current.get(role);

          currentSlabTextures.current.set(role, texture);

          currentSlabUrls.current.set(role, textureUrl);

          /*
           * Murder previous GPU texture for
           * THIS surface only.
           */
          if (previousTexture && previousTexture !== texture) {
            previousTexture.dispose();
          }
        },

        undefined,

        (error) => {
          console.error(
            `Failed to load slab texture for ${role}:`,
            textureUrl,
            error,
          );
        },
      );
    }

    return () => {
      cancelled = true;
    };
  }, [surfaceSlabs, slabMaterials, maxAnisotropy, isMobile]);

  /*
   * Dispose our dynamic slab + cloned materials
   * when THIS model disappears.
   */
  useEffect(() => {
    return () => {
      currentSlabTextures.current.forEach((texture) => texture.dispose());

      currentSlabTextures.current.clear();
      currentSlabUrls.current.clear();

      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;

        if (!mesh.isMesh) return;

        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((material) => {
          material?.dispose();
        });
      });
    };
  }, [scene]);

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
