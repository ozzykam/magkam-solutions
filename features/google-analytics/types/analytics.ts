/**
 * Analytics Platform Types
 *
 * Type definitions for:
 * - Google Analytics 4 (GA4)
 * - Google Search Console (GSC)
 * - Microsoft Clarity
 * - Bing Webmaster Tools
 */

// ============================================================================
// Platform Configuration
// ============================================================================

export type AnalyticsPlatform = 'google' | 'bing' | 'both' | 'none';

export interface PlatformConfig {
  google: {
    enabled: boolean;
    measurementId?: string;
    siteVerification?: string;
    trackEcommerce?: boolean;
    anonymizeIp?: boolean;
  };
  bing: {
    enabled: boolean;
    siteVerification?: string;
    clarityId?: string;
    trackHeatmaps?: boolean;
  };
}

// ============================================================================
// Google Analytics 4 (GA4) Types
// ============================================================================

export interface GAConfig {
  measurementId: string;
  trackEcommerce?: boolean;
  anonymizeIp?: boolean;
}

export interface GAPageView {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// E-commerce Events (GA4)
export interface GAEcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

export interface GAViewItem {
  currency: string;
  value: number;
  items: GAEcommerceItem[];
}

export interface GAAddToCart {
  currency: string;
  value: number;
  items: GAEcommerceItem[];
}

export interface GABeginCheckout {
  currency: string;
  value: number;
  items: GAEcommerceItem[];
}

export interface GAPurchase {
  transaction_id: string;
  currency: string;
  value: number;
  tax?: number;
  shipping?: number;
  items: GAEcommerceItem[];
}

// ============================================================================
// Analytics Dashboard Data Types
// ============================================================================

export interface AnalyticsOverview {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  percentage: number;
}

export interface TopPage {
  path: string;
  title: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  views: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number;   // <-- add (0-100 or 0-1; pick and use consistently)
}

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface DatedOverview extends AnalyticsOverview {
  label: string; // e.g. "Last 30 days"
  dateRange: DateRange; // { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
}

export interface AnalyticsPeriodData {
  current: DatedOverview;   // <-- has sessions, users, revenue, etc.
  previous: DatedOverview;
  trafficSources: TrafficSource[];
  topPages: TopPage[];
  topProducts: TopProduct[];
}

// ============================================================================
// Performance Metrics (Core Web Vitals)
// ============================================================================

export interface CoreWebVitals {
  lcp: number;    // Largest Contentful Paint (ms)
  inp: number;    // Interaction to Next Paint (ms)
  cls: number;    // Cumulative Layout Shift (score)
  fcp: number;    // First Contentful Paint (ms)
  ttfb: number;   // Time to First Byte (ms)
}

export interface PagePerformance {
  path: string;
  avgLoadTime: number;
  metrics: CoreWebVitals;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  sampleSize: number;
}

export interface PerformanceOverview {
  overallScore: number; // 0-100
  desktop: PagePerformance[];
  mobile: PagePerformance[];
  improvements: string[];
}

// ============================================================================
// Google Search Console Types
// ============================================================================

export interface GSCQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;        // Click-through rate (0-1)
  position: number;   // Average position (1-100)
}

export interface GSCPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCDevice {
  device: 'mobile' | 'desktop' | 'tablet';
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface IndexingStatus {
  indexed: number;
  notIndexed: number;
  excluded: number;
  crawledPages: number;
  errors: number;
  warnings: number;
}

export interface GSCOverview {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: GSCQuery[];
  topPages: GSCPage[];
  deviceBreakdown: GSCDevice[];
  indexingStatus: IndexingStatus;
}

// ============================================================================
// Bing Webmaster Tools Types
// ============================================================================

export interface BingQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

export interface BingPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

export interface BingOverview {
  totalClicks: number;
  totalImpressions: number;
  averagePosition: number;
  averageCTR: number;
  topQueries: BingQuery[];
  topPages: BingPage[];
  indexedPages: number;
  crawlErrors: number;
}

// ============================================================================
// Microsoft Clarity Types
// ============================================================================

export interface ClaritySession {
  sessionId: string;
  duration: number;
  pages: number;
  device: 'mobile' | 'desktop' | 'tablet';
  hasRecording: boolean;
}

export interface ClarityHeatmap {
  url: string;
  clicks: number;
  scrollDepth: number;
  device: 'mobile' | 'desktop';
}

export interface ClarityInsights {
  totalSessions: number;
  recordings: number;
  avgSessionDuration: number;
  deadClicks: number;        // Clicks that don't do anything
  rageClicks: number;        // Repeated clicks in frustration
  excessiveScrolling: number;
  quickBacks: number;        // Users who leave immediately
  errorClicks: number;      // Clicks on broken elements
  topDeadClickPages: string[];
  topRageClickPages: string[];
  topQuickBackPages: string[];
}

// ============================================================================
// Combined Dashboard Data
// ============================================================================

export interface SearchEngineData {
  google?: GSCOverview;
  bing?: BingOverview;
}

export interface AnalyticsDashboardData {
  analytics: AnalyticsPeriodData;
  performance: PerformanceOverview;
  searchEngines: SearchEngineData;
  clarity?: ClarityInsights;
  activePlatforms: AnalyticsPlatform;
  lastUpdated: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AnalyticsAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// ============================================================================
// Feature Flag Types
// ============================================================================

export type AnalyticsFeatureStatus = 'enabled' | 'disabled' | 'not_configured';

export interface AnalyticsFeatureState {
  status: AnalyticsFeatureStatus;
  activePlatforms: AnalyticsPlatform;
  google: {
    configured: boolean;
    verified: boolean;
    measurementId?: string;
  };
  bing: {
    configured: boolean;
    verified: boolean;
    clarityId?: string;
  };
  lastSync?: Date;
}
