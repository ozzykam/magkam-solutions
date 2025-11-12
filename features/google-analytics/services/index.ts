/**
 * Analytics Services Aggregator
 *
 * Combines data from all analytics platforms into unified responses.
 */

import { GoogleAnalyticsService } from './analytics-service';
import { SearchConsoleService } from './search-console-service';
import { BingWebmasterService } from './bing-service';
import { ClarityService } from './clarity-service';
import {
  AnalyticsDashboardData,
  AnalyticsPlatform,
  SearchEngineData,
} from '../types/analytics';

/**
 * Analytics Aggregator Configuration
 */
interface AnalyticsConfig {
  platform: AnalyticsPlatform;
  google?: {
    propertyId: string;
    accessToken: string;
  };
  searchConsole?: {
    siteUrl: string;
    accessToken: string;
  };
  bing?: {
    siteUrl: string;
    apiKey: string;
  };
  clarity?: {
    projectId: string;
  };
}

/**
 * Analytics Aggregator Service
 *
 * Fetches and combines data from all enabled platforms
 */
export class AnalyticsAggregator {
  private config: AnalyticsConfig;
  private ga?: GoogleAnalyticsService;
  private gsc?: SearchConsoleService;
  private bing?: BingWebmasterService;
  private clarity?: ClarityService;

  constructor(config: AnalyticsConfig) {
    this.config = config;

    // Initialize services based on platform
    if (config.platform === 'google' || config.platform === 'both') {
      if (config.google) {
        this.ga = new GoogleAnalyticsService(
          config.google.propertyId,
          config.google.accessToken
        );
      }
      if (config.searchConsole) {
        this.gsc = new SearchConsoleService(
          config.searchConsole.siteUrl,
          config.searchConsole.accessToken
        );
      }
    }

    if (config.platform === 'bing' || config.platform === 'both') {
      if (config.bing) {
        this.bing = new BingWebmasterService(
          config.bing.siteUrl,
          config.bing.apiKey
        );
      }
      if (config.clarity) {
        this.clarity = new ClarityService(config.clarity.projectId);
      }
    }
  }

  /**
   * Fetch complete dashboard data
   */
  async fetchDashboardData(
    startDate: string = '30daysAgo',
    endDate: string = 'today'
  ): Promise<AnalyticsDashboardData> {
    try {
      // Fetch all data in parallel
      const [analyticsData, searchData, clarityData] = await Promise.all([
        this.fetchAnalyticsData(startDate, endDate),
        this.fetchSearchEngineData(startDate, endDate),
        this.fetchClarityData(),
      ]);

      return {
        analytics: {
          current: analyticsData.current,
          previous: analyticsData.previous,
          trafficSources: analyticsData.trafficSources,
          topPages: analyticsData.topPages,
          topProducts: analyticsData.topProducts,
        },
        performance: {
          overallScore: 0, // Would come from Lighthouse or similar
          mobile: [], // PagePerformance[] - Would come from Lighthouse or similar
          desktop: [], // PagePerformance[] - Would come from Lighthouse or similar
          improvements: [], // Performance improvement suggestions
        },
        searchEngines: searchData,
        clarity: clarityData,
        activePlatforms: this.config.platform,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Fetch analytics data (GA4)
   */
  private async fetchAnalyticsData(startDate: string, endDate: string) {
    if (!this.ga) {
      return {
        current: this.getEmptyOverview(startDate, endDate, 'Current Period'),
        previous: this.getEmptyOverview(startDate, endDate, 'Previous Period'),
        trafficSources: [],
        topPages: [],
        topProducts: [],
      };
    }

    try {
      // Calculate previous period dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - daysDiff);
      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = new Date(start.getTime() - 1).toISOString().split('T')[0];

      const [currentData, previousData, trafficSources, topPages, topProducts] = await Promise.all([
        this.ga.fetchOverview(startDate, endDate),
        this.ga.fetchOverview(prevStartStr, prevEndStr),
        this.ga.fetchTrafficSources(startDate, endDate),
        this.ga.fetchTopPages(startDate, endDate),
        this.ga.fetchTopProducts(startDate, endDate),
      ]);

      // Convert AnalyticsOverview to DatedOverview
      const current = {
        ...currentData,
        label: `${startDate} to ${endDate}`,
        dateRange: { startDate, endDate },
      };

      const previous = {
        ...previousData,
        label: `${prevStartStr} to ${prevEndStr}`,
        dateRange: { startDate: prevStartStr, endDate: prevEndStr },
      };

      return {
        current,
        previous,
        trafficSources,
        topPages,
        topProducts,
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return {
        current: this.getEmptyOverview(startDate, endDate, 'Current Period'),
        previous: this.getEmptyOverview(startDate, endDate, 'Previous Period'),
        trafficSources: [],
        topPages: [],
        topProducts: [],
      };
    }
  }

  /**
   * Fetch search engine data (Google + Bing)
   */
  private async fetchSearchEngineData(
    startDate: string,
    endDate: string
  ): Promise<SearchEngineData> {
    const data: SearchEngineData = {};

    try {
      // Fetch Google Search Console data
      if (this.gsc) {
        const gscData = await this.gsc.fetchOverview(startDate, endDate);
        data.google = gscData;
      }

      // Fetch Bing Webmaster data
      if (this.bing) {
        const bingData = await this.bing.fetchOverview();
        data.bing = bingData;
      }

      return data;
    } catch (error) {
      console.error('Error fetching search engine data:', error);
      return data;
    }
  }

  /**
   * Fetch Clarity insights
   */
  private async fetchClarityData() {
    if (!this.clarity) {
      return undefined;
    }

    try {
      return await this.clarity.fetchInsights();
    } catch (error) {
      console.error('Error fetching Clarity data:', error);
      return undefined;
    }
  }

  /**
   * Get realtime active users (GA4 only)
   */
  async getRealtimeUsers(): Promise<number> {
    if (!this.ga) return 0;

    try {
      return await this.ga.fetchRealtimeUsers();
    } catch (error) {
      console.error('Error fetching realtime users:', error);
      return 0;
    }
  }

  /**
   * Get empty overview
   */
  private getEmptyOverview(startDate: string, endDate: string, label: string) {
    return {
      sessions: 0,
      users: 0,
      pageviews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      conversions: 0,
      revenue: 0,
      conversionRate: 0,
      label,
      dateRange: { startDate, endDate },
    };
  }
}

// Re-export services for direct use
export { GoogleAnalyticsService } from './analytics-service';
export { SearchConsoleService } from './search-console-service';
export { BingWebmasterService } from './bing-service';
export { ClarityService, getClaritySetupInstructions } from './clarity-service';
