'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings, HomepageSettings } from '@/types/business-info';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomepageSettingsPage() {
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
        homepageSettings: settings.homepageSettings,
        updatedAt: Timestamp.now(),
      });
      alert('Homepage settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateHomepageSetting = (path: string, value: string) => {
    if (!settings) return;

    const pathParts = path.split('.');
    const newHomepageSettings = JSON.parse(JSON.stringify(settings.homepageSettings || {}));

    let current: any = newHomepageSettings;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    setSettings({
      ...settings,
      homepageSettings: newHomepageSettings as HomepageSettings,
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

  const homepage = settings.homepageSettings || {
    hero: {
      headline: '',
      highlightedText: '',
      subtitle: '',
      primaryCTA: { text: '', link: '' },
      secondaryCTA: { text: '', link: '' },
    },
    features: {
      feature1: { title: '', description: '', icon: 'check' },
      feature2: { title: '', description: '', icon: 'clock' },
      feature3: { title: '', description: '', icon: 'shield' },
    },
    cta: {
      heading: '',
      subtitle: '',
      buttonText: '',
      buttonLink: '',
    },
  };

  const iconOptions = [
    { value: 'check', label: 'Check Mark' },
    { value: 'clock', label: 'Clock' },
    { value: 'shield', label: 'Shield' },
    { value: 'star', label: 'Star' },
    { value: 'users', label: 'Users' },
    { value: 'heart', label: 'Heart' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homepage Settings</h1>
        <p className="text-gray-600 mt-1">Customize your homepage content and call-to-actions</p>
      </div>

      {/* Hero Section */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Hero Section</h2>
          <p className="text-sm text-gray-600">The main banner section at the top of your homepage</p>

          <Input
            label="Headline"
            value={homepage.hero.headline}
            onChange={(e) => updateHomepageSetting('hero.headline', e.target.value)}
            placeholder="Professional Services"
            helperText="First line of the hero heading"
          />

          <Input
            label="Highlighted Text"
            value={homepage.hero.highlightedText}
            onChange={(e) => updateHomepageSetting('hero.highlightedText', e.target.value)}
            placeholder="Tailored to Your Needs"
            helperText="Second line of the hero heading (shown in primary color)"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <textarea
              value={homepage.hero.subtitle}
              onChange={(e) => updateHomepageSetting('hero.subtitle', e.target.value)}
              rows={2}
              placeholder="Expert solutions to help your business grow and succeed."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-sm text-gray-500 mt-1">Supporting text below the headline</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Primary CTA Button</h3>
              <Input
                label="Button Text"
                value={homepage.hero.primaryCTA.text}
                onChange={(e) => updateHomepageSetting('hero.primaryCTA.text', e.target.value)}
                placeholder="View Services"
              />
              <Input
                label="Button Link"
                value={homepage.hero.primaryCTA.link}
                onChange={(e) => updateHomepageSetting('hero.primaryCTA.link', e.target.value)}
                placeholder="/services"
                className="mt-3"
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Secondary CTA Button</h3>
              <Input
                label="Button Text"
                value={homepage.hero.secondaryCTA.text}
                onChange={(e) => updateHomepageSetting('hero.secondaryCTA.text', e.target.value)}
                placeholder="Learn More"
              />
              <Input
                label="Button Link"
                value={homepage.hero.secondaryCTA.link}
                onChange={(e) => updateHomepageSetting('hero.secondaryCTA.link', e.target.value)}
                placeholder="/about"
                className="mt-3"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Features Section */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Features Section</h2>
          <p className="text-sm text-gray-600">Three feature highlights displayed below the hero</p>

          {['feature1', 'feature2', 'feature3'].map((featureKey, index) => {
            const feature = homepage.features[featureKey as keyof typeof homepage.features];
            return (
              <div key={featureKey} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-800 mb-4">Feature {index + 1}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title"
                    value={feature.title}
                    onChange={(e) => updateHomepageSetting(`features.${featureKey}.title`, e.target.value)}
                    placeholder="Quality Service"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <select
                      value={feature.icon}
                      onChange={(e) => updateHomepageSetting(`features.${featureKey}.icon`, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {iconOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={feature.description}
                    onChange={(e) => updateHomepageSetting(`features.${featureKey}.description`, e.target.value)}
                    rows={2}
                    placeholder="Professional service with attention to detail and excellence."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* CTA Section */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Call-to-Action Section</h2>
          <p className="text-sm text-gray-600">The final CTA banner at the bottom of your homepage</p>

          <Input
            label="Heading"
            value={homepage.cta.heading}
            onChange={(e) => updateHomepageSetting('cta.heading', e.target.value)}
            placeholder="Ready to Get Started?"
            helperText="Main heading for the CTA section"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <textarea
              value={homepage.cta.subtitle}
              onChange={(e) => updateHomepageSetting('cta.subtitle', e.target.value)}
              rows={2}
              placeholder="Join our growing community of satisfied clients"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-sm text-gray-500 mt-1">Supporting text below the heading</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Button Text"
              value={homepage.cta.buttonText}
              onChange={(e) => updateHomepageSetting('cta.buttonText', e.target.value)}
              placeholder="Create Your Account"
            />

            <Input
              label="Button Link"
              value={homepage.cta.buttonLink}
              onChange={(e) => updateHomepageSetting('cta.buttonLink', e.target.value)}
              placeholder="/register"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => window.open('/', '_blank')}
        >
          Preview Homepage
        </Button>
        <Button type="submit" variant="primary" loading={saving} size="lg">
          Save Homepage Settings
        </Button>
      </div>
    </form>
  );
}
