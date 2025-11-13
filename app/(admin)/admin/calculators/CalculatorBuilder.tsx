'use client';

import { useState } from 'react';
import { CalculatorStep } from '@/types/calculator';
import { Button, Card } from '@/components/ui';
import StepBuilder from './StepBuilder';

interface CalculatorBuilderProps {
  initialSteps?: CalculatorStep[];
  onChange: (steps: CalculatorStep[]) => void;
}

/**
 * CalculatorBuilder Component
 *
 * Visual builder for creating calculator steps and features
 * No JSON editing required - everything is done through forms
 *
 * Features:
 * - Add/remove/reorder steps
 * - Add/remove/configure fields within each step
 * - Visual interface for all configurations
 */
export default function CalculatorBuilder({
  initialSteps = [],
  onChange,
}: CalculatorBuilderProps) {
  const [steps, setSteps] = useState<CalculatorStep[]>(initialSteps);

  /**
   * Add a new empty step
   */
  const addStep = () => {
    const newStep: CalculatorStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      description: '',
      fields: [],
    };
    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
    onChange(updatedSteps);
  };

  /**
   * Update a specific step
   */
  const updateStep = (index: number, updatedStep: CalculatorStep) => {
    const updatedSteps = steps.map((step, i) => (i === index ? updatedStep : step));
    setSteps(updatedSteps);
    onChange(updatedSteps);
  };

  /**
   * Delete a step
   */
  const deleteStep = (index: number) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    const updatedSteps = steps.filter((_, i) => i !== index);
    setSteps(updatedSteps);
    onChange(updatedSteps);
  };

  /**
   * Move step up in order
   */
  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const updatedSteps = [...steps];
    [updatedSteps[index - 1], updatedSteps[index]] = [updatedSteps[index], updatedSteps[index - 1]];
    setSteps(updatedSteps);
    onChange(updatedSteps);
  };

  /**
   * Move step down in order
   */
  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const updatedSteps = [...steps];
    [updatedSteps[index], updatedSteps[index + 1]] = [updatedSteps[index + 1], updatedSteps[index]];
    setSteps(updatedSteps);
    onChange(updatedSteps);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Calculator Steps</h3>
          <p className="text-sm text-gray-600">
            Build your calculator by adding steps and configuring features
          </p>
        </div>
        <Button onClick={addStep} size="sm">
          + Add Step
        </Button>
      </div>

      {/* Steps List */}
      {steps.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No steps yet. Add your first step to get started!</p>
          <Button onClick={addStep}>Add First Step</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <StepBuilder
              key={step.id}
              step={step}
              stepNumber={index + 1}
              totalSteps={steps.length}
              onChange={(updatedStep) => updateStep(index, updatedStep)}
              onDelete={() => deleteStep(index)}
              onMoveUp={() => moveStepUp(index)}
              onMoveDown={() => moveStepDown(index)}
              canMoveUp={index > 0}
              canMoveDown={index < steps.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
