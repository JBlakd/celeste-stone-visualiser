import { useEffect, useMemo, useRef } from "react";

import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { ModelDefinition } from "../data/models";
import type { SlabDefinition } from "../data/slabs";

import { SurfaceRole, isSurfaceRole } from "../data/surface";
import { computeAutoFit } from "../three/meshUtils";
import { upgradeMeshTextures } from "../three/textures";

interface ModelProps {
  model: ModelDefinition;
  slab: SlabDefinition;
}

export function Model({ model, slab }: ModelProps) {
  const { scene: source } = useGLTF(model.path);

  const gl = useThree((state) => state.gl);

  const currentSlabTexture = useRef<THREE.Texture | null>(null);

  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  const isMobile = useMemo(
    () =>
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth <= 768,
    [],
  );

  /*
   * Clone the kitchen ONCE PER MODEL.
   *
   * Slab changes no longer rebuild this entire scene.
   */
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
        case SurfaceRole.StoneSplashback:
          return new THREE.MeshStandardMaterial({
            name: originalMaterial.name,
            color: 0xffffff,
            roughness: 0.25,
            metalness: 0,
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

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(prepareMaterial);
      } else if (mesh.material) {
        mesh.material = prepareMaterial(mesh.material);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    return clone;
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

  /*
   * Load slab texture manually.
   *
   * Crucially:
   *   old slab -> dispose()
   *   new slab -> GPU
   *
   * We are NOT retaining every slab ever selected.
   */
  useEffect(() => {
    let cancelled = false;

    const loader = new THREE.TextureLoader();

    loader.load(
      slab.texture,

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
          /*
           * Save a cuntload of mobile VRAM.
           *
           * Full mip chains cost roughly another 33%.
           */
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
         * Apply this one texture to every stone surface.
         */
        scene.traverse((child) => {
          const mesh = child as THREE.Mesh;

          if (!mesh.isMesh) return;

          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((material) => {
            if (
              material instanceof THREE.MeshStandardMaterial &&
              (material.name === SurfaceRole.StoneBenchtop ||
                material.name === SurfaceRole.StoneSplashback)
            ) {
              material.map = texture;
              material.needsUpdate = true;
            }
          });
        });

        /*
         * NOW murder the old GPU texture.
         */
        const previousTexture = currentSlabTexture.current;

        currentSlabTexture.current = texture;

        if (previousTexture && previousTexture !== texture) {
          previousTexture.dispose();
        }
      },

      undefined,

      (error) => {
        console.error("Failed to load slab texture:", slab.texture, error);
      },
    );

    return () => {
      /*
       * Can't abort TextureLoader's underlying image request,
       * but if it finishes after slab changed we'll dispose it
       * immediately instead of putting it on the GPU.
       */
      cancelled = true;
    };
  }, [slab.texture, scene, maxAnisotropy, isMobile]);

  /*
   * Dispose our dynamic slab + cloned materials
   * when THIS model disappears.
   */
  useEffect(() => {
    return () => {
      currentSlabTexture.current?.dispose();
      currentSlabTexture.current = null;

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
