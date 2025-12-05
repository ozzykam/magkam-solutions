'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings, DEFAULT_STORE_SETTINGS } from '@/types/business-info';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SettingsPage() {
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
      } else {
        // Create default settings
        const defaultSettings: StoreSettings = {
          id: 'main',
          ...DEFAULT_STORE_SETTINGS,
          updatedAt: Timestamp.now(),
        };
        await setDoc(doc(db, 'storeSettings', 'main'), defaultSettings);
        setSettings(defaultSettings);
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
      const updatedSettings = {
        ...settings,
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'storeSettings', 'main'), updatedSettings);
      setSettings(updatedSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof StoreSettings, value: StoreSettings[keyof StoreSettings]) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value } as StoreSettings);
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

  const updateAddress = (field: 'street' | 'city' | 'state' | 'zipCode', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      address: {
        street: settings.address?.street || '',
        city: settings.address?.city || '',
        state: settings.address?.state || '',
        zipCode: settings.address?.zipCode || '',
        [field]: value,
      },
    });
  };

  const updateSocialMedia = (platform: 'facebook' | 'instagram' | 'x' | 'linkedin' | 'youtube', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialMedia: {
        facebook: settings.socialMedia?.facebook || '',
        instagram: settings.socialMedia?.instagram || '',
        x: settings.socialMedia?.x || '',
        linkedin: settings.socialMedia?.linkedin || '',
        youtube: settings.socialMedia?.youtube || '',
        [platform]: value,
      },
    });
  };

  const updateServiceSettings = (field: string, value: string | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      serviceSettings: {
        enabled: settings.serviceSettings?.enabled ?? true,
        serviceName: settings.serviceSettings?.serviceName || 'Service',
        serviceNamePlural: settings.serviceSettings?.serviceNamePlural || 'Services',
        urlSlug: settings.serviceSettings?.urlSlug || 'services',
        [field]: value,
      },
    });
  };

  const updateContentSettings = (field: string, value: string | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      contentSettings: {
        enabled: settings.contentSettings?.enabled ?? true,
        sectionName: settings.contentSettings?.sectionName || 'Blog',
        sectionNamePlural: settings.contentSettings?.sectionNamePlural || 'Blog Posts',
        itemsLabel: settings.contentSettings?.itemsLabel || 'Featured Services',
        itemsLabelSingular: settings.contentSettings?.itemsLabelSingular || 'Featured Service',
        urlSlug: settings.contentSettings?.urlSlug || 'blog',
        showAuthor: settings.contentSettings?.showAuthor ?? true,
        showViewCount: settings.contentSettings?.showViewCount ?? false,
        allowVendorPosts: settings.contentSettings?.allowVendorPosts ?? false,
        [field]: value,
      },
    });
  };

  const applyContentTemplate = (template: 'recipes' | 'styleGuides' | 'howTos' | 'blog') => {
    const templates = {
      recipes: {
        sectionName: 'Recipe',
        sectionNamePlural: 'Recipes',
        itemsLabel: 'Ingredients',
        itemsLabelSingular: 'Ingredient',
        urlSlug: 'recipes',
      },
      styleGuides: {
        sectionName: 'Style Guide',
        sectionNamePlural: 'Style Guides',
        itemsLabel: 'Featured Pieces',
        itemsLabelSingular: 'Featured Piece',
        urlSlug: 'style-guides',
      },
      howTos: {
        sectionName: 'How-To',
        sectionNamePlural: 'How-Tos',
        itemsLabel: 'Materials Needed',
        itemsLabelSingular: 'Material',
        urlSlug: 'how-tos',
      },
      blog: {
        sectionName: 'Blog Post',
        sectionNamePlural: 'Blog Posts',
        itemsLabel: 'Featured Services',
        itemsLabelSingular: 'Featured Service',
        urlSlug: 'blog',
      },
    };

    const selectedTemplate = templates[template];
    if (!settings) return;

    setSettings({
      ...settings,
      contentSettings: {
        ...settings.contentSettings,
        enabled: settings.contentSettings?.enabled ?? true,
        showAuthor: settings.contentSettings?.showAuthor ?? true,
        showViewCount: settings.contentSettings?.showViewCount ?? false,
        allowVendorPosts: settings.contentSettings?.allowVendorPosts ?? false,
        ...selectedTemplate,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-gray-600 mt-1">Configure business information, content settings, and preferences</p>
      </div>

      {/* Business Information */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>

          <Input
            label="Business Name"
            value={settings.businessName || ''}
            onChange={(e) => updateSetting('businessName', e.target.value)}
            placeholder="Local Market"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Description
            </label>
            <textarea
              value={settings.businessDescription || ''}
              onChange={(e) => updateSetting('businessDescription', e.target.value)}
              rows={3}
              placeholder="A marketplace connecting local farmers and artisans with the community..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={settings.email || ''}
              onChange={(e) => updateSetting('email', e.target.value)}
              placeholder="hello@localmarket.com"
            />

            <Input
              label="Phone"
              type="tel"
              value={settings.phone || ''}
              onChange={(e) => updateSetting('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Address</h3>

            <Input
              label="Street Address"
              value={settings.address?.street || ''}
              onChange={(e) => updateAddress('street', e.target.value)}
              placeholder="123 Main St"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={settings.address?.city || ''}
                onChange={(e) => updateAddress('city', e.target.value)}
                placeholder="Springfield"
              />

              <Input
                label="State"
                value={settings.address?.state || ''}
                onChange={(e) => updateAddress('state', e.target.value)}
                placeholder="IL"
              />

              <Input
                label="ZIP Code"
                value={settings.address?.zipCode || ''}
                onChange={(e) => updateAddress('zipCode', e.target.value)}
                placeholder="62701"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Social Media */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Social Media</h2>
          <p className="text-sm text-gray-600">Add your social media profile URLs for SEO and customer engagement</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Facebook URL"
              type="url"
              value={settings.socialMedia?.facebook || ''}
              onChange={(e) => updateSocialMedia('facebook', e.target.value)}
              placeholder="https://facebook.com/yourbusiness"
              helperText="Full URL to your Facebook page"
            />

            <Input
              label="Instagram URL"
              type="url"
              value={settings.socialMedia?.instagram || ''}
              onChange={(e) => updateSocialMedia('instagram', e.target.value)}
              placeholder="https://instagram.com/yourbusiness"
              helperText="Full URL to your Instagram profile"
            />

            <Input
              label="X (Twitter) URL"
              type="url"
              value={settings.socialMedia?.x || ''}
              onChange={(e) => updateSocialMedia('x', e.target.value)}
              placeholder="https://x.com/yourbusiness"
              helperText="Full URL to your X/Twitter profile"
            />

            <Input
              label="LinkedIn URL"
              type="url"
              value={settings.socialMedia?.linkedin || ''}
              onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourbusiness"
              helperText="Full URL to your LinkedIn page"
            />

            <Input
              label="YouTube URL"
              type="url"
              value={settings.socialMedia?.youtube || ''}
              onChange={(e) => updateSocialMedia('youtube', e.target.value)}
              placeholder="https://youtube.com/@yourbusiness"
              helperText="Full URL to your YouTube channel"
            />
          </div>
        </div>
      </Card>

      {/* Service Settings */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Service Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Configure how your services/products/offerings are labeled</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Enabled</span>
              <input
                type="checkbox"
                checked={settings.serviceSettings?.enabled ?? true}
                onChange={(e) => updateServiceSettings('enabled', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </div>
          </div>

          {settings.serviceSettings?.enabled !== false && (
            <>
              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Presets (optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateServiceSettings('serviceName', 'Service');
                      updateServiceSettings('serviceNamePlural', 'Services');
                      updateServiceSettings('urlSlug', 'services');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Services
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateServiceSettings('serviceName', 'Product');
                      updateServiceSettings('serviceNamePlural', 'Products');
                      updateServiceSettings('urlSlug', 'products');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Products
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateServiceSettings('serviceName', 'Solution');
                      updateServiceSettings('serviceNamePlural', 'Solutions');
                      updateServiceSettings('urlSlug', 'solutions');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Solutions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateServiceSettings('serviceName', 'Offering');
                      updateServiceSettings('serviceNamePlural', 'Offerings');
                      updateServiceSettings('urlSlug', 'offerings');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Offerings
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click a preset to apply it, or customize manually below
                </p>
              </div>

              {/* Custom Labels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name (Singular)"
                  value={settings.serviceSettings?.serviceName || 'Service'}
                  onChange={(e) => updateServiceSettings('serviceName', e.target.value)}
                  placeholder="Service, Product, Solution"
                  helperText="e.g., 'Service' or 'Product'"
                />

                <Input
                  label="Name (Plural)"
                  value={settings.serviceSettings?.serviceNamePlural || 'Services'}
                  onChange={(e) => updateServiceSettings('serviceNamePlural', e.target.value)}
                  placeholder="Services, Products, Solutions"
                  helperText="e.g., 'Services' or 'Products'"
                />

                <Input
                  label="URL Slug"
                  value={settings.serviceSettings?.urlSlug || 'services'}
                  onChange={(e) => updateServiceSettings('urlSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="services, products, solutions"
                  helperText="Used in URLs (e.g., /services)"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Navigation:&quot;View {settings.serviceSettings?.serviceNamePlural || 'Services'}&quot;</p>
                  <p>• Page Title: &quot;{settings.serviceSettings?.serviceNamePlural || 'Services'}&quot;</p>
                  <p>• Button: &quot;Add {settings.serviceSettings?.serviceName || 'Service'}&quot;</p>
                  <p>• URL: /{settings.serviceSettings?.urlSlug || 'services'}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Content Settings */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Content Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Configure your blog, recipes, style guides, or other content section</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Enabled</span>
              <input
                type="checkbox"
                checked={settings.contentSettings?.enabled ?? true}
                onChange={(e) => updateContentSettings('enabled', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </div>
          </div>

          {settings.contentSettings?.enabled !== false && (
            <>
              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates (optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyContentTemplate('recipes')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Recipes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyContentTemplate('styleGuides')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Style Guides
                  </button>
                  <button
                    type="button"
                    onClick={() => applyContentTemplate('howTos')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    How-Tos
                  </button>
                  <button
                    type="button"
                    onClick={() => applyContentTemplate('blog')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    Blog
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click a template to auto-fill the fields below, or customize manually
                </p>
              </div>

              {/* Custom Labels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Section Name (Singular)"
                  value={settings.contentSettings?.sectionName || 'Blog Post'}
                  onChange={(e) => updateContentSettings('sectionName', e.target.value)}
                  placeholder="Recipe, Style Guide, Blog Post"
                  helperText="e.g., 'Recipe' or 'Style Guide'"
                />

                <Input
                  label="Section Name (Plural)"
                  value={settings.contentSettings?.sectionNamePlural || 'Blog Posts'}
                  onChange={(e) => updateContentSettings('sectionNamePlural', e.target.value)}
                  placeholder="Recipes, Style Guides, Blog Posts"
                  helperText="e.g., 'Recipes' or 'Style Guides'"
                />

                <Input
                  label="Items Label (Singular)"
                  value={settings.contentSettings?.itemsLabelSingular || 'Featured Service'}
                  onChange={(e) => updateContentSettings('itemsLabelSingular', e.target.value)}
                  placeholder="Ingredient, Featured Piece, Material"
                  helperText="e.g., 'Ingredient' or 'Featured Piece'"
                />

                <Input
                  label="Items Label (Plural)"
                  value={settings.contentSettings?.itemsLabel || 'Featured Services'}
                  onChange={(e) => updateContentSettings('itemsLabel', e.target.value)}
                  placeholder="Ingredients, Featured Pieces, Materials"
                  helperText="e.g., 'Ingredients' or 'Featured Pieces'"
                />

                <Input
                  label="URL Slug"
                  value={settings.contentSettings?.urlSlug || 'blog'}
                  onChange={(e) => updateContentSettings('urlSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="recipes, style-guides, blog"
                  helperText="Used in URLs (e.g., /recipes)"
                />
              </div>

              {/* Display Options */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Display Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.contentSettings?.showAuthor ?? true}
                      onChange={(e) => updateContentSettings('showAuthor', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Show author name on posts</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.contentSettings?.showViewCount ?? false}
                      onChange={(e) => updateContentSettings('showViewCount', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Show view count on posts</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.contentSettings?.allowVendorPosts ?? false}
                      onChange={(e) => updateContentSettings('allowVendorPosts', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Allow vendors to create posts</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>

          <Input
            label="Admin Notification Email"
            type="email"
            value={settings.adminNotificationEmail || ''}
            onChange={(e) => updateSetting('adminNotificationEmail', e.target.value)}
            placeholder="orders@yourbusiness.com"
            helperText="Email address to receive notifications when new orders are placed"
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving} size="lg">
          Save Settings
        </Button>
      </div>
    </form>
  );
}
