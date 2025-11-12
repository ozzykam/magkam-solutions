/**
 * Analytics Setup Check API Route
 *
 * Checks which analytics services are properly configured and ready to use.
 *
 * GET /api/analytics/setup-check
 *
 * Authentication: Requires admin role
 */

import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { isAdmin } from '@/lib/auth-helpers';
import type { StoreSettings } from '@/types/business-info';

interface SetupStatus {
  platform: string;
  enabled: boolean;
  configured: boolean;
  missingConfig?: string[];
  ready: boolean;
}

export async function GET() {
  try {
    // Check admin authentication
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Fetch settings from Firestore
    const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
    if (!settingsDoc.exists()) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    const settings = { id: settingsDoc.id, ...settingsDoc.data() } as StoreSettings;
    const analyticsConfig = settings.features?.analytics;

    const setupStatus: {
      analyticsEnabled: boolean;
      platforms: SetupStatus[];
      overallReady: boolean;
    } = {
      analyticsEnabled: analyticsConfig?.enabled ?? false,
      platforms: [],
      overallReady: false,
    };

    // Check Google Analytics
    if (analyticsConfig?.google?.enabled) {
      const missing: string[] = [];

      if (!analyticsConfig.google.measurementId) {
        missing.push('GA4 Measurement ID (in admin settings)');
      }
      if (!process.env.GA4_PROPERTY_ID) {
        missing.push('GA4_PROPERTY_ID (environment variable)');
      }
      if (!process.env.GOOGLE_ANALYTICS_ACCESS_TOKEN) {
        missing.push('GOOGLE_ANALYTICS_ACCESS_TOKEN (environment variable)');
      }

      setupStatus.platforms.push({
        platform: 'Google Analytics 4',
        enabled: true,
        configured: missing.length === 0,
        missingConfig: missing.length > 0 ? missing : undefined,
        ready: missing.length === 0,
      });
    }

    // Check Google Search Console
    if (analyticsConfig?.google?.enabled && analyticsConfig.google.siteVerification) {
      const missing: string[] = [];

      if (!process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL) {
        missing.push('GOOGLE_SEARCH_CONSOLE_SITE_URL (environment variable)');
      }
      if (!process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN) {
        missing.push('GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN (environment variable)');
      }

      setupStatus.platforms.push({
        platform: 'Google Search Console',
        enabled: true,
        configured: missing.length === 0,
        missingConfig: missing.length > 0 ? missing : undefined,
        ready: missing.length === 0,
      });
    }

    // Check Bing Webmaster Tools
    if (analyticsConfig?.bing?.enabled && analyticsConfig.bing.siteVerification) {
      const missing: string[] = [];

      if (!process.env.BING_WEBMASTER_SITE_URL) {
        missing.push('BING_WEBMASTER_SITE_URL (environment variable)');
      }
      if (!process.env.BING_WEBMASTER_API_KEY) {
        missing.push('BING_WEBMASTER_API_KEY (environment variable)');
      }

      setupStatus.platforms.push({
        platform: 'Bing Webmaster Tools',
        enabled: true,
        configured: missing.length === 0,
        missingConfig: missing.length > 0 ? missing : undefined,
        ready: missing.length === 0,
      });
    }

    // Check Microsoft Clarity
    if (analyticsConfig?.bing?.enabled && analyticsConfig.bing.clarityId) {
      setupStatus.platforms.push({
        platform: 'Microsoft Clarity',
        enabled: true,
        configured: true,
        ready: true, // Clarity only needs the ID in settings, no API needed
      });
    }

    // Overall ready if at least one platform is ready
    setupStatus.overallReady = setupStatus.platforms.some(p => p.ready);

    return NextResponse.json(setupStatus);
  } catch (error) {
    console.error('Error in setup check API:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}
