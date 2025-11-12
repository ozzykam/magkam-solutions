/**
 * Analytics Dashboard API Route
 *
 * Fetches complete analytics dashboard data from all enabled platforms.
 *
 * GET /api/analytics/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Authentication: Requires admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { isAdmin } from '@/lib/auth-helpers';
import { AnalyticsAggregator } from '@/features/google-analytics/services';
import type { StoreSettings } from '@/types/business-info';
import type { AnalyticsPlatform } from '@/features/google-analytics/types/analytics';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

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

    if (!analyticsConfig?.enabled) {
      return NextResponse.json(
        { error: 'Analytics feature is not enabled' },
        { status: 403 }
      );
    }

    // Determine active platform
    const googleEnabled = analyticsConfig.google?.enabled ?? false;
    const bingEnabled = analyticsConfig.bing?.enabled ?? false;

    let platform: AnalyticsPlatform = 'none';
    if (googleEnabled && bingEnabled) {
      platform = 'both';
    } else if (googleEnabled) {
      platform = 'google';
    } else if (bingEnabled) {
      platform = 'bing';
    }

    if (platform === 'none') {
      return NextResponse.json(
        { error: 'No analytics platforms are enabled' },
        { status: 403 }
      );
    }

    // Get credentials from environment variables
    // In production, these should be stored securely
    const googlePropertyId = process.env.GA4_PROPERTY_ID;
    const googleAccessToken = process.env.GOOGLE_ANALYTICS_ACCESS_TOKEN;
    const searchConsoleSiteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
    const searchConsoleAccessToken = process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN;
    const bingApiKey = process.env.BING_WEBMASTER_API_KEY;
    const bingSiteUrl = process.env.BING_WEBMASTER_SITE_URL;

    // Create aggregator
    const aggregator = new AnalyticsAggregator({
      platform,
      google: googleEnabled && googlePropertyId && googleAccessToken ? {
        propertyId: googlePropertyId,
        accessToken: googleAccessToken,
      } : undefined,
      searchConsole: googleEnabled && searchConsoleSiteUrl && searchConsoleAccessToken ? {
        siteUrl: searchConsoleSiteUrl,
        accessToken: searchConsoleAccessToken,
      } : undefined,
      bing: bingEnabled && bingSiteUrl && bingApiKey ? {
        siteUrl: bingSiteUrl,
        apiKey: bingApiKey,
      } : undefined,
      clarity: bingEnabled && analyticsConfig.bing?.clarityId ? {
        projectId: analyticsConfig.bing.clarityId,
      } : undefined,
    });

    // Fetch dashboard data
    const dashboardData = await aggregator.fetchDashboardData(startDate, endDate);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error in analytics dashboard API:', error);

    // Check if it's a setup error
    if (error instanceof Error && error.message.includes('requires')) {
      return NextResponse.json(
        {
          error: 'Analytics service not configured',
          message: error.message,
          setupRequired: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
