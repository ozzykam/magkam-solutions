/**
 * Bing Webmaster Tools Service
 *
 * Handles data fetching from Bing Webmaster Tools API.
 *
 * Setup required:
 * 1. Verify site ownership in Bing Webmaster Tools
 * 2. Get API key from Bing Webmaster Tools settings
 * 3. Store API key securely in environment variables
 *
 * @see https://docs.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api
 */

import { BingQuery, BingOverview } from '../types/analytics';

/**
 * Types for Bing Webmaster API
 */
interface BingApiKeywordStats {
  Query: string;
  Impressions: number;
  Clicks: number;
  AvgClickPosition: number;
}

interface BingApiUrlStats {
  Url: string;
  Impressions: number;
  Clicks: number;
}

interface BingApiCrawlStats {
  CrawledPages: number;
  InIndex: number;
  Blocked: number;
  CrawlErrors: number;
}

/**
 * Bing Webmaster Tools Service Class
 */
export class BingWebmasterService {
  private siteUrl: string;
  private apiKey?: string;

  constructor(siteUrl: string, apiKey?: string) {
    this.siteUrl = siteUrl;
    this.apiKey = apiKey;
  }

  /**
   * Fetch overview metrics
   */
  async fetchOverview(): Promise<BingOverview> {
    try {
      // Fetch traffic stats (last 30 days)
      const trafficStats = await this.getTrafficStats();

      // Fetch top queries
      const topQueries = await this.fetchTopQueries(10);

      // Fetch crawl stats
      const crawlStats = await this.getCrawlStats();

      // Fetch top pages
      const topPages = await this.getTopPages(5);

      return {
        totalClicks: trafficStats.clicks,
        totalImpressions: trafficStats.impressions,
        averageCTR: trafficStats.ctr,
        averagePosition: trafficStats.avgPosition,
        topQueries,
        topPages: topPages.map(page => ({
          url: page.Url,
          clicks: page.Clicks,
          impressions: page.Impressions,
          ctr: page.Impressions > 0 ? (page.Clicks / page.Impressions) * 100 : 0,
          page: page.Url,
        })),
        indexedPages: crawlStats.InIndex,
        crawlErrors: crawlStats.CrawlErrors,
      };
    } catch (error) {
      console.error('Error fetching Bing overview:', error);
      return this.getEmptyOverview();
    }
  }

  /**
   * Fetch top search queries
   */
  async fetchTopQueries(limit: number = 20): Promise<BingQuery[]> {
    try {
      const queries = await this.getKeywordStats();

      return queries
        .slice(0, limit)
        .map(query => ({
          query: query.Query,
          clicks: query.Clicks,
          impressions: query.Impressions,
          ctr: query.Impressions > 0 ? (query.Clicks / query.Impressions) * 100 : 0,
          avgPosition: query.AvgClickPosition,
        }));
    } catch (error) {
      console.error('Error fetching Bing queries:', error);
      return [];
    }
  }

  /**
   * Fetch queries by page
   */
  async fetchQueriesByPage(
    page: string,
    limit: number = 10
  ): Promise<BingQuery[]> {
    try {
      // Bing API doesn't support filtering by page in the same way
      // This would require custom implementation
      const allQueries = await this.getKeywordStats();

      // Filter and return
      return allQueries
        .slice(0, limit)
        .map(query => ({
          query: query.Query,
          clicks: query.Clicks,
          impressions: query.Impressions,
          ctr: query.Impressions > 0 ? (query.Clicks / query.Impressions) * 100 : 0,
          avgPosition: query.AvgClickPosition,
        }));
    } catch (error) {
      console.error('Error fetching queries by page:', error);
      return [];
    }
  }

  /**
   * Get crawl statistics
   */
  async getCrawlStats(): Promise<BingApiCrawlStats> {
    if (!this.apiKey) {
      throw new Error('Bing API key not configured');
    }

    try {
      const response = await fetch(
        `https://ssl.bing.com/webmaster/api.svc/json/GetCrawlStats?siteUrl=${encodeURIComponent(this.siteUrl)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.d || {
        CrawledPages: 0,
        InIndex: 0,
        Blocked: 0,
        CrawlErrors: 0,
      };
    } catch (error) {
      console.error('Error fetching Bing crawl stats:', error);
      return {
        CrawledPages: 0,
        InIndex: 0,
        Blocked: 0,
        CrawlErrors: 0,
      };
    }
  }

  /**
   * Get keyword statistics
   */
  private async getKeywordStats(): Promise<BingApiKeywordStats[]> {
    if (!this.apiKey) {
      throw new Error('Bing API key not configured');
    }

    try {
      const response = await fetch(
        `https://ssl.bing.com/webmaster/api.svc/json/GetKeywordStats?siteUrl=${encodeURIComponent(this.siteUrl)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.d || [];
    } catch (error) {
      console.error('Error fetching Bing keyword stats:', error);
      return [];
    }
  }

  /**
   * Get top pages
   */
  private async getTopPages(limit: number = 10): Promise<BingApiUrlStats[]> {
    if (!this.apiKey) {
      throw new Error('Bing API key not configured');
    }

    try {
      const response = await fetch(
        `https://ssl.bing.com/webmaster/api.svc/json/GetPageStats?siteUrl=${encodeURIComponent(this.siteUrl)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const pages = data.d || [];
      return pages.slice(0, limit);
    } catch (error) {
      console.error('Error fetching Bing top pages:', error);
      return [];
    }
  }

  /**
   * Get traffic statistics
   */
  private async getTrafficStats(): Promise<{
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
  }> {
    try {
      const queries = await this.getKeywordStats();

      const totalClicks = queries.reduce((sum, q) => sum + q.Clicks, 0);
      const totalImpressions = queries.reduce((sum, q) => sum + q.Impressions, 0);
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgPosition = queries.length > 0
        ? queries.reduce((sum, q) => sum + q.AvgClickPosition, 0) / queries.length
        : 0;

      return {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: avgCtr,
        avgPosition,
      };
    } catch (error) {
      console.error('Error calculating traffic stats:', error);
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        avgPosition: 0,
      };
    }
  }

  /**
   * Get empty overview object
   */
  private getEmptyOverview(): BingOverview {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCTR: 0,
      averagePosition: 0,
      topQueries: [],
      topPages: [],
      indexedPages: 0,
      crawlErrors: 0,
    };
  }
}

/**
 * Factory function to create Bing service
 */
export async function createBingService(siteUrl: string): Promise<BingWebmasterService> {
  // In a real implementation, you would:
  // 1. Get API key from environment variables or secure storage
  // 2. Verify site is added to Bing Webmaster Tools
  // 3. Handle API rate limits

  throw new Error(
    'Bing Webmaster Service requires setup. Please configure:\n' +
    '1. Add and verify your site in Bing Webmaster Tools\n' +
    '2. Get API key from Settings → API Access\n' +
    '3. Add BING_WEBMASTER_API_KEY to environment variables'
  );
}
