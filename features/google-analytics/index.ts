/**
 * Google Analytics Feature Module
 *
 * Self-contained analytics feature with Google Analytics 4,
 * Microsoft Clarity, and SEO tracking.
 *
 * To enable: Set features.analytics.enabled = true in store settings
 * To remove: Delete this entire folder and remove imports
 */

// Components
export { default as GoogleAnalyticsScript } from './components/GoogleAnalyticsScript';
export { default as MicrosoftClarityScript } from './components/MicrosoftClarityScript';
export { default as VerificationMetaTags } from './components/VerificationMetaTags';
export { default as PageViewTracker } from './components/PageViewTracker';
export { default as PerformanceMetrics } from './components/PerformanceMetrics';

// Admin Components
export { default as AnalyticsSettings } from './admin/AnalyticsSettings';
export { default as AnalyticsDashboard } from './admin/AnalyticsDashboard';
export { default as PerformanceDashboard } from './admin/PerformanceDashboard';

// Hooks
export { useAnalytics, usePageViewTracking } from './hooks/useAnalytics';

// Types
export type {
  AnalyticsPlatform,
  PlatformConfig,
  GAEvent,
  GAPageView,
  GAEcommerceItem,
  GAViewItem,
  GAAddToCart,
  GABeginCheckout,
  GAPurchase,
  AnalyticsOverview,
  TrafficSource,
  TopPage,
  TopProduct,
  AnalyticsDashboardData,
  CoreWebVitals,
  PagePerformance,
  PerformanceOverview,
  GSCOverview,
  BingOverview,
  ClarityInsights,
} from './types/analytics';
