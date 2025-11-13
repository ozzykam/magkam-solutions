'use client';

import { useState } from 'react';
import { CalculatorFeature, CalculatorConfigField } from '@/types/calculator';
import { Button, Input, Card } from '@/components/ui';

interface FieldBuilderProps {
  field: CalculatorFeature | CalculatorConfigField;
  onChange: (field: CalculatorFeature | CalculatorConfigField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * FieldBuilder Component
 *
 * Builder for individual calculator fields
 * Handles both:
 * - Config fields (dropdowns, number inputs, text inputs)
 * - Features (checkboxes with hour calculations)
 *
 * Provides a visual form to configure all field properties
 */
export default function FieldBuilder({
  field,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: FieldBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if this is a feature or config field
  const isFeature = 'hours' in field;
  const feature = isFeature ? (field as CalculatorFeature) : null;
  const configField = !isFeature ? (field as CalculatorConfigField) : null;

  /**
   * Update field property
   */
  const updateProperty = (key: string, value: any) => {
    onChange({ ...field, [key]: value });
  };

  /**
   * Add an option to a select field
   */
  const addOption = () => {
    if (!configField || configField.type !== 'select') return;
    const options = configField.options || [];
    onChange({
      ...configField,
      options: [
        ...options,
        { label: 'New Option', value: `option-${Date.now()}` },
      ],
    });
  };

  /**
   * Update a select option
   */
  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    if (!configField || !configField.options) return;
    const updatedOptions = configField.options.map((opt, i) =>
      i === index ? { ...opt, [key]: value } : opt
    );
    onChange({ ...configField, options: updatedOptions });
  };

  /**
   * Remove a select option
   */
  const removeOption = (index: number) => {
    if (!configField || !configField.options) return;
    const updatedOptions = configField.options.filter((_, i) => i !== index);
    onChange({ ...configField, options: updatedOptions });
  };

  return (
    <Card className="p-4 bg-gray-50 border border-gray-300">
      {/* Field Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{field.label}</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {isFeature ? 'Feature' : `Config: ${configField?.type}`}
              </span>
            </div>
            {isFeature && (
              <span className="text-sm text-gray-600">{feature?.hours} hours</span>
            )}
          </div>
        </div>

        {/* Field Controls */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Move up"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Move down"
          >
            ↓
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            title="Delete field"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Field Configuration (Collapsible) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
          {/* Common Properties */}
          <div>
            <label className="block text-sm font-medium mb-1">Field Label *</label>
            <Input
              type="text"
              value={field.label}
              onChange={(e) => updateProperty('label', e.target.value)}
              placeholder="Label that users will see"
            />
          </div>

          {/* Feature-Specific Properties */}
          {isFeature && feature && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Hours *</label>
                <Input
                  type="number"
                  value={feature.hours}
                  onChange={(e) => updateProperty('hours', Number(e.target.value))}
                  min={0}
                  step={0.5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time required for this feature
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feature.mandatory || false}
                    onChange={(e) => updateProperty('mandatory', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    Mandatory (cannot be unselected by user)
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feature.hasQuantity || false}
                    onChange={(e) => updateProperty('hasQuantity', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Has Quantity Input</span>
                </label>
              </div>

              {feature.hasQuantity && (
                <div className="ml-6 space-y-2 p-3 bg-white rounded border">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Quantity Label
                    </label>
                    <Input
                      type="text"
                      value={feature.quantityLabel || ''}
                      onChange={(e) => updateProperty('quantityLabel', e.target.value)}
                      placeholder="e.g., Number of Pages"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Default</label>
                      <Input
                        type="number"
                        value={feature.defaultQuantity || 1}
                        onChange={(e) =>
                          updateProperty('defaultQuantity', Number(e.target.value))
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Min</label>
                      <Input
                        type="number"
                        value={feature.minQuantity || 1}
                        onChange={(e) =>
                          updateProperty('minQuantity', Number(e.target.value))
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Max</label>
                      <Input
                        type="number"
                        value={feature.maxQuantity || ''}
                        onChange={(e) =>
                          updateProperty('maxQuantity', Number(e.target.value) || undefined)
                        }
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Config Field-Specific Properties */}
          {!isFeature && configField && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Field Type</label>
                <select
                  value={configField.type}
                  onChange={(e) =>
                    updateProperty('type', e.target.value as 'select' | 'number' | 'text')
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number Input</option>
                  <option value="select">Dropdown Select</option>
                </select>
              </div>

              {configField.type === 'number' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Min</label>
                    <Input
                      type="number"
                      value={configField.min || ''}
                      onChange={(e) =>
                        updateProperty('min', Number(e.target.value) || undefined)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Max</label>
                    <Input
                      type="number"
                      value={configField.max || ''}
                      onChange={(e) =>
                        updateProperty('max', Number(e.target.value) || undefined)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Step</label>
                    <Input
                      type="number"
                      value={configField.step || ''}
                      onChange={(e) =>
                        updateProperty('step', Number(e.target.value) || undefined)
                      }
                    />
                  </div>
                </div>
              )}

              {configField.type === 'select' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Options</label>
                    <Button size="sm" onClick={addOption}>
                      + Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {configField.options?.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="text"
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          placeholder="Label"
                          className="flex-1"
                        />
                        <Input
                          type="text"
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeOption(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Default Value</label>
                <Input
                  type={configField.type === 'number' ? 'number' : 'text'}
                  value={configField.defaultValue || ''}
                  onChange={(e) =>
                    updateProperty(
                      'defaultValue',
                      configField.type === 'number'
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                  placeholder="Default value"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={configField.required || false}
                    onChange={(e) => updateProperty('required', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Required Field</span>
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
