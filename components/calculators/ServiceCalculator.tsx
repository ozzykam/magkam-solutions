'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  SerializedCalculator,
  CalculatorFeature,
  CalculatorConfigField,
} from '@/types/calculator';
import { saveCalculatorSubmission } from '@/services/calculator-service';
import { Button, Card, Input } from '@/components/ui';
import CalculatorResults from './CalculatorResults';

interface ServiceCalculatorProps {
  calculator: Calculator | SerializedCalculator;
}

/**
 * ServiceCalculator Component
 *
 * A multi-step calculator that:
 * 1. Collects user's feature selections across multiple steps
 * 2. Calculates estimated hours and cost in real-time
 * 3. Shows a contact form before revealing the final estimate
 * 4. Displays detailed breakdown after user submits contact info
 *
 * Flow:
 * - User progresses through steps selecting features
 * - Contact form appears after all steps
 * - Results are revealed only after contact info is submitted
 */
export default function ServiceCalculator({ calculator }: ServiceCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [resultsSubmitted, setResultsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Configuration values (hourly rate, website type, etc.)
   * These affect how features are calculated
   */
  const [config, setConfig] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {
      hourly_rate: calculator.defaultHourlyRate,
    };
    // Initialize config fields with their default values
    calculator.steps.forEach(step => {
      step.fields.forEach(field => {
        if ('type' in field && field.defaultValue !== undefined) {
          initial[field.id] = field.defaultValue;
        }
      });
    });
    return initial;
  });

  /**
   * Feature selections
   * Key: feature ID
   * Value: true/false for boolean features, or number for quantity features
   */
  const [selections, setSelections] = useState<Record<string, boolean | number>>(() => {
    const initial: Record<string, boolean | number> = {};
    // Pre-select mandatory features
    calculator.steps.forEach(step => {
      step.fields.forEach(field => {
        if ('hours' in field) {
          const feature = field as CalculatorFeature;
          if (feature.mandatory) {
            initial[feature.id] = true;
            // Initialize quantity for mandatory quantity fields
            if (feature.hasQuantity && feature.defaultQuantity) {
              initial[`${feature.id}_qty`] = feature.defaultQuantity;
            }
          }
        }
      });
    });
    return initial;
  });

  /**
   * Contact form data
   */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);

  /**
   * Calculate total hours and price based on current selections
   *
   * Algorithm:
   * 1. Iterate through all features
   * 2. If feature is selected (and not hidden by conditional logic):
   *    - Add base hours
   *    - If has quantity, multiply by quantity
   * 3. Multiply total hours by hourly rate to get price
   */
  const { totalHours, totalPrice, lineItems } = useMemo(() => {
    let hours = 0;
    const items: Array<{ label: string; hours: number; cost: number }> = [];

    calculator.steps.forEach(step => {
      step.fields.forEach(field => {
        // Only process calculator features (not config fields)
        if (!('hours' in field)) return;

        const feature = field as CalculatorFeature;

        // Check if feature is selected
        const isSelected = selections[feature.id];
        if (!isSelected) return;

        // Check conditional visibility
        if (feature.conditional) {
          const conditionValue = config[feature.conditional.showWhen] || selections[feature.conditional.showWhen];
          if (conditionValue !== feature.conditional.value) {
            return; // Feature is hidden, don't count it
          }
        }

        // Calculate hours for this feature
        let featureHours = feature.hours;

        // If feature has quantity, multiply by quantity
        if (feature.hasQuantity) {
          const qty = selections[`${feature.id}_qty`] as number || 1;
          featureHours *= qty;
        }

        hours += featureHours;

        // Add to line items for breakdown
        const hourlyRate: number = Number(config.hourly_rate) || calculator.defaultHourlyRate;
        items.push({
          label: feature.label,
          hours: featureHours,
          cost: featureHours * hourlyRate,
        });
      });
    });

    const hourlyRate: number = Number(config.hourly_rate) || calculator.defaultHourlyRate;
    const price = hours * hourlyRate;

    return { totalHours: hours, totalPrice: price, lineItems: items };
  }, [selections, config, calculator]);

  /**
   * Handle configuration field changes (hourly rate, website type, etc.)
   */
  const handleConfigChange = (fieldId: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [fieldId]: value }));
  };

  /**
   * Handle feature selection toggle
   */
  const handleFeatureToggle = (featureId: string, mandatory?: boolean) => {
    if (mandatory) return; // Can't toggle mandatory features

    setSelections(prev => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  /**
   * Handle quantity change for features that have quantity inputs
   */
  const handleQuantityChange = (featureId: string, value: number) => {
    setSelections(prev => ({
      ...prev,
      [`${featureId}_qty`]: value,
    }));
  };

  /**
   * Move to next step or show contact form
   */
  const handleNext = () => {
    if (currentStep < calculator.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowContactForm(true);
    }
  };

  /**
   * Move to previous step
   */
  const handlePrevious = () => {
    if (showContactForm) {
      setShowContactForm(false);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /**
   * Submit contact form and reveal results
   * Creates both a calculator submission and a contact message
   */
  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      alert('Please enter your name and email');
      return;
    }

    if (!consent) {
      alert('Please consent to being contacted');
      return;
    }

    try {
      setSubmitting(true);

      // Save submission (also creates contact message)
      await saveCalculatorSubmission({
        calculatorId: calculator.id,
        calculatorName: calculator.name,
        selections,
        totalHours,
        totalPrice,
        hourlyRate: Number(config.hourly_rate) || calculator.defaultHourlyRate,
        contactInfo: {
          name: name.trim(),
          email: email.trim(),
        },
        status: 'pending',
      });

      // Show results
      setResultsSubmitted(true);
    } catch (error) {
      console.error('Error submitting calculator:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // If results have been submitted, show the results component
  if (resultsSubmitted) {
    return (
      <CalculatorResults
        calculatorName={calculator.name}
        totalHours={totalHours}
        totalPrice={totalPrice}
        lineItems={lineItems}
        contactName={name}
      />
    );
  }

  // Get current step data
  const step = calculator.steps[currentStep];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">{calculator.name}</h1>
        {calculator.headerCopy && (
          <p className="text-lg text-gray-600">{calculator.headerCopy}</p>
        )}
      </div>

      {/* Progress Indicator */}
      {!showContactForm && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {calculator.steps.length}
            </span>
            <span className="text-sm font-medium">
              Running Total: ${totalPrice.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / calculator.steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <Card className="p-8">
        {/* Contact Form (shown after all steps) */}
        {showContactForm ? (
          <form onSubmit={handleSubmitContact} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Get Your Custom Estimate</h2>
              <p className="text-gray-600 mb-6">
                Enter your contact information to see your detailed cost breakdown and
                receive a consultation.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4"
                  required
                />
                <span className="text-sm text-gray-700">
                  I consent to being contacted about my project estimate and agree to
                  receive consultation communications.
                </span>
              </label>
            </div>

            <div className="flex gap-4 justify-between pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrevious}
                disabled={submitting}
              >
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Processing...' : 'Show Me My Estimate'}
              </Button>
            </div>
          </form>
        ) : (
          /* Step Content */
          <div>
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            {step.description && (
              <p className="text-gray-600 mb-6">{step.description}</p>
            )}

            <div className="space-y-6">
              {step.fields.map((field) => {
                // Render config fields (selects, number inputs)
                if ('type' in field) {
                  const configField = field as CalculatorConfigField;
                  return (
                    <div key={configField.id}>
                      <label className="block text-sm font-medium mb-2">
                        {configField.label}
                      </label>
                      {configField.type === 'select' ? (
                        <select
                          value={config[configField.id] || ''}
                          onChange={(e) => handleConfigChange(configField.id, e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          {configField.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : configField.type === 'number' ? (
                        <Input
                          type="number"
                          value={config[configField.id] || ''}
                          onChange={(e) => handleConfigChange(configField.id, Number(e.target.value))}
                          min={configField.min}
                          max={configField.max}
                          step={configField.step}
                        />
                      ) : (
                        <Input
                          type="text"
                          value={config[configField.id] || ''}
                          onChange={(e) => handleConfigChange(configField.id, e.target.value)}
                        />
                      )}
                    </div>
                  );
                }

                // Render feature checkboxes
                const feature = field as CalculatorFeature;
                const isSelected = !!selections[feature.id];
                const quantity = selections[`${feature.id}_qty`] as number || feature.defaultQuantity || 1;

                // Check if feature should be hidden
                if (feature.conditional) {
                  const conditionValue = config[feature.conditional.showWhen] || selections[feature.conditional.showWhen];
                  if (conditionValue !== feature.conditional.value) {
                    return null; // Hide this feature
                  }
                }

                return (
                  <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFeatureToggle(feature.id, feature.mandatory)}
                        disabled={feature.mandatory}
                        className="w-5 h-5"
                      />
                      <div>
                        <label className="font-medium cursor-pointer">
                          {feature.label}
                          {feature.mandatory && (
                            <span className="text-xs text-gray-500 ml-2">(Required)</span>
                          )}
                        </label>
                        {feature.hasQuantity && isSelected && (
                          <div className="mt-2">
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(feature.id, Number(e.target.value))}
                              min={feature.minQuantity || 1}
                              max={feature.maxQuantity}
                              className="w-32"
                              placeholder={feature.quantityLabel || 'Quantity'}
                            />
                            {feature.quantityLabel && (
                              <span className="text-sm text-gray-500 ml-2">
                                {feature.quantityLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {feature.hasQuantity && isSelected ? (
                          <>{feature.hours * quantity} hrs</>
                        ) : (
                          <>{feature.hours} hrs</>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button type="button" onClick={handleNext}>
                {currentStep < calculator.steps.length - 1 ? 'Next Step' : 'Continue to Estimate'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {calculator.footerCopy && (
        <p className="text-center text-gray-600 mt-8">{calculator.footerCopy}</p>
      )}
    </div>
  );
}
