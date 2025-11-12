/**
 * Google Analytics 4 Service
 *
 * Handles data fetching from Google Analytics 4 Data API.
 *
 * Setup required:
 * 1. Enable Google Analytics Data API in Google Cloud Console
 * 2. Create a service account with Analytics Viewer permissions
 * 3. Download service account key JSON
 * 4. Add to environment variables or secure storage
 *
 * @see https://developers.google.com/analytics/devguides/reporting/data/v1
 */

import {
  AnalyticsOverview,
  TrafficSource,
  TopPage,
  TopProduct
} from '../types/analytics';

// Types for GA4 API responses
interface GA4Metric {
  name: string;
  values: string[];
}

interface GA4Dimension {
  name: string;
  values: string[];
}

interface GA4Row {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

interface GA4Response {
  rows?: GA4Row[];
  rowCount?: number;
}

/**
 * Google Analytics 4 Service Class
 */
export class GoogleAnalyticsService {
  private propertyId: string;
  private accessToken?: string;

  constructor(propertyId: string, accessToken?: string) {
    this.propertyId = propertyId;
    this.accessToken = accessToken;
  }

  /**
   * Fetch overview metrics for a date range
   */
  async fetchOverview(
    startDate: string = '30daysAgo',
    endDate: string = 'today'
  ): Promise<AnalyticsOverview> {
    try {
      const response = await this.runReport({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
        ],
      });

      if (!response.rows || response.rows.length === 0) {
        return this.getEmptyOverview();
      }

      const metrics = response.rows[0].metricValues;

      return {
        sessions: parseInt(metrics[0].value) || 0,
        users: parseInt(metrics[1].value) || 0,
        pageviews: parseInt(metrics[2].value) || 0,
        avgSessionDuration: parseFloat(metrics[3].value) || 0,
        bounceRate: parseFloat(metrics[4].value) || 0,
        conversions: parseInt(metrics[5].value) || 0,
        revenue: parseFloat(metrics[6].value) || 0,
        conversionRate: this.calculateConversionRate(
          parseInt(metrics[5].value),
          parseInt(metrics[0].value)
        ),
      };
    } catch (error) {
      console.error('Error fetching GA4 overview:', error);
      return this.getEmptyOverview();
    }
  }

  /**
   * Fetch top traffic sources
   */
  async fetchTrafficSources(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10
  ): Promise<TrafficSource[]> {
    try {
      const response = await this.runReport({
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
        ],
        orderBys: [
          { metric: { metricName: 'sessions' }, desc: true },
        ],
        limit,
      });

      if (!response.rows) return [];

      // Calculate total sessions for percentage calculation
      const totalSessions = response.rows.reduce(
        (sum, row) => sum + (parseInt(row.metricValues[0].value) || 0),
        0
      );

      return response.rows.map(row => {
        const sessions = parseInt(row.metricValues[0].value) || 0;
        return {
          source: row.dimensionValues[0].value,
          medium: row.dimensionValues[1].value,
          sessions,
          users: parseInt(row.metricValues[1].value) || 0,
          percentage: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
        };
      });
    } catch (error) {
      console.error('Error fetching traffic sources:', error);
      return [];
    }
  }

  /**
   * Fetch top pages
   */
  async fetchTopPages(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10
  ): Promise<TopPage[]> {
    try {
      const response = await this.runReport({
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'pageTitle' },
          { name: 'pagePath' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [
          { metric: { metricName: 'screenPageViews' }, desc: true },
        ],
        limit,
      });

      if (!response.rows) return [];

      return response.rows.map(row => ({
        path: row.dimensionValues[1].value,
        title: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value) || 0,
        uniqueVisitors: parseInt(row.metricValues[1].value) || 0,
        avgTimeOnPage: parseFloat(row.metricValues[2].value) || 0,
        bounceRate: parseFloat(row.metricValues[3].value) || 0,
      }));
    } catch (error) {
      console.error('Error fetching top pages:', error);
      return [];
    }
  }

  /**
   * Fetch top products (requires enhanced ecommerce)
   */
  async fetchTopProducts(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10
  ): Promise<TopProduct[]> {
    try {
      const response = await this.runReport({
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'itemId' },
          { name: 'itemName' },
        ],
        metrics: [
          { name: 'itemsViewed' },
          { name: 'itemsAddedToCart' },
          { name: 'itemsPurchased' },
          { name: 'itemRevenue' },
        ],
        orderBys: [
          { metric: { metricName: 'itemRevenue' }, desc: true },
        ],
        limit,
      });

      if (!response.rows) return [];

      return response.rows.map(row => ({
        productId: row.dimensionValues[0].value,
        productName: row.dimensionValues[1].value,
        views: parseInt(row.metricValues[0].value) || 0,
        addToCart: parseInt(row.metricValues[1].value) || 0,
        purchases: parseInt(row.metricValues[2].value) || 0,
        revenue: parseFloat(row.metricValues[3].value) || 0,
        conversionRate: this.calculateConversionRate(
          parseInt(row.metricValues[2].value),
          parseInt(row.metricValues[0].value)
        ),
      }));
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  /**
   * Fetch real-time active users (last 30 minutes)
   */
  async fetchRealtimeUsers(): Promise<number> {
    try {
      const response = await this.runRealtimeReport({
        metrics: [{ name: 'activeUsers' }],
      });

      if (!response.rows || response.rows.length === 0) return 0;

      return parseInt(response.rows[0].metricValues[0].value) || 0;
    } catch (error) {
      console.error('Error fetching realtime users:', error);
      return 0;
    }
  }

  /**
   * Run a report query against GA4 Data API
   */
  private async runReport(request: any): Promise<GA4Response> {
    if (!this.accessToken) {
      throw new Error('GA4 access token not configured');
    }

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Run a realtime report query
   */
  private async runRealtimeReport(request: any): Promise<GA4Response> {
    if (!this.accessToken) {
      throw new Error('GA4 access token not configured');
    }

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`GA4 Realtime API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Calculate conversion rate
   */
  private calculateConversionRate(conversions: number, total: number): number {
    if (total === 0) return 0;
    return (conversions / total) * 100;
  }

  /**
   * Get empty overview object
   */
  private getEmptyOverview(): AnalyticsOverview {
    return {
      sessions: 0,
      users: 0,
      pageviews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      conversions: 0,
      revenue: 0,
      conversionRate: 0,
    };
  }
}

/**
 * Factory function to create GA4 service instance
 */
export async function createGA4Service(measurementId: string): Promise<GoogleAnalyticsService> {
  // In a real implementation, you would:
  // 1. Extract property ID from measurement ID or store separately
  // 2. Get access token from service account or OAuth
  // 3. Handle token refresh

  // For now, we'll throw an error indicating setup is required
  throw new Error(
    'GA4 Service requires backend setup. Please configure:\n' +
    '1. Google Cloud project with Analytics Data API enabled\n' +
    '2. Service account with Analytics Viewer permissions\n' +
    '3. Environment variable GA4_PROPERTY_ID and service account credentials'
  );
}
