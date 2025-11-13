'use client';

import { useState } from 'react';
import { CalculatorStep, CalculatorFeature, CalculatorConfigField } from '@/types/calculator';
import { Button, Card, Input, Textarea } from '@/components/ui';
import FieldBuilder from './FieldBuilder';

interface StepBuilderProps {
  step: CalculatorStep;
  stepNumber: number;
  totalSteps: number;
  onChange: (step: CalculatorStep) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * StepBuilder Component
 *
 * Builder for a single calculator step
 * Allows configuring step details and adding/managing fields
 */
export default function StepBuilder({
  step,
  stepNumber,
  totalSteps,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: StepBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);

  /**
   * Update step title
   */
  const updateTitle = (title: string) => {
    onChange({ ...step, title });
  };

  /**
   * Update step description
   */
  const updateDescription = (description: string) => {
    onChange({ ...step, description });
  };

  /**
   * Add a new config field (dropdown, number input, etc.)
   */
  const addConfigField = () => {
    const newField: CalculatorConfigField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
    };
    onChange({
      ...step,
      fields: [...step.fields, newField],
    });
    setShowAddFieldMenu(false);
  };

  /**
   * Add a new feature (checkbox with hours calculation)
   */
  const addFeature = () => {
    const newFeature: CalculatorFeature = {
      id: `feature-${Date.now()}`,
      label: 'New Feature',
      hours: 10,
      mandatory: false,
    };
    onChange({
      ...step,
      fields: [...step.fields, newFeature],
    });
    setShowAddFieldMenu(false);
  };

  /**
   * Update a field at a specific index
   */
  const updateField = (index: number, updatedField: CalculatorFeature | CalculatorConfigField) => {
    const updatedFields = step.fields.map((field, i) => (i === index ? updatedField : field));
    onChange({ ...step, fields: updatedFields });
  };

  /**
   * Delete a field
   */
  const deleteField = (index: number) => {
    const updatedFields = step.fields.filter((_, i) => i !== index);
    onChange({ ...step, fields: updatedFields });
  };

  /**
   * Move field up in order
   */
  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const updatedFields = [...step.fields];
    [updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]];
    onChange({ ...step, fields: updatedFields });
  };

  /**
   * Move field down in order
   */
  const moveFieldDown = (index: number) => {
    if (index === step.fields.length - 1) return;
    const updatedFields = [...step.fields];
    [updatedFields[index], updatedFields[index + 1]] = [updatedFields[index + 1], updatedFields[index]];
    onChange({ ...step, fields: updatedFields });
  };

  return (
    <Card className="p-6 border-2 border-gray-200">
      {/* Step Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <div>
            <h4 className="text-lg font-semibold">
              Step {stepNumber} of {totalSteps}
            </h4>
            <p className="text-sm text-gray-600">{step.title}</p>
          </div>
        </div>

        {/* Step Controls */}
        <div className="flex gap-2">
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
            title="Delete step"
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Step Content (Collapsible) */}
      {isExpanded && (
        <div className="space-y-4 mt-4 pt-4 border-t">
          {/* Step Settings */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Step Title *</label>
              <Input
                type="text"
                value={step.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="e.g., Project Basics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Step Description (optional)
              </label>
              <Textarea
                value={step.description || ''}
                onChange={(e) => updateDescription(e.target.value)}
                placeholder="Brief description of what this step is about"
                rows={2}
              />
            </div>
          </div>

          {/* Fields List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium">Fields & Features</h5>
              <div className="relative">
                <Button
                  size="sm"
                  onClick={() => setShowAddFieldMenu(!showAddFieldMenu)}
                >
                  + Add Field
                </Button>

                {/* Add Field Dropdown Menu */}
                {showAddFieldMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                    <button
                      onClick={addConfigField}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b"
                    >
                      <div className="font-medium">Config Field</div>
                      <div className="text-xs text-gray-600">
                        Dropdown, number, or text input
                      </div>
                    </button>
                    <button
                      onClick={addFeature}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="font-medium">Feature</div>
                      <div className="text-xs text-gray-600">
                        Checkbox with hours calculation
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {step.fields.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">
                  No fields yet. Click &wuot;Add Field&quot; to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {step.fields.map((field, index) => (
                  <FieldBuilder
                    key={'id' in field ? field.id : `field-${index}`}
                    field={field}
                    onChange={(updatedField) => updateField(index, updatedField)}
                    onDelete={() => deleteField(index)}
                    onMoveUp={() => moveFieldUp(index)}
                    onMoveDown={() => moveFieldDown(index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < step.fields.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
