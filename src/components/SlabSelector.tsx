import type { SlabDefinition } from "../data/slabs";
import { SLAB_SURFACES, type SlabSurfaceRole } from "../data/surface";

interface SlabSelectorProps {
  slabs: SlabDefinition[];

  surfaceSlabIds: Record<SlabSurfaceRole, string>;

  currentSurfaceRole: SlabSurfaceRole;

  onSurfaceChange: (role: SlabSurfaceRole) => void;

  onSlabChange: (role: SlabSurfaceRole, slabId: string) => void;
}

export function SlabSelector({
  slabs,
  surfaceSlabIds,
  currentSurfaceRole,
  onSurfaceChange,
  onSlabChange,
}: SlabSelectorProps) {
  const currentSlabId = surfaceSlabIds[currentSurfaceRole];

  const currentSlab =
    slabs.find((slab) => slab.id === currentSlabId) ?? slabs[0];

  if (!currentSlab) {
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
            onSurfaceChange(event.target.value as SlabSurfaceRole)
          }
        >
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
          value={currentSlab.id}
          onChange={(event) =>
            onSlabChange(currentSurfaceRole, event.target.value)
          }
        >
          {slabs.map((slab) => (
            <option key={slab.id} value={slab.id}>
              {slab.name} — {slab.sku} (Level {slab.level})
            </option>
          ))}
        </select>
      </label>

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
    </div>
  );
}
