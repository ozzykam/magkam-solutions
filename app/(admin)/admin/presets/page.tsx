'use client';

import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BUSINESS_PRESETS, BusinessPreset } from '@/lib/presets/business-presets';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PresetsPage() {
  const [applying, setApplying] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<BusinessPreset | null>(null);

  const applyPreset = async (preset: BusinessPreset) => {
    if (!confirm(`Apply "${preset.name}" preset? This will update your theme, homepage, and service settings. Your current logo and favicon will be preserved.`)) {
      return;
    }

    try {
      setApplying(preset.id);

      await updateDoc(doc(db, 'storeSettings', 'main'), {
        ...preset.settings,
        updatedAt: Timestamp.now(),
      });

      alert(`✅ ${preset.name} preset applied successfully! Refreshing to show changes...`);

      // Refresh the page to show new settings
      window.location.reload();
    } catch (error) {
      console.error('Error applying preset:', error);
      alert('Failed to apply preset. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const previewPreset = (preset: BusinessPreset) => {
    setSelectedPreset(preset);
  };

  const closePreview = () => {
    setSelectedPreset(null);
  };

  const categories = [
    { id: 'agency', label: 'Agencies', description: 'Web, marketing, and digital agencies' },
    { id: 'creative', label: 'Creative', description: 'Design, photography, and content' },
    { id: 'consulting', label: 'Consulting', description: 'Professional services and consulting' },
    { id: 'professional', label: 'Professional', description: 'Other professional services' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Type Presets</h1>
        <p className="text-gray-600 mt-1">Quick-start templates to get your agency platform up and running instantly</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">What gets updated?</h3>
            <div className="text-sm text-blue-800 mt-1">
              <p>Applying a preset will update: Theme colors & fonts, Homepage content, Service terminology, Content settings, and Business name/description.</p>
              <p className="mt-1"><strong>Preserved:</strong> Your logo, favicon, address, social media links, and other business details.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Presets by Category */}
      {categories.map(category => {
        const categoryPresets = BUSINESS_PRESETS.filter(p => p.category === category.id);

        if (categoryPresets.length === 0) return null;

        return (
          <div key={category.id}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">{category.label}</h2>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryPresets.map(preset => (
                <Card key={preset.id}>
                  <div className="p-6">
                    {/* Icon & Name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">{preset.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {preset.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    {/* Color Preview */}
                    <div className="flex gap-2 mb-4">
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-200"
                        style={{ backgroundColor: preset.settings.themeSettings?.primaryColor }}
                        title="Primary Color"
                      />
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-200"
                        style={{ backgroundColor: preset.settings.themeSettings?.secondaryColor }}
                        title="Secondary Color"
                      />
                      <div className="flex-1 flex items-center">
                        <span className="text-xs text-gray-500">
                          {preset.settings.themeSettings?.fontFamily}
                        </span>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gray-50 rounded p-3 mb-4 text-xs text-gray-600 space-y-1">
                      <p><strong>Services:</strong> {preset.settings.serviceSettings?.serviceNamePlural}</p>
                      <p><strong>Content:</strong> {preset.settings.contentSettings?.sectionNamePlural}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewPreset(preset)}
                        className="flex-1"
                      >
                        Preview
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        loading={applying === preset.id}
                        disabled={applying !== null}
                        className="flex-1"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Preview Modal */}
      {selectedPreset && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closePreview}>
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{selectedPreset.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPreset.name}</h2>
                    <p className="text-gray-600">{selectedPreset.description}</p>
                  </div>
                </div>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Theme */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Theme</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 rounded border-2 border-gray-300"
                        style={{ backgroundColor: selectedPreset.settings.themeSettings?.primaryColor }}
                      />
                      <div
                        className="w-12 h-12 rounded border-2 border-gray-300"
                        style={{ backgroundColor: selectedPreset.settings.themeSettings?.secondaryColor }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Colors: Primary & Secondary</p>
                      <p className="text-sm text-gray-600">Font: {selectedPreset.settings.themeSettings?.fontFamily}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Homepage Hero */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Homepage Hero</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-lg font-bold text-gray-900 mb-1">
                    {selectedPreset.settings.homepageSettings?.hero.headline}
                  </p>
                  <p className="text-lg font-bold mb-2" style={{ color: selectedPreset.settings.themeSettings?.primaryColor }}>
                    {selectedPreset.settings.homepageSettings?.hero.highlightedText}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {selectedPreset.settings.homepageSettings?.hero.subtitle}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['feature1', 'feature2', 'feature3'].map(key => {
                    const feature = selectedPreset.settings.homepageSettings?.features[key as keyof typeof selectedPreset.settings.homepageSettings.features];
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-sm text-gray-900 mb-1">{feature?.title}</p>
                        <p className="text-xs text-gray-600">{feature?.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settings */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>Business Name:</strong> {selectedPreset.settings.businessName}</p>
                  <p><strong>Services:</strong> {selectedPreset.settings.serviceSettings?.serviceNamePlural} (/{selectedPreset.settings.serviceSettings?.urlSlug})</p>
                  <p><strong>Content:</strong> {selectedPreset.settings.contentSettings?.sectionNamePlural} (/{selectedPreset.settings.contentSettings?.urlSlug})</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={closePreview} className="flex-1">
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    closePreview();
                    applyPreset(selectedPreset);
                  }}
                  loading={applying === selectedPreset.id}
                  className="flex-1"
                >
                  Apply This Preset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
