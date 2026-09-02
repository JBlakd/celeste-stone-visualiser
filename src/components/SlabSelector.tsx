import type { SlabDefinition } from "../data/slabs";

interface SlabSelectorProps {
  title: string;
  slabs: SlabDefinition[];
  currentSlabId: string;
  onSlabChange: (slabId: string) => void;
}

export function SlabSelector({
  title,
  slabs,
  currentSlabId,
  onSlabChange,
}: SlabSelectorProps) {
  const currentSlab =
    slabs.find((slab) => slab.id === currentSlabId) ?? slabs[0];

  if (!currentSlab) return null;

  return (
    <div className="slab-selector">
      <div className="selector-title">{title}</div>

      <select
        className="slab-dropdown"
        value={currentSlab.id}
        onChange={(event) => onSlabChange(event.target.value)}
      >
        {slabs.map((slab) => (
          <option key={slab.id} value={slab.id}>
            {slab.name} — {slab.sku} (Level {slab.level})
          </option>
        ))}
      </select>

      <div className="slab-name">{currentSlab.name}</div>

      <div className="slab-sku">
        {currentSlab.sku} (Level {currentSlab.level})
      </div>
    </div>
  );
}
