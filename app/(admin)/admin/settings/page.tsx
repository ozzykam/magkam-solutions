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

  const updateOperatingHours = (day: string, field: string, value: string | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      operatingHours: {
        ...settings.operatingHours,
        [day]: {
          ...settings.operatingHours[day],
          [field]: value,
        },
      },
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

  const days = [
    { key: '0', label: 'Sunday' },
    { key: '1', label: 'Monday' },
    { key: '2', label: 'Tuesday' },
    { key: '3', label: 'Wednesday' },
    { key: '4', label: 'Thursday' },
    { key: '5', label: 'Friday' },
    { key: '6', label: 'Saturday' },
  ];

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

  const updateContentSettings = (field: string, value: string | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      contentSettings: {
        enabled: settings.contentSettings?.enabled ?? true,
        sectionName: settings.contentSettings?.sectionName || 'Blog',
        sectionNamePlural: settings.contentSettings?.sectionNamePlural || 'Blog Posts',
        itemsLabel: settings.contentSettings?.itemsLabel || 'Featured Products',
        itemsLabelSingular: settings.contentSettings?.itemsLabelSingular || 'Featured Product',
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
        itemsLabel: 'Featured Products',
        itemsLabelSingular: 'Featured Product',
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
        <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600 mt-1">Configure business information, store hours, and time slot capacity</p>
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

      {/* Delivery Settings */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Delivery Settings</h2>
          <p className="text-sm text-gray-600">Configure delivery radius and availability</p>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="deliveryEnabled"
              checked={settings.deliveryEnabled ?? true}
              onChange={(e) => updateSetting('deliveryEnabled', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="deliveryEnabled" className="text-sm font-medium text-gray-700">
              Enable Delivery Service
            </label>
          </div>

          {settings.deliveryEnabled !== false && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Delivery radius is calculated from your store&apos;s address above.
                  Make sure your store address is accurate before setting the delivery radius.
                </p>
              </div>

              <Input
                label="Delivery Radius (miles)"
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={settings.deliveryRadius || ''}
                onChange={(e) => updateSetting('deliveryRadius', parseFloat(e.target.value) || 0)}
                placeholder="10"
                helperText="Maximum distance from your store for deliveries (e.g., 10 miles)"
              />

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Store Coordinates:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!settings.address?.street || !settings.address?.city || !settings.address?.state || !settings.address?.zipCode) {
                        alert('Please fill in your complete store address first');
                        return;
                      }

                      if (!confirm('This will update your store location based on the current address. Continue?')) {
                        return;
                      }

                      try {
                        const response = await fetch('/api/geocode', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            address: `${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zipCode}`
                          }),
                        });

                        const data = await response.json();

                        if (data.latitude && data.longitude) {
                          setSettings({
                            ...settings,
                            storeLocation: {
                              latitude: data.latitude,
                              longitude: data.longitude,
                            },
                          } as StoreSettings);
                          alert('Store location updated successfully!');
                        } else {
                          alert('Could not geocode address. Please verify the address is correct.');
                        }
                      } catch (error) {
                        console.error('Error geocoding:', error);
                        alert('Failed to geocode address');
                      }
                    }}
                  >
                    {settings.storeLocation ? 'Update Location' : 'Set Location'}
                  </Button>
                </div>

                {settings.storeLocation ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Latitude: {settings.storeLocation.latitude.toFixed(6)}</p>
                    <p>Longitude: {settings.storeLocation.longitude.toFixed(6)}</p>
                    <p className="text-xs text-green-600 mt-2">✓ Location verified</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-orange-600">
                      Store location not set. Click the button above to geocode your store address.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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
                  value={settings.contentSettings?.itemsLabelSingular || 'Featured Product'}
                  onChange={(e) => updateContentSettings('itemsLabelSingular', e.target.value)}
                  placeholder="Ingredient, Featured Piece, Material"
                  helperText="e.g., 'Ingredient' or 'Featured Piece'"
                />

                <Input
                  label="Items Label (Plural)"
                  value={settings.contentSettings?.itemsLabel || 'Featured Products'}
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

      {/* Capacity Settings */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Time Slot Capacity</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Max Orders Per Hour"
              type="number"
              min="1"
              value={settings.maxOrdersPerHour}
              onChange={(e) => updateSetting('maxOrdersPerHour', parseInt(e.target.value))}
              helperText="Maximum number of orders that can be accepted per time slot"
            />

            <Input
              label="Max Items Per Hour"
              type="number"
              min="1"
              value={settings.maxItemsPerHour}
              onChange={(e) => updateSetting('maxItemsPerHour', parseInt(e.target.value))}
              helperText="Maximum number of total items per time slot"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Slot Duration (minutes)"
              type="number"
              min="15"
              step="15"
              value={settings.slotDurationMinutes}
              onChange={(e) => updateSetting('slotDurationMinutes', parseInt(e.target.value))}
              helperText="Length of each time slot (recommended: 60)"
            />

            <Input
              label="Advance Booking Days"
              type="number"
              min="1"
              max="30"
              value={settings.advanceBookingDays}
              onChange={(e) => updateSetting('advanceBookingDays', parseInt(e.target.value))}
              helperText="How far in advance customers can book"
            />
          </div>
        </div>
      </Card>

      {/* Operating Hours */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>

          <div className="space-y-4">
            {days.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={!settings.operatingHours[key].closed}
                    onChange={(e) => updateOperatingHours(key, 'closed', !e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600 mr-4">Open</span>

                  {!settings.operatingHours[key].closed && (
                    <>
                      <input
                        type="time"
                        value={settings.operatingHours[key].open}
                        onChange={(e) => updateOperatingHours(key, 'open', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="text-sm text-gray-600">to</span>
                      <input
                        type="time"
                        value={settings.operatingHours[key].close}
                        onChange={(e) => updateOperatingHours(key, 'close', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Blackout Dates */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Blackout Dates</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Closed Dates (comma-separated YYYY-MM-DD)
            </label>
            <textarea
              value={settings.blackoutDates.join(', ')}
              onChange={(e) => {
                const dates = e.target.value.split(',').map(d => d.trim()).filter(Boolean);
                updateSetting('blackoutDates', dates);
              }}
              rows={3}
              placeholder="2025-12-25, 2025-01-01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter dates when the store will be closed (holidays, etc.)
            </p>
          </div>
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
