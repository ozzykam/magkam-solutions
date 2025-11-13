'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_CALCULATOR, CalculatorStep } from '@/types/calculator';
import { createCalculator } from '@/services/calculator-service';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import CalculatorBuilder from '../CalculatorBuilder';

/**
 * New Calculator Page
 *
 * User-friendly visual builder for creating calculators
 * No JSON editing required!
 */
export default function NewCalculatorPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);

  // Form fields (initialized with defaults)
  const [name, setName] = useState(DEFAULT_CALCULATOR.name);
  const [slug, setSlug] = useState(DEFAULT_CALCULATOR.slug);
  const [description, setDescription] = useState(DEFAULT_CALCULATOR.description || '');
  const [headerCopy, setHeaderCopy] = useState(DEFAULT_CALCULATOR.headerCopy || '');
  const [footerCopy, setFooterCopy] = useState(DEFAULT_CALCULATOR.footerCopy || '');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(DEFAULT_CALCULATOR.defaultHourlyRate);
  const [minHourlyRate, setMinHourlyRate] = useState(DEFAULT_CALCULATOR.minHourlyRate || 10);
  const [maxHourlyRate, setMaxHourlyRate] = useState(DEFAULT_CALCULATOR.maxHourlyRate || 1000);
  const [isActive, setIsActive] = useState(DEFAULT_CALCULATOR.isActive);

  // Steps managed by visual builder
  const [steps, setSteps] = useState<CalculatorStep[]>(DEFAULT_CALCULATOR.steps);

  /**
   * Handle form submission
   * Validates all fields and creates new calculator in Firestore
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to create a calculator');
      return;
    }

    // Validate required fields
    if (!name.trim()) {
      alert('Please enter a calculator name');
      return;
    }

    if (!slug.trim()) {
      alert('Please enter a slug');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step to your calculator');
      return;
    }

    // Validate steps have fields
    const emptySteps = steps.filter(step => step.fields.length === 0);
    if (emptySteps.length > 0) {
      alert('All steps must have at least one field');
      return;
    }

    try {
      setSaving(true);

      await createCalculator(
        {
          createdBy: user.uid,
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          headerCopy: headerCopy.trim(),
          footerCopy: footerCopy.trim(),
          defaultHourlyRate,
          minHourlyRate,
          maxHourlyRate,
          isActive,
          steps,
        },
        user.uid
      );

      alert('Calculator created successfully!');
      router.push('/admin/calculators');
    } catch (error) {
      console.error('Error creating calculator:', error);
      alert('Failed to create calculator. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Auto-generate slug from name
   * Converts to lowercase, replaces spaces with hyphens, removes special chars
   */
  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug if it hasn't been manually changed
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Calculator</h1>
        <p className="text-gray-600 mt-2">
          Build a custom cost calculator for your services with our visual builder
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Calculator Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Website Cost Calculator"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Slug * (URL-friendly identifier)
              </label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g., website-calculator"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Will be accessible at: /calculators/{slug || 'your-slug'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this calculator does"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Header Copy
              </label>
              <Textarea
                value={headerCopy}
                onChange={(e) => setHeaderCopy(e.target.value)}
                placeholder="Text to display at the top of the calculator"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Footer Copy
              </label>
              <Textarea
                value={footerCopy}
                onChange={(e) => setFooterCopy(e.target.value)}
                placeholder="Text to display at the bottom (optional)"
                rows={2}
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">
                  Active (visible to public)
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* Hourly Rate Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hourly Rate Settings</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Rate ($)
              </label>
              <Input
                type="number"
                value={defaultHourlyRate}
                onChange={(e) => setDefaultHourlyRate(Number(e.target.value))}
                min={1}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Minimum Rate ($)
              </label>
              <Input
                type="number"
                value={minHourlyRate}
                onChange={(e) => setMinHourlyRate(Number(e.target.value))}
                min={1}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Rate ($)
              </label>
              <Input
                type="number"
                value={maxHourlyRate}
                onChange={(e) => setMaxHourlyRate(Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>
        </Card>

        {/* Visual Builder for Steps */}
        <Card className="p-6">
          <CalculatorBuilder
            initialSteps={steps}
            onChange={setSteps}
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/admin/calculators')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Calculator'}
          </Button>
        </div>
      </form>
    </div>
  );
}
