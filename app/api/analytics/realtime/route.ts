/**
 * Realtime Analytics API Route
 *
 * Fetches realtime active users from Google Analytics 4.
 *
 * GET /api/analytics/realtime
 *
 * Authentication: Requires admin role
 */

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth-helpers';
import { GoogleAnalyticsService } from '@/features/google-analytics/services';

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

    // Get credentials from environment variables
    const googlePropertyId = process.env.GA4_PROPERTY_ID;
    const googleAccessToken = process.env.GOOGLE_ANALYTICS_ACCESS_TOKEN;

    if (!googlePropertyId || !googleAccessToken) {
      return NextResponse.json(
        {
          error: 'Google Analytics not configured',
          message: 'Please set GA4_PROPERTY_ID and GOOGLE_ANALYTICS_ACCESS_TOKEN',
        },
        { status: 503 }
      );
    }

    // Create GA service and fetch realtime users
    const ga = new GoogleAnalyticsService(googlePropertyId, googleAccessToken);
    const activeUsers = await ga.fetchRealtimeUsers();

    return NextResponse.json({ activeUsers });
  } catch (error) {
    console.error('Error in realtime analytics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch realtime data' },
      { status: 500 }
    );
  }
}
