/**
 * Google Search Console Service
 *
 * Handles data fetching from Google Search Console API.
 *
 * Setup required:
 * 1. Verify site ownership in Google Search Console
 * 2. Enable Search Console API in Google Cloud Console
 * 3. Create service account or OAuth credentials
 * 4. Grant service account access to Search Console property
 *
 * @see https://developers.google.com/webmaster-tools/v1
 */

import { GSCQuery, GSCOverview } from '../types/analytics';

/**
 * Types for Search Console API
 */
interface GSCApiRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCApiResponse {
  rows?: GSCApiRow[];
  responseAggregationType?: string;
}

interface GSCIndexStatusResponse {
  coverageState: string;
  lastCrawlTime?: string;
  pageFetchState?: string;
  googleCanonical?: string;
}

/**
 * Google Search Console Service Class
 */
export class SearchConsoleService {
  private siteUrl: string;
  private accessToken?: string;

  constructor(siteUrl: string, accessToken?: string) {
    this.siteUrl = siteUrl;
    this.accessToken = accessToken;
  }

  /**
   * Fetch overview metrics
   */
  async fetchOverview(
    startDate: string,
    endDate: string
  ): Promise<GSCOverview> {
    try {
      // Fetch total metrics rows
      const totalMetricsRows = await this.searchAnalytics({
        startDate,
        endDate,
        dimensions: [],
      });

      // Aggregate total metrics from rows
      const totalMetrics = this.aggregateMetrics(totalMetricsRows);

      // Fetch top queries
      const topQueries = await this.fetchTopQueries(startDate, endDate, 5);

      // Fetch top pages
      const topPages = await this.searchAnalytics({
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 5,
      });

      // Fetch device breakdown
      const deviceData = await this.fetchDevicePerformance(startDate, endDate);

      // Get indexing status (requires separate API call)
      const indexingStatus = await this.getIndexingStatus();

      return {
        totalClicks: totalMetrics.clicks,
        totalImpressions: totalMetrics.impressions,
        averageCTR: totalMetrics.ctr,
        averagePosition: totalMetrics.position,
        topQueries,
        topPages: topPages.map(row => ({
          page: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })),
        deviceBreakdown: deviceData.map(device => ({
          device: device.device as 'mobile' | 'desktop' | 'tablet',
          clicks: device.clicks,
          impressions: device.impressions,
          ctr: device.ctr,
          position: device.position,
        })),
        indexingStatus: {
          indexed: indexingStatus.indexedPages || 0,
          notIndexed: (indexingStatus.crawledPages || 0) - (indexingStatus.indexedPages || 0),
          excluded: indexingStatus.excludedPages || 0,
          crawledPages: indexingStatus.crawledPages || 0,
          errors: indexingStatus.errors || 0,
          warnings: 0,
        },
      };
    } catch (error) {
      console.error('Error fetching GSC overview:', error);
      return this.getEmptyOverview();
    }
  }

  /**
   * Fetch top search queries
   */
  async fetchTopQueries(
    startDate: string,
    endDate: string,
    limit: number = 20
  ): Promise<GSCQuery[]> {
    try {
      const rows = await this.searchAnalytics({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
      });

      return rows.map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (error) {
      console.error('Error fetching top queries:', error);
      return [];
    }
  }

  /**
   * Fetch queries by page
   */
  async fetchQueriesByPage(
    page: string,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<GSCQuery[]> {
    try {
      const rows = await this.searchAnalytics({
        startDate,
        endDate,
        dimensions: ['query'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'equals',
            expression: page,
          }],
        }],
        rowLimit: limit,
      });

      return rows.map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (error) {
      console.error('Error fetching queries by page:', error);
      return [];
    }
  }

  /**
   * Fetch performance by device type
   */
  async fetchDevicePerformance(
    startDate: string,
    endDate: string
  ): Promise<Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>> {
    try {
      const rows = await this.searchAnalytics({
        startDate,
        endDate,
        dimensions: ['device'],
      });

      return rows.map(row => ({
        device: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (error) {
      console.error('Error fetching device performance:', error);
      return [];
    }
  }

  /**
   * Fetch performance by country
   */
  async fetchCountryPerformance(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<Array<{ country: string; clicks: number; impressions: number; ctr: number; position: number }>> {
    try {
      const rows = await this.searchAnalytics({
        startDate,
        endDate,
        dimensions: ['country'],
        rowLimit: limit,
      });

      return rows.map(row => ({
        country: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (error) {
      console.error('Error fetching country performance:', error);
      return [];
    }
  }

  /**
   * Get indexing status for the site
   */
  private async getIndexingStatus(): Promise<{
    indexedPages?: number;
    crawledPages?: number;
    excludedPages?: number;
    errors?: number;
  }> {
    if (!this.accessToken) {
      return {};
    }

    try {
      // This would require the URL Inspection API
      // For now, return mock data or implement separately
      return {
        indexedPages: 0,
        crawledPages: 0,
        excludedPages: 0,
        errors: 0,
      };
    } catch (error) {
      console.error('Error fetching indexing status:', error);
      return {};
    }
  }

  /**
   * Query Search Analytics API
   */
  private async searchAnalytics(request: {
    startDate: string;
    endDate: string;
    dimensions?: string[];
    dimensionFilterGroups?: any[];
    rowLimit?: number;
  }): Promise<GSCApiRow[]> {
    if (!this.accessToken) {
      throw new Error('Search Console access token not configured');
    }

    const response = await fetch(
      `https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: this.siteUrl,
          ...request,
          aggregationType: 'auto',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
    }

    const data: GSCApiResponse = await response.json();

    return data.rows || [];
  }

  /**
   * Calculate aggregate metrics from rows
   */
  private aggregateMetrics(rows: GSCApiRow[]): {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  } {
    if (rows.length === 0) {
      return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }

    const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
    const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = rows.reduce((sum, row) => sum + row.position, 0) / rows.length;

    return {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: avgCtr,
      position: avgPosition,
    };
  }

  /**
   * Get empty overview object
   */
  private getEmptyOverview(): GSCOverview {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCTR: 0,
      averagePosition: 0,
      topQueries: [],
      topPages: [],
      deviceBreakdown: [],
      indexingStatus: {
        indexed: 0,
        notIndexed: 0,
        excluded: 0,
        crawledPages: 0,
        errors: 0,
        warnings: 0,
      },
    };
  }
}

/**
 * Factory function to create Search Console service
 */
export async function createSearchConsoleService(siteUrl: string): Promise<SearchConsoleService> {
  // In a real implementation, you would:
  // 1. Get access token from service account or OAuth
  // 2. Handle token refresh
  // 3. Verify site ownership

  throw new Error(
    'Search Console Service requires backend setup. Please configure:\n' +
    '1. Verify site ownership in Google Search Console\n' +
    '2. Enable Search Console API in Google Cloud Console\n' +
    '3. Create service account with Search Console access\n' +
    '4. Add service account to Search Console property'
  );
}
