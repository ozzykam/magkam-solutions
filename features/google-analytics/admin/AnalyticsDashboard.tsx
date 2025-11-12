'use client';

import { useState, useEffect } from 'react';
import { useAnalyticsFeature } from '@/lib/hooks/useSettings';
import Button from '@/components/ui/Button';
import type { AnalyticsDashboardData } from '../types/analytics';

/**
 * Analytics Dashboard Component
 *
 * Displays comprehensive analytics data from all enabled platforms:
 * - Google Analytics 4 (traffic, conversions, e-commerce)
 * - Google Search Console (search performance)
 * - Bing Webmaster Tools (Bing search)
 * - Microsoft Clarity (UX insights)
 */

interface SetupCheckResponse {
  analyticsEnabled: boolean;
  platforms: Array<{
    platform: string;
    enabled: boolean;
    configured: boolean;
    missingConfig?: string[];
    ready: boolean;
  }>;
  overallReady: boolean;
}

export default function AnalyticsDashboard() {
  const { isEnabled, googleEnabled, bingEnabled, loading: settingsLoading } = useAnalyticsFeature();

  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '30daysAgo',
    endDate: 'today',
  });

  // Fetch setup status
  useEffect(() => {
    if (!isEnabled) return;

    const fetchSetupStatus = async () => {
      try {
        const response = await fetch('/api/analytics/setup-check');
        if (!response.ok) {
          throw new Error('Failed to fetch setup status');
        }
        const data = await response.json();
        setSetupStatus(data);
      } catch (err) {
        console.error('Error fetching setup status:', err);
      }
    };

    fetchSetupStatus();
  }, [isEnabled]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isEnabled || settingsLoading) return;
    if (setupStatus && !setupStatus.overallReady) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        const response = await fetch(`/api/analytics/dashboard?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch analytics data');
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isEnabled, settingsLoading, dateRange, setupStatus]);

  if (settingsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Not Enabled</h3>
          <p className="text-gray-600 mb-6">
            Enable analytics in the Analytics Settings to view your store's performance metrics.
          </p>
          <Button onClick={() => window.location.href = '/admin/settings/analytics'}>
            Go to Analytics Settings
          </Button>
        </div>
      </div>
    );
  }

  // Show setup instructions if not configured
  if (setupStatus && !setupStatus.overallReady) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Analytics platforms are enabled but require additional configuration to start collecting data.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>

        <div className="space-y-4">
          {setupStatus.platforms.map((platform) => (
            <div
              key={platform.platform}
              className={`border rounded-lg p-4 ${
                platform.ready ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-semibold ${platform.ready ? 'text-green-900' : 'text-red-900'}`}>
                    {platform.platform}
                  </h4>
                  {platform.ready ? (
                    <p className="text-sm text-green-700 mt-1">Configured and ready</p>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-red-700 font-medium">Missing configuration:</p>
                      <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                        {platform.missingConfig?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  {platform.ready ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Not Ready
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Need Help?</h4>
          <p className="text-sm text-blue-700 mb-3">
            Add the required environment variables to your <code className="bg-blue-100 px-1 rounded">.env.local</code> file.
            Check the feature documentation for detailed setup instructions.
          </p>
          <Button
            onClick={() => window.location.href = '/admin/settings/analytics'}
            variant="secondary"
            size="sm"
          >
            Update Settings
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm"
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { analytics, searchEngines } = dashboardData;
  const currentPeriod = analytics.current;
  const previousPeriod = analytics.previous;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const sessionsChange = calculateChange(currentPeriod.sessions, previousPeriod.sessions);
  const revenueChange = calculateChange(currentPeriod.revenue, previousPeriod.revenue);
  const conversionChange = calculateChange(currentPeriod.conversions, previousPeriod.conversions);
  const usersChange = calculateChange(currentPeriod.users, previousPeriod.users);

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Track your store's performance across all platforms
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange.startDate === '7daysAgo' ? '7' : dateRange.startDate === '30daysAgo' ? '30' : '90'}
              onChange={(e) => {
                const days = e.target.value;
                setDateRange({
                  startDate: `${days}daysAgo`,
                  endDate: 'today',
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Sessions"
          value={currentPeriod.sessions.toLocaleString()}
          change={sessionsChange}
          icon="👥"
        />
        <StatCard
          title="Revenue"
          value={`$${currentPeriod.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={revenueChange}
          icon="💰"
        />
        <StatCard
          title="Conversions"
          value={currentPeriod.conversions.toLocaleString()}
          change={conversionChange}
          icon="🎯"
        />
        <StatCard
          title="Users"
          value={currentPeriod.users.toLocaleString()}
          change={usersChange}
          icon="👤"
        />
      </div>

      {/* Traffic Sources */}
      {analytics.trafficSources.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {analytics.trafficSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{source.source}</p>
                  <p className="text-sm text-gray-600">{source.users.toLocaleString()} users</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{source.sessions.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">sessions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Pages */}
      {analytics.topPages.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topPages.map((page, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{page.title || page.path}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{page.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{page.uniqueVisitors.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products */}
      {analytics.topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Purchases</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topProducts.map((product, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{product.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{product.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{product.purchases.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">${product.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{product.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search Engine Performance */}
      {(searchEngines.google || searchEngines.bing) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Google Search Console */}
          {searchEngines.google && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Google Search Performance</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Clicks</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.google.totalClicks.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Impressions</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.google.totalImpressions.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Avg. CTR</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.google.averageCTR.toFixed(2)}%</p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Avg. Position</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.google.averagePosition.toFixed(1)}</p>
                </div>
              </div>
              {searchEngines.google.topQueries.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Queries</h4>
                  <div className="space-y-2">
                    {searchEngines.google.topQueries.slice(0, 5).map((query, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-900">{query.query}</span>
                        <span className="text-gray-600">{query.clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bing Webmaster */}
          {searchEngines.bing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bing Search Performance</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-orange-50 rounded">
                  <p className="text-sm text-gray-600">Clicks</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.bing.totalClicks.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <p className="text-sm text-gray-600">Impressions</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.bing.totalImpressions.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <p className="text-sm text-gray-600">Indexed Pages</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.bing.indexedPages.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <p className="text-sm text-gray-600">Crawl Errors</p>
                  <p className="text-xl font-bold text-gray-900">{searchEngines.bing.crawlErrors.toLocaleString()}</p>
                </div>
              </div>
              {searchEngines.bing.topQueries.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Queries</h4>
                  <div className="space-y-2">
                    {searchEngines.bing.topQueries.slice(0, 5).map((query, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-900">{query.query}</span>
                        <span className="text-gray-600">{query.clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change: { value: number; isPositive: boolean };
  icon: string;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <div className="flex items-center">
        <span className={`text-sm font-medium ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change.isPositive ? '↑' : '↓'} {change.value.toFixed(1)}%
        </span>
        <span className="text-sm text-gray-500 ml-2">vs previous period</span>
      </div>
    </div>
  );
}
