import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Html,
  OrbitControls,
  SoftShadows,
} from "@react-three/drei";

import { Model } from "./Model";
import { ModelSelector } from "./ModelSelector";
import { MODELS } from "../data/models";

function LoadingFallback() {
  return (
    <Html center>
      <div className="model-spinner" role="status" aria-label="Loading model" />
    </Html>
  );
}

export function Scene() {
  const [currentModelId, setCurrentModelId] = useState(MODELS[0]?.id ?? "");

  const currentModel = useMemo(
    () => MODELS.find((model) => model.id === currentModelId) ?? MODELS[0],
    [currentModelId],
  );

  if (!currentModel) {
    return <div>No models configured.</div>;
  }

  return (
    <main className="visualiser">
      <Canvas
        shadows
        camera={{
          position: [0, 0.5, 2],
          fov: 45,
        }}
      >
        <color attach="background" args={["#4d4a47"]} />

        <Suspense fallback={<LoadingFallback />}>
          <SoftShadows size={25} samples={20} focus={0.5} />

          <Environment preset="apartment" />

          <directionalLight
            position={[5, 8, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          <Model key={currentModel.id} model={currentModel} />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={currentModel.minDistance ?? 0.05}
          maxDistance={currentModel.maxDistance ?? 50}
        />
      </Canvas>

      {MODELS.length > 1 && (
        <ModelSelector
          models={MODELS}
          currentModelId={currentModel.id}
          onModelChange={setCurrentModelId}
        />
      )}
    </main>
  );
}
