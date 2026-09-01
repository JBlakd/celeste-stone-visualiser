import type { ModelDefinition } from "../data/models";

interface ModelSelectorProps {
  models: ModelDefinition[];
  currentModelId: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({
  models,
  currentModelId,
  onModelChange,
}: ModelSelectorProps) {
  const currentModel =
    models.find((model) => model.id === currentModelId) ?? models[0];

  if (!currentModel) return null;

  return (
    <div className="model-selector">
      <select
        className="model-dropdown"
        value={currentModel.id}
        onChange={(event) => onModelChange(event.target.value)}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>

      <div className="model-name">{currentModel.name}</div>

      {currentModel.description && (
        <div className="model-description">{currentModel.description}</div>
      )}
    </div>
  );
}
