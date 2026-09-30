'use client';

import { useState } from 'react';
import { CalculatorFeature, CalculatorConfigField } from '@/types/calculator';
import { Button, Input, Card, Textarea } from '@/components/ui';

interface FieldBuilderProps {
  field: CalculatorFeature | CalculatorConfigField;
  onChange: (field: CalculatorFeature | CalculatorConfigField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  allFields: (CalculatorFeature | CalculatorConfigField)[];
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
  allFields,
}: FieldBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if this is a feature or config field
  const isFeature = 'hours' in field;
  const feature = isFeature ? (field as CalculatorFeature) : null;
  const configField = !isFeature ? (field as CalculatorConfigField) : null;

  /**
   * Update field property
   */
  const updateProperty = (key: string, value: string | number  | boolean | undefined) => {
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
  const updateOption = (index: number, key: 'label' | 'value' | 'hours' | 'description' | 'examples' | 'suggestedPages', value: string | number | string[]) => {
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
          <button type="button"
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
          <Button type="button"
            size="sm"
            variant="secondary"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Move up"
          >
            ↑
          </Button>
          <Button type="button"
            size="sm"
            variant="secondary"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Move down"
          >
            ↓
          </Button>
          <Button type="button"
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
          <Input label={isFeature ? 'Feature description' : 'Help text'} value={feature?.description ?? configField?.helpText ?? ''} onChange={e => updateProperty(isFeature ? 'description' : 'helpText', e.target.value)} />
          {feature && <>
            <label className="block text-sm font-medium">Quantity from a project answer
              <select className="w-full border rounded-lg p-2 mt-1" value={feature.quantityFrom ?? ''} onChange={e => updateProperty('quantityFrom', e.target.value || undefined)}>
                <option value="">Use this feature&apos;s own quantity</option>
                {allFields.filter(other => 'type' in other && (other.type === 'number' || other.type === 'pages') && other.id !== 'hourly_rate').map(other => <option key={other.id} value={other.id}>{other.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Show when
              <select className="w-full border rounded-lg p-2 mt-1" value={feature.conditional?.showWhen ?? ''} onChange={e => onChange({ ...feature, conditional: e.target.value ? { showWhen: e.target.value, value: '' } : undefined })}>
                <option value="">Always visible</option>
                {allFields.filter(other => other.id !== field.id && other.id !== 'hourly_rate').map(other => <option key={other.id} value={other.id}>{other.label}</option>)}
              </select>
            </label>
            {feature.conditional && <Input label="Equals (use the option value, true or false)" value={String(feature.conditional.value)} onChange={e => onChange({ ...feature, conditional: { ...feature.conditional!, value: e.target.value } })} />}
          </>}
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
                        value={feature.defaultQuantity ?? 1}
                        onChange={(e) =>
                          updateProperty('defaultQuantity', Number(e.target.value))
                        }
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Min</label>
                      <Input
                        type="number"
                        value={feature.minQuantity ?? 1}
                        onChange={(e) =>
                          updateProperty('minQuantity', Number(e.target.value))
                        }
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Max</label>
                      <Input
                        type="number"
                        value={feature.maxQuantity ?? ''}
                        onChange={(e) =>
                          updateProperty('maxQuantity', e.target.value === '' ? undefined : Number(e.target.value))
                        }
                        min={0}
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
                    updateProperty('type', e.target.value as CalculatorConfigField['type'])
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number Input</option>
                  <option value="select">Dropdown Select</option>
                  <option value="pages">Website Page Checklist</option>
                </select>
              </div>

              {configField.type === 'pages' && <p className="text-sm text-gray-600">Visitors choose named pages; the selected count can drive a feature’s quantity. The default below is used only when they choose “I’m not sure yet.” Blog and Shop each count as one section.</p>}
              {(configField.type === 'number' || configField.type === 'pages') && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Min</label>
                    <Input
                      type="number"
                      value={configField.min ?? ''}
                      onChange={(e) =>
                        updateProperty('min', e.target.value === '' ? undefined : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Max</label>
                    <Input
                      type="number"
                      value={configField.max ?? ''}
                      onChange={(e) =>
                        updateProperty('max', e.target.value === '' ? undefined : Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Step</label>
                    <Input
                      type="number"
                      value={configField.step ?? ''}
                      onChange={(e) =>
                        updateProperty('step', e.target.value === '' ? undefined : Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              )}

              {configField.type === 'select' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Options</label>
                    <Button type="button" size="sm" onClick={addOption}>
                      + Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {configField.options?.map((option, index) => (
                      <div key={index} className="space-y-3 rounded-lg border p-3 bg-white">
                        <div className="flex flex-wrap items-end gap-2">
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
                        <Input label="Additional hours" type="number" aria-label={`Additional hours for ${option.label}`} min={0} step={0.5} value={option.hours ?? 0} onChange={e => updateOption(index, 'hours', Number(e.target.value))} className="w-28" />
                        <Button type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => removeOption(index)}
                        >
                          ✕
                        </Button>
                        </div>
                        <Textarea label="What this solution includes" value={option.description ?? ''} rows={3} onChange={e => updateOption(index, 'description', e.target.value)} />
                        <Textarea label="Short examples (one per line)" value={(option.examples ?? []).join('\n')} rows={2} onChange={e => updateOption(index, 'examples', e.target.value.split('\n'))} />
                        <Textarea label="Suggested pages (one per line)" value={(option.suggestedPages ?? []).join('\n')} rows={3} onChange={e => updateOption(index, 'suggestedPages', e.target.value.split('\n'))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">{configField.type === 'pages' ? 'Provisional page count when unsure' : 'Default Value'}</label>
                <Input
                  type={configField.type === 'number' || configField.type === 'pages' ? 'number' : 'text'}
                  value={configField.defaultValue ?? ''}
                  onChange={(e) =>
                    updateProperty(
                      'defaultValue',
                      configField.type === 'number' || configField.type === 'pages'
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
