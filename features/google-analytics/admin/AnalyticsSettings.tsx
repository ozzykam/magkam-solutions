'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useSettings } from '@/lib/hooks/useSettings';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';

/**
 * Analytics Settings Panel
 *
 * Admin interface for configuring:
 * - Google Analytics 4
 * - Google Search Console
 * - Microsoft Clarity
 * - Bing Webmaster Tools
 *
 * Part of the Professional/Enterprise tier features.
 */

export default function AnalyticsSettings() {
  const { settings, loading: settingsLoading } = useSettings();
  const { showToast } = useToast();

  // Main feature toggle
  const [enabled, setEnabled] = useState(false);

  // Google settings
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [measurementId, setMeasurementId] = useState('');
  const [googleVerification, setGoogleVerification] = useState('');
  const [trackEcommerce, setTrackEcommerce] = useState(true);
  const [anonymizeIp, setAnonymizeIp] = useState(true);

  // Bing/Microsoft settings
  const [bingEnabled, setBingEnabled] = useState(false);
  const [bingVerification, setBingVerification] = useState('');
  const [clarityId, setClarityId] = useState('');
  const [trackHeatmaps, setTrackHeatmaps] = useState(true);

  // Loading and error states
  const [saving, setSaving] = useState(false);

  // Load existing settings
  useEffect(() => {
    if (!settings) return;

    const analytics = settings.features?.analytics;

    setEnabled(analytics?.enabled ?? false);

    // Google settings
    setGoogleEnabled(analytics?.google?.enabled ?? false);
    setMeasurementId(analytics?.google?.measurementId ?? '');
    setGoogleVerification(analytics?.google?.siteVerification ?? '');
    setTrackEcommerce(analytics?.google?.trackEcommerce ?? true);
    setAnonymizeIp(analytics?.google?.anonymizeIp ?? true);

    // Bing settings
    setBingEnabled(analytics?.bing?.enabled ?? false);
    setBingVerification(analytics?.bing?.siteVerification ?? '');
    setClarityId(analytics?.bing?.clarityId ?? '');
    setTrackHeatmaps(analytics?.bing?.trackHeatmaps ?? true);
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const docRef = doc(db, 'storeSettings', 'main');

      await updateDoc(docRef, {
        'features.analytics': {
          enabled,
          google: {
            enabled: googleEnabled,
            measurementId: measurementId.trim() || undefined,
            siteVerification: googleVerification.trim() || undefined,
            trackEcommerce,
            anonymizeIp,
          },
          bing: {
            enabled: bingEnabled,
            siteVerification: bingVerification.trim() || undefined,
            clarityId: clarityId.trim() || undefined,
            trackHeatmaps,
          },
          cookieConsent: false, // Can be enhanced later
          dataRetentionDays: 90, // Default retention
        },
        updatedAt: Timestamp.now(),
      });

      showToast('Analytics settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving analytics settings:', error);
      showToast('Failed to save analytics settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & SEO Tracking</h2>
        <p className="text-gray-600 mt-2">
          Configure Google Analytics, Bing Webmaster Tools, and Microsoft Clarity for advanced analytics and SEO insights.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📊 Professional/Enterprise Feature:</strong> This feature provides detailed analytics,
            search performance tracking, and UX insights to help you optimize your store and increase sales.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Master Toggle */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="analytics-enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
          />
          <div className="flex-1">
            <label htmlFor="analytics-enabled" className="text-lg font-semibold text-gray-900 cursor-pointer">
              Enable Analytics & SEO Tracking
            </label>
            <p className="text-sm text-gray-600 mt-1">
              Turn on analytics tracking across all configured platforms.
              You can enable individual platforms below.
            </p>
          </div>
        </div>

        {/* Google Analytics Section */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="google-enabled"
              checked={googleEnabled}
              onChange={(e) => setGoogleEnabled(e.target.checked)}
              disabled={!enabled}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
            />
            <div className="flex-1">
              <label htmlFor="google-enabled" className="text-lg font-semibold text-gray-900 cursor-pointer">
                Google Analytics & Search Console
              </label>
              <p className="text-sm text-gray-600">
                Track website traffic, user behavior, and search performance on Google.
              </p>
            </div>
          </div>

          {googleEnabled && enabled && (
            <div className="ml-8 space-y-4 mt-4 pt-4 border-t">
              {/* GA4 Measurement ID */}
              <div>
                <label htmlFor="measurement-id" className="block text-sm font-medium text-gray-700 mb-1">
                  GA4 Measurement ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="measurement-id"
                  value={measurementId}
                  onChange={(e) => setMeasurementId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find this in Google Analytics → Admin → Property → Data Streams
                </p>
              </div>

              {/* Google Search Console Verification */}
              <div>
                <label htmlFor="google-verification" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Console Verification Code
                </label>
                <input
                  type="text"
                  id="google-verification"
                  value={googleVerification}
                  onChange={(e) => setGoogleVerification(e.target.value)}
                  placeholder="abc123def456..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Google Search Console → Settings → Ownership verification → HTML tag method
                </p>
              </div>

              {/* Google Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="track-ecommerce"
                    checked={trackEcommerce}
                    onChange={(e) => setTrackEcommerce(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="track-ecommerce" className="text-sm text-gray-700 cursor-pointer">
                    Track e-commerce events (purchases, add to cart, etc.)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymize-ip"
                    checked={anonymizeIp}
                    onChange={(e) => setAnonymizeIp(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="anonymize-ip" className="text-sm text-gray-700 cursor-pointer">
                    Anonymize IP addresses (GDPR compliance)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bing/Microsoft Section */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="bing-enabled"
              checked={bingEnabled}
              onChange={(e) => setBingEnabled(e.target.checked)}
              disabled={!enabled}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
            />
            <div className="flex-1">
              <label htmlFor="bing-enabled" className="text-lg font-semibold text-gray-900 cursor-pointer">
                Bing Webmaster Tools & Microsoft Clarity
              </label>
              <p className="text-sm text-gray-600">
                Track search performance on Bing and get UX insights with heatmaps and session recordings (FREE!).
              </p>
            </div>
          </div>

          {bingEnabled && enabled && (
            <div className="ml-8 space-y-4 mt-4 pt-4 border-t">
              {/* Bing Verification */}
              <div>
                <label htmlFor="bing-verification" className="block text-sm font-medium text-gray-700 mb-1">
                  Bing Webmaster Verification Code
                </label>
                <input
                  type="text"
                  id="bing-verification"
                  value={bingVerification}
                  onChange={(e) => setBingVerification(e.target.value)}
                  placeholder="abc123def456..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Bing Webmaster Tools → Settings → Verify Ownership → HTML Meta Tag method
                </p>
              </div>

              {/* Clarity ID */}
              <div>
                <label htmlFor="clarity-id" className="block text-sm font-medium text-gray-700 mb-1">
                  Microsoft Clarity Project ID
                </label>
                <input
                  type="text"
                  id="clarity-id"
                  value={clarityId}
                  onChange={(e) => setClarityId(e.target.value)}
                  placeholder="abc123def4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Microsoft Clarity → Projects → Setup → Install tracking code
                </p>
              </div>

              {/* Bing Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="track-heatmaps"
                    checked={trackHeatmaps}
                    onChange={(e) => setTrackHeatmaps(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="track-heatmaps" className="text-sm text-gray-700 cursor-pointer">
                    Enable heatmaps and session recordings (Clarity)
                  </label>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Pro Tip:</strong> Microsoft Clarity is completely FREE and provides incredible UX insights
                  like where users click, how far they scroll, and recordings of user sessions. Highly recommended!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {enabled && (googleEnabled || bingEnabled) ? (
              <span className="text-green-600 font-medium">✓ Analytics tracking is active</span>
            ) : (
              <span className="text-gray-500">Analytics tracking is disabled</span>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">📚 Need Help Setting This Up?</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                Create a Google Analytics account
              </a>
            </li>
            <li>
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                Set up Google Search Console
              </a>
            </li>
            <li>
              <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                Create a Bing Webmaster Tools account
              </a>
            </li>
            <li>
              <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                Sign up for Microsoft Clarity (FREE!)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
