import { Suspense, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

import { Canvas } from "@react-three/fiber";

import {
  Environment,
  Html,
  OrbitControls,
  SoftShadows,
} from "@react-three/drei";

import { Model } from "./Model";
import { ModelSelector } from "./ModelSelector";
import { SlabSelector } from "./SlabSelector";

import { MODELS } from "../data/models";

import {
  ALL_SLAB_SURFACES,
  SLAB_SURFACES,
  type SlabSurfaceRole,
  type SlabSurfaceSelection,
} from "../data/surface";

import { SLABS, type SurfaceSlabMap } from "../data/slabs";

function LoadingFallback() {
  return (
    <Html center>
      <div className="model-spinner" role="status" aria-label="Loading model" />
    </Html>
  );
}

export function Scene() {
  const [currentModelId, setCurrentModelId] = useState(MODELS[0]?.id ?? "");

  const [surfaceSlabIds, setSurfaceSlabIds] = useState<
    Record<SlabSurfaceRole, string>
  >(
    () =>
      Object.fromEntries(
        SLAB_SURFACES.map(({ role }) => [role, SLABS[0]?.id ?? ""]),
      ) as Record<SlabSurfaceRole, string>,
  );

  const [currentSurfaceRole, setCurrentSurfaceRole] =
    useState<SlabSurfaceSelection>(ALL_SLAB_SURFACES);

  const [controlsOpen, setControlsOpen] = useState(true);

  const currentModel = useMemo(
    () => MODELS.find((model) => model.id === currentModelId) ?? MODELS[0],
    [currentModelId],
  );

  const surfaceSlabs = useMemo<SurfaceSlabMap>(() => {
    const result: SurfaceSlabMap = {};

    for (const { role } of SLAB_SURFACES) {
      const slab =
        SLABS.find((slab) => slab.id === surfaceSlabIds[role]) ?? SLABS[0];

      if (slab) {
        result[role] = slab;
      }
    }

    return result;
  }, [surfaceSlabIds]);

  const isMobile = useIsMobile();

  if (!currentModel || SLABS.length === 0) {
    return <div>Visualiser data unavailable.</div>;
  }

  return (
    <main className="visualiser">
      <Canvas
        shadows
        dpr={isMobile ? 1 : [1, 1.5]}
        camera={{
          position: [0, 0.5, 2],
          fov: 45,
        }}
      >
        <color attach="background" args={["#3A3734"]} />

        <Suspense fallback={<LoadingFallback />}>
          <SoftShadows size={25} samples={isMobile ? 6 : 20} focus={0.5} />

          <Environment preset="apartment" />

          <directionalLight
            position={[5, 8, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={isMobile ? 1024 : 2048}
            shadow-mapSize-height={isMobile ? 1024 : 2048}
          />

          <Model
            key={currentModel.id}
            model={currentModel}
            surfaceSlabs={surfaceSlabs}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={currentModel.minDistance ?? 0.05}
          maxDistance={currentModel.maxDistance ?? 50}
        />
      </Canvas>

      <aside
        className={`selector-drawer ${controlsOpen ? "is-open" : "is-closed"}`}
      >
        <button
          type="button"
          className="selector-drawer-toggle"
          onClick={() => setControlsOpen((open) => !open)}
          aria-label={controlsOpen ? "Hide controls" : "Show controls"}
          aria-expanded={controlsOpen}
        >
          <span aria-hidden="true">{controlsOpen ? "‹" : "›"}</span>
        </button>

        <div className="selector-drawer-content">
          {MODELS.length > 1 && (
            <ModelSelector
              models={MODELS}
              currentModelId={currentModel.id}
              onModelChange={setCurrentModelId}
            />
          )}

          <SlabSelector
            slabs={SLABS}
            surfaceSlabIds={surfaceSlabIds}
            currentSurfaceRole={currentSurfaceRole}
            onSurfaceChange={setCurrentSurfaceRole}
            onSlabChange={(selection, slabId) =>
              setSurfaceSlabIds((current) => {
                if (selection === ALL_SLAB_SURFACES) {
                  return Object.fromEntries(
                    SLAB_SURFACES.map(({ role }) => [role, slabId]),
                  ) as Record<SlabSurfaceRole, string>;
                }

                return {
                  ...current,
                  [selection]: slabId,
                };
              })
            }
          />
        </div>
      </aside>
    </main>
  );
}
