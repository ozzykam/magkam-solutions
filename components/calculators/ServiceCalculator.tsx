'use client';

import { useState, useMemo } from 'react';
import { calculateEstimate, initialConfig, configErrors, featureQuantity, isFeatureVisible, pageCount, pageSelectionErrors, pageSummary } from '@/lib/calculator';
import type { CalculatorEstimate, CalculatorPageSelection } from '@/types/calculator';
import {
  Calculator,
  SerializedCalculator,
  CalculatorFeature,
  CalculatorConfigField,
} from '@/types/calculator';
import { saveCalculatorSubmission } from '@/services/calculator-service';
import { Button, Card, Input } from '@/components/ui';
import CalculatorResults from './CalculatorResults';
import PageChecklist from './PageChecklist';
import SolutionGuidance from './SolutionGuidance';

interface ServiceCalculatorProps {
  calculator: Calculator | SerializedCalculator;
  preview?: boolean;
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
export default function ServiceCalculator({ calculator, preview = false }: ServiceCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [result, setResult] = useState<CalculatorEstimate | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Configuration values (hourly rate, website type, etc.)
   * These affect how features are calculated
   */
  const [config, setConfig] = useState(() => {
    const initial = initialConfig(calculator);
    calculator.steps.flatMap(step => step.fields).forEach(field => { if ('type' in field && field.type === 'pages') initial[field.id] = 0; });
    return initial;
  });
  const [pageSelections, setPageSelections] = useState<Record<string, CalculatorPageSelection>>(() => Object.fromEntries(
    calculator.steps.flatMap(step => step.fields).filter(field => 'type' in field && field.type === 'pages').map(field => [field.id, { pages: [], otherPages: [], unsure: false }])
  ));

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
  const { totalPrice } = useMemo(() => calculateEstimate(calculator, config, selections), [calculator, config, selections]);

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

    const field = calculator.steps.flatMap(step => step.fields).find(field => field.id === featureId) as CalculatorFeature;
    setSelections(prev => ({ ...prev, [featureId]: !prev[featureId], [`${featureId}_qty`]: featureQuantity(field, config, prev) }));
  };

  /**
   * Handle quantity change for features that have quantity inputs
   */
  const handleQuantityChange = (featureId: string, value: number) => {
    const field = calculator.steps.flatMap(step => step.fields).find(field => field.id === featureId) as CalculatorFeature;
    setSelections(prev => ({ ...prev, [`${featureId}_qty`]: featureQuantity(field, config, { ...prev, [`${featureId}_qty`]: value }) }));
  };

  /**
   * Move to next step or show contact form
   */
  const handleNext = () => {
    const fields = calculator.steps[currentStep].fields;
    const errors = fields.flatMap(field => 'type' in field && field.type === 'pages' ? pageSelectionErrors(field, pageSelections[field.id]) : []).concat(configErrors(fields, config));
    if (errors.length) { setError(errors[0]); return; }
    setError('');
    if (currentStep < calculator.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setReviewing(true);
    }
  };

  /**
   * Move to previous step
   */
  const handlePrevious = () => {
    if (showContactForm) {
      setShowContactForm(false);
      setReviewing(true);
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
    if (submitting) return;

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
      setError('');
      if (preview) {
        setResult(calculateEstimate(calculator, config, selections));
        return;
      }

      // Save submission (also creates contact message)
      const response = await saveCalculatorSubmission({
        calculatorId: calculator.id,
        selections,
        config,
        pageSelections,
        consent,
        website,
        contactInfo: {
          name: name.trim(),
          email: email.trim(),
        },
      });

      // Show results
      setResult(response.estimate);
    } catch (error) {
      console.error('Error submitting calculator:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // If results have been submitted, show the results component
  if (result) {
    return (
      <CalculatorResults
        calculatorName={calculator.name}
        totalHours={result.totalHours}
        totalPrice={result.totalPrice}
        lineItems={result.lineItems}
        contactName={name}
        preview={preview}
      />
    );
  }

  // Get current step data
  const step = calculator.steps[currentStep];
  if (!step) return <Card className="p-8">This calculator has no steps yet.</Card>;

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">{calculator.name}</h1>
        {calculator.headerCopy && (
          <p className="text-lg text-gray-600">{calculator.headerCopy}</p>
        )}
      </div>

      {/* Progress Indicator */}
      {(
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
                {reviewing ? 'Review your selections' : showContactForm ? 'Get your detailed breakdown' : `Step ${currentStep + 1} of ${calculator.steps.length}`}
            </span>
            <span className="text-sm font-medium" aria-live="polite">
              Running estimate: ${totalPrice.toLocaleString()}
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

      <p className="mb-6 text-sm text-gray-600">This is a planning estimate, subject to scope review. Contact details unlock the full itemized breakdown.</p>
      <Card className="p-5 sm:p-8">
        {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        {reviewing ? <div>
          <h2 className="text-2xl font-bold mb-4">Review your project</h2>
          <p className="text-gray-600 mb-4">Check your selections before requesting the detailed breakdown.</p>
          {calculator.steps.map((reviewStep, index) => <div key={reviewStep.id} className="mb-5 border-b pb-4">
            <div className="flex justify-between items-center gap-3"><h3 className="font-semibold">{reviewStep.title}</h3><Button type="button" size="sm" variant="secondary" onClick={() => { setCurrentStep(index); setReviewing(false); }}>Edit {reviewStep.title}</Button></div>
            <ul className="mt-3 space-y-2 text-sm">{reviewStep.fields.map(field => {
              if ('type' in field && field.type === 'pages') return <li key={field.id}>{field.label}: {pageSummary(field, pageSelections[field.id])}</li>;
              if ('type' in field) return field.id === 'hourly_rate' ? null : <li key={field.id}>{field.label}: {field.options?.find(option => String(option.value) === String(config[field.id]))?.label ?? config[field.id] ?? '—'}</li>;
              return (field.mandatory || selections[field.id] === true) && isFeatureVisible(field, config, selections) ? <li key={field.id}>{field.label}{field.hasQuantity || field.quantityFrom ? ` × ${featureQuantity(field, config, selections)}` : ''}</li> : null;
            })}</ul>
          </div>)}
          <Button type="button" onClick={() => { setReviewing(false); setShowContactForm(true); }}>Get Detailed Breakdown</Button>
        </div> : <>
        {/* Contact Form (shown after all steps) */}
        {showContactForm ? (
          <form onSubmit={handleSubmitContact} className="space-y-6">
            <div className="hidden" aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Get Your Custom Estimate</h2>
              <p className="text-gray-600 mb-6">
                Enter your contact information to see your detailed cost breakdown and
                request a project consultation.
              </p>
            </div>

            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium mb-2">
                Your Name *
              </label>
              <Input
                id="contact-name"
                type="text"
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <Input
                id="contact-email"
                type="email"
                maxLength={254}
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
            {step.fields.some(field => 'hours' in field && field.mandatory) && <p className="mb-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Required features form the foundation of your project and are included in the starting estimate. Optional features add to that amount.</p>}

            <div className="space-y-6">
              {step.fields.map((field) => {
                // Render config fields (selects, number inputs)
                if ('type' in field) {
                  const configField = field as CalculatorConfigField;
                  if (field.id === 'hourly_rate') return null;
                  if (field.type === 'pages') return <PageChecklist key={field.id} field={field} value={pageSelections[field.id]} onChange={value => {
                    setPageSelections(previous => ({ ...previous, [field.id]: value }));
                    setConfig(previous => ({ ...previous, [field.id]: pageCount(field, value) }));
                    setError('');
                  }} />;
                  return (
                    <div key={configField.id}>
                      <label htmlFor={configField.id} className="block text-sm font-medium mb-2">
                        {configField.label}
                      </label>
                      {configField.helpText && <p className="text-sm text-gray-600 mb-2">{configField.helpText}</p>}
                      {configField.type === 'select' ? (
                        <select
                          id={configField.id}
                          value={config[configField.id] ?? ''}
                          onChange={(e) => handleConfigChange(configField.id, e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="">Choose an option</option>
                          {configField.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}{opt.hours ? ` (+$${(opt.hours * calculator.defaultHourlyRate).toLocaleString()})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : configField.type === 'number' ? (
                        <Input
                          id={configField.id}
                          type="number"
                          value={config[configField.id] ?? ''}
                          onChange={(e) => handleConfigChange(configField.id, e.target.value === '' ? '' : Number(e.target.value))}
                          min={configField.min}
                          max={configField.max}
                          step={configField.step}
                        />
                      ) : (
                        <Input
                          id={configField.id}
                          type="text"
                          value={config[configField.id] ?? ''}
                          onChange={(e) => handleConfigChange(configField.id, e.target.value)}
                        />
                      )}
                      {configField.type === 'select' && <SolutionGuidance field={configField} value={config[configField.id]} />}
                    </div>
                  );
                }

                // Render feature checkboxes
                const feature = field as CalculatorFeature;
                const isSelected = feature.mandatory || selections[feature.id] === true;
                const quantity = featureQuantity(feature, config, selections);
                const featureCost = calculateEstimate({ ...calculator, steps: [{ ...step, fields: [feature] }] }, config, { ...selections, [feature.id]: true }).totalPrice;

                // Check if feature should be hidden
                if (!isFeatureVisible(feature, config, selections)) return null;

                return (
                  <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        id={feature.id}
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleFeatureToggle(feature.id, feature.mandatory)}
                        disabled={feature.mandatory}
                        className="w-5 h-5"
                      />
                      <div>
                        <label htmlFor={feature.id} className="font-medium cursor-pointer">
                          {feature.label}
                          {feature.mandatory && (
                            <span className="text-xs text-gray-500 ml-2">(Required)</span>
                          )}
                        </label>
                        {feature.description && <p className="text-sm text-gray-600 mt-1">{feature.description}</p>}
                        {feature.quantityFrom && <p className="text-sm text-gray-600">Quantity from your project answers: {quantity}</p>}
                        {feature.hasQuantity && !feature.quantityFrom && isSelected && (
                          <div className="mt-2">
                            <Input
                              aria-label={feature.quantityLabel || `${feature.label} quantity`}
                              type="number"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(feature.id, Number(e.target.value))}
                              min={feature.minQuantity ?? 1}
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
                        ${featureCost.toLocaleString()}
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
                {currentStep < calculator.steps.length - 1 ? 'Next Step' : 'Review Selections'}
              </Button>
            </div>
          </div>
        )}
        </>}
      </Card>

      {calculator.footerCopy && (
        <p className="text-center text-gray-600 mt-8">{calculator.footerCopy}</p>
      )}
    </div>
  );
}
