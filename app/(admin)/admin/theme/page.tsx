'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings, ThemeSettings } from '@/types/business-info';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SingleImageUploader from '@/components/admin/SingleImageUploader';

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));

      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as StoreSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'storeSettings', 'main'), {
        themeSettings: settings.themeSettings,
        updatedAt: Timestamp.now(),
      });
      alert('Theme settings saved successfully! Please refresh the page to see changes.');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateThemeSetting = (field: keyof ThemeSettings, value: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      themeSettings: {
        ...settings.themeSettings,
        primaryColor: settings.themeSettings?.primaryColor || '#3B82F6',
        secondaryColor: settings.themeSettings?.secondaryColor || '#10B981',
        fontFamily: settings.themeSettings?.fontFamily || 'Inter',
        [field]: value,
      } as ThemeSettings,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    );
  }

  const theme = settings.themeSettings || {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    fontFamily: 'Inter',
  };

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Default)' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
    { value: 'Merriweather', label: 'Merriweather (Serif)' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  ];

  const colorPresets = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#10B981' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#EC4899' },
    { name: 'Green', primary: '#10B981', secondary: '#3B82F6' },
    { name: 'Orange', primary: '#F97316', secondary: '#EAB308' },
    { name: 'Red', primary: '#EF4444', secondary: '#F59E0B' },
    { name: 'Teal', primary: '#14B8A6', secondary: '#06B6D4' },
    { name: 'Indigo', primary: '#6366F1', secondary: '#8B5CF6' },
  ];

  const applyColorPreset = (preset: { primary: string; secondary: string }) => {
    if (!settings) return;

    setSettings({
      ...settings,
      themeSettings: {
        ...theme,
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Theme Settings</h1>
        <p className="text-gray-600 mt-1">Customize your brand colors, fonts, and logo</p>
      </div>

      {/* Brand Colors */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Brand Colors</h2>
            <p className="text-sm text-gray-600">Choose colors that represent your brand identity</p>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Presets (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset)}
                  className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
                  title={`Apply ${preset.name} preset`}
                >
                  <div className="flex gap-1 mb-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{preset.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click a preset to apply it, then customize below if needed
            </p>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                />
                <div className="flex-1">
                  <Input
                    value={theme.primaryColor}
                    onChange={(e) => updateThemeSetting('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    helperText="Used for buttons, links, and accents"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={theme.secondaryColor}
                  onChange={(e) => updateThemeSetting('secondaryColor', e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                />
                <div className="flex-1">
                  <Input
                    value={theme.secondaryColor}
                    onChange={(e) => updateThemeSetting('secondaryColor', e.target.value)}
                    placeholder="#10B981"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    helperText="Used for success states and highlights"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  style={{ backgroundColor: theme.primaryColor }}
                  className="px-4 py-2 text-white rounded-lg font-medium shadow-sm"
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: theme.secondaryColor }}
                  className="px-4 py-2 text-white rounded-lg font-medium shadow-sm"
                >
                  Secondary Button
                </button>
              </div>
              <p className="text-sm text-gray-600">
                This is how your{' '}
                <span style={{ color: theme.primaryColor }} className="font-semibold">
                  primary
                </span>{' '}
                and{' '}
                <span style={{ color: theme.secondaryColor }} className="font-semibold">
                  secondary
                </span>{' '}
                colors will look in text.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Typography */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Typography</h2>
            <p className="text-sm text-gray-600">Select the primary font for your website</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={theme.fontFamily}
              onChange={(e) => updateThemeSetting('fontFamily', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Google Fonts will be loaded automatically
            </p>
          </div>

          {/* Font Preview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <div style={{ fontFamily: theme.fontFamily }}>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                The quick brown fox jumps over the lazy dog
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                This is how your headings and body text will look with {theme.fontFamily}.
              </p>
              <p className="text-sm text-gray-500">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                abcdefghijklmnopqrstuvwxyz<br />
                0123456789
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Branding Assets */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Branding Assets</h2>
            <p className="text-sm text-gray-600">Upload your logo and favicon</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SingleImageUploader
                image={theme.logo || ''}
                onChange={(url) => updateThemeSetting('logo', url)}
                folder="branding/logos"
                label="Logo"
              />
              <p className="text-sm text-gray-500 mt-2">
                Recommended: PNG with transparent background, 200x60px or similar aspect ratio
              </p>
            </div>

            <div>
              <SingleImageUploader
                image={theme.favicon || ''}
                onChange={(url) => updateThemeSetting('favicon', url)}
                folder="branding/favicons"
                label="Favicon"
              />
              <p className="text-sm text-gray-500 mt-2">
                Recommended: Square image (512x512px) that works at small sizes
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => window.location.reload()}
        >
          Reset
        </Button>
        <Button type="submit" variant="primary" loading={saving} size="lg">
          Save Theme Settings
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">Important Notes</h3>
            <div className="text-sm text-blue-800 mt-1 space-y-1">
              <p>• Theme changes may require a page refresh to fully apply</p>
              <p>• Your logo will appear in the header navigation</p>
              <p>• The favicon will appear in browser tabs and bookmarks</p>
              <p>• Choose high-contrast colors for better accessibility</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
