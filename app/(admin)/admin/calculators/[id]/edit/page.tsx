'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Calculator, CalculatorStep } from '@/types/calculator';
import {
  getCalculatorById,
  updateCalculator,
} from '@/services/calculator-service';
import { Button, Card, Input, Textarea, LoadingSpinner } from '@/components/ui';
import CalculatorBuilder from '../../CalculatorBuilder';

export default function EditCalculatorPage() {
  const params = useParams();
  const router = useRouter();
  const calculatorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculator, setCalculator] = useState<Calculator | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [headerCopy, setHeaderCopy] = useState('');
  const [footerCopy, setFooterCopy] = useState('');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(150);
  const [minHourlyRate, setMinHourlyRate] = useState(10);
  const [maxHourlyRate, setMaxHourlyRate] = useState(1000);
  const [isActive, setIsActive] = useState(true);

  // Steps managed by visual builder
  const [steps, setSteps] = useState<CalculatorStep[]>([]);

  /**
   * Fetch calculator from Firestore and populate form
   */
  const loadCalculator = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCalculatorById(calculatorId);

      if (!data) {
        alert('Calculator not found');
        router.push('/admin/calculators');
        return;
      }

      setCalculator(data);
      setName(data.name);
      setSlug(data.slug);
      setDescription(data.description || '');
      setHeaderCopy(data.headerCopy || '');
      setFooterCopy(data.footerCopy || '');
      setDefaultHourlyRate(data.defaultHourlyRate);
      setMinHourlyRate(data.minHourlyRate || 10);
      setMaxHourlyRate(data.maxHourlyRate || 1000);
      setIsActive(data.isActive);
      setSteps(data.steps);
    } catch (error) {
      console.error('Error loading calculator:', error);
      alert('Failed to load calculator');
    } finally {
      setLoading(false);
    }
  }, [calculatorId, router]);

  /**
   * Load calculator data when component mounts
   */
  useEffect(() => {
    loadCalculator();
  }, [calculatorId, loadCalculator]);

  /**
   * Handle form submission
   * Validates all fields and updates calculator in Firestore
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      await updateCalculator(calculatorId, {
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
      });
    } catch (error) {
      console.error('Error updating calculator:', error);
      alert('Failed to update calculator. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!calculator) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Calculator</h1>
        <p className="text-gray-600 mt-2">
          Update your calculator using the visual builder
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
          <Button 
            type="submit" 
            disabled={saving}
            onClick={() => router.push('/admin/calculators')}
          >
            {saving ? 'Saving...' : 'Update Calculator'}
          </Button>
        </div>
      </form>
    </div>
  );
}
