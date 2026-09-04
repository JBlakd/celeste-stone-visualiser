import type { SlabDefinition } from "../data/slabs";

import {
  ALL_SLAB_SURFACES,
  SLAB_SURFACES,
  type SlabSurfaceRole,
  type SlabSurfaceSelection,
} from "../data/surface";

interface SlabSelectorProps {
  slabs: SlabDefinition[];

  surfaceSlabIds: Record<SlabSurfaceRole, string>;

  currentSurfaceRole: SlabSurfaceSelection;

  onSurfaceChange: (role: SlabSurfaceSelection) => void;

  onSlabChange: (role: SlabSurfaceSelection, slabId: string) => void;
}

export function SlabSelector({
  slabs,
  surfaceSlabIds,
  currentSurfaceRole,
  onSurfaceChange,
  onSlabChange,
}: SlabSelectorProps) {
  const selectedSlabIds =
    currentSurfaceRole === ALL_SLAB_SURFACES
      ? SLAB_SURFACES.map(({ role }) => surfaceSlabIds[role])
      : [surfaceSlabIds[currentSurfaceRole]];

  const firstSelectedSlabId = selectedSlabIds[0] ?? "";

  const isMixed =
    currentSurfaceRole === ALL_SLAB_SURFACES &&
    selectedSlabIds.some((slabId) => slabId !== firstSelectedSlabId);

  const currentSlab = isMixed
    ? undefined
    : (slabs.find((slab) => slab.id === firstSelectedSlabId) ?? slabs[0]);

  if (!isMixed && !currentSlab) {
    return null;
  }

  return (
    <div className="slab-selector">
      <label className="selector-field">
        <span className="selector-title">Surface</span>

        <select
          className="slab-dropdown"
          value={currentSurfaceRole}
          onChange={(event) =>
            onSurfaceChange(event.target.value as SlabSurfaceSelection)
          }
        >
          <option value={ALL_SLAB_SURFACES}>All Stone Surfaces</option>

          {SLAB_SURFACES.map(({ role, label }) => (
            <option key={role} value={role}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="selector-field">
        <span className="selector-title">Stone</span>

        <select
          className="slab-dropdown"
          value={isMixed ? "" : (currentSlab?.id ?? "")}
          onChange={(event) =>
            onSlabChange(currentSurfaceRole, event.target.value)
          }
        >
          {isMixed && (
            <option value="" disabled>
              Mixed — choose a stone
            </option>
          )}

          {slabs.map((slab) => (
            <option key={slab.id} value={slab.id}>
              {slab.name} — {slab.sku} (Level {slab.level})
            </option>
          ))}
        </select>
      </label>

      {currentSlab ? (
        <>
          <img
            className="slab-preview"
            src={currentSlab.texture}
            alt={currentSlab.name}
            crossOrigin="anonymous"
          />

          <div className="slab-name">{currentSlab.name}</div>

          <div className="slab-sku">
            {currentSlab.sku} (Level {currentSlab.level})
          </div>
        </>
      ) : (
        <>
          <div className="slab-name">Mixed surfaces</div>

          <div className="slab-sku">
            Choose a stone to apply it to every surface.
          </div>
        </>
      )}
    </div>
  );
}
