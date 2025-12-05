'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function FeaturesPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
      if (settingsDoc.exists()) {
        setSettings({ id: settingsDoc.id, ...settingsDoc.data() } as StoreSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'storeSettings', 'main'), {
        features: settings.features,
        updatedAt: Timestamp.now(),
      });
      alert('Feature settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (path: string, value: boolean | string | number) => {
    if (!settings) return;

    const pathParts = path.split('.');
    const newFeatures = JSON.parse(JSON.stringify(settings.features || {})) as Record<string, unknown>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = newFeatures;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;

    setSettings({
      ...settings,
      features: newFeatures,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load settings</p>
      </div>
    );
  }

  const features = settings.features || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Management</h1>
          <p className="text-gray-600 mt-1">Enable or disable platform features</p>
        </div>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
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
            <h3 className="text-sm font-medium text-blue-900">Feature Toggles</h3>
            <p className="text-sm text-blue-800 mt-1">
              Disable features you don&apos;t need to simplify your platform and improve performance.
              Changes take effect immediately after saving.
            </p>
          </div>
        </div>
      </div>

      {/* Calculators */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🧮</span>
                Calculators
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Interactive calculators for service pricing, quotes, or estimates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.calculators?.enabled ?? true}
                onChange={(e) => updateFeature('calculators.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {features.calculators?.enabled && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.calculators?.showInNavigation ?? true}
                  onChange={(e) => updateFeature('calculators.showInNavigation', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show in navigation menu</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Reviews & Ratings */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                Reviews & Ratings
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Allow clients to leave reviews and ratings on services and content
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.reviews?.enabled ?? true}
                onChange={(e) => updateFeature('reviews.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {features.reviews?.enabled && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.reviews?.allowAnonymous ?? false}
                  onChange={(e) => updateFeature('reviews.allowAnonymous', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Allow anonymous reviews (without login)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.reviews?.requireModeration ?? false}
                  onChange={(e) => updateFeature('reviews.requireModeration', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Require admin approval before showing</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.reviews?.allowPhotos ?? true}
                  onChange={(e) => updateFeature('reviews.allowPhotos', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Allow photo uploads in reviews</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Bookmarks */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔖</span>
                Content Bookmarks
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Let users save content for later reading
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.bookmarks?.enabled ?? true}
                onChange={(e) => updateFeature('bookmarks.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {features.bookmarks?.enabled && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.bookmarks?.showInNavigation ?? true}
                  onChange={(e) => updateFeature('bookmarks.showInNavigation', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show bookmarks link in navigation</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Contact Forms */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📧</span>
                Contact Forms
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Allow visitors to send messages through contact forms
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.contact?.enabled ?? true}
                onChange={(e) => updateFeature('contact.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {features.contact?.enabled && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.contact?.requireAuth ?? false}
                  onChange={(e) => updateFeature('contact.requireAuth', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Require login to submit contact form</span>
              </label>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Notification Email (optional)
                </label>
                <Input
                  type="email"
                  placeholder="Override default admin email"
                  value={features.contact?.notificationEmail || ''}
                  onChange={(e) => updateFeature('contact.notificationEmail', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* User Registration */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                User Registration
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Allow visitors to create accounts and register
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.userRegistration?.enabled ?? true}
                onChange={(e) => updateFeature('userRegistration.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {features.userRegistration?.enabled && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.userRegistration?.requireEmailVerification ?? false}
                  onChange={(e) => updateFeature('userRegistration.requireEmailVerification', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Require email verification</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.userRegistration?.allowSocialLogin ?? false}
                  onChange={(e) => updateFeature('userRegistration.allowSocialLogin', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Enable social login (Google, Facebook)</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Search */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Search
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Global search across services and content
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.search?.enabled ?? true}
                onChange={(e) => updateFeature('search.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {features.search?.enabled && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.search?.searchServices ?? true}
                  onChange={(e) => updateFeature('search.searchServices', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Include services in search results</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={features.search?.searchContent ?? true}
                  onChange={(e) => updateFeature('search.searchContent', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Include content in search results</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button - Bottom */}
      <div className="flex justify-end pt-4">
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
