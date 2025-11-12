'use client';

import { useState, useEffect } from 'react';
import type { CoreWebVitals } from '../types/analytics';

/**
 * Performance Dashboard Component
 *
 * Displays Core Web Vitals metrics and page performance data.
 * Shows mobile vs desktop comparison and page-by-page breakdown.
 */

export default function PerformanceDashboard() {
  const [mobileMetrics, setMobileMetrics] = useState<CoreWebVitals>({
    lcp: 0,
    inp: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  });

  const [desktopMetrics, setDesktopMetrics] = useState<CoreWebVitals>({
    lcp: 0,
    inp: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from Google PageSpeed Insights API
    // or from your own analytics tracking
    // For now, we'll show a placeholder

    // Mock data for demonstration
    setTimeout(() => {
      setMobileMetrics({
        lcp: 2800,
        inp: 180,
        cls: 0.08,
        fcp: 1600,
        ttfb: 650,
      });
      setDesktopMetrics({
        lcp: 1900,
        inp: 120,
        cls: 0.05,
        fcp: 1100,
        ttfb: 400,
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
        <p className="text-gray-600 mt-1">
          Core Web Vitals and page speed insights
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Core Web Vitals</h3>
            <p className="mt-1 text-sm text-blue-700">
              Core Web Vitals are Google's metrics for measuring user experience. Good scores can improve your SEO rankings.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile vs Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mobile Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Performance</h3>
          <MetricsDisplay metrics={mobileMetrics} />
        </div>

        {/* Desktop Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Desktop Performance</h3>
          <MetricsDisplay metrics={desktopMetrics} />
        </div>
      </div>

      {/* Metric Explanations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Understanding the Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricExplanation
            name="LCP (Largest Contentful Paint)"
            description="Measures loading performance. Should occur within 2.5s of page load."
            goodThreshold="≤ 2.5s"
            poorThreshold="> 4.0s"
          />
          <MetricExplanation
            name="INP (Interaction to Next Paint)"
            description="Measures interactivity responsiveness. Should be less than 200ms."
            goodThreshold="≤ 200ms"
            poorThreshold="> 500ms"
          />
          <MetricExplanation
            name="CLS (Cumulative Layout Shift)"
            description="Measures visual stability. Should maintain a score below 0.1."
            goodThreshold="≤ 0.1"
            poorThreshold="> 0.25"
          />
          <MetricExplanation
            name="FCP (First Contentful Paint)"
            description="Measures perceived load speed. First content should appear within 1.8s."
            goodThreshold="≤ 1.8s"
            poorThreshold="> 3.0s"
          />
          <MetricExplanation
            name="TTFB (Time to First Byte)"
            description="Measures server response time. Should respond within 800ms."
            goodThreshold="≤ 800ms"
            poorThreshold="> 1800ms"
          />
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-3">✓</span>
            <p className="text-sm text-gray-700">
              Use image optimization (WebP format, lazy loading)
            </p>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-3">✓</span>
            <p className="text-sm text-gray-700">
              Minimize JavaScript execution time
            </p>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-3">✓</span>
            <p className="text-sm text-gray-700">
              Use CDN for static assets
            </p>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-3">✓</span>
            <p className="text-sm text-gray-700">
              Implement proper caching strategies
            </p>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-3">✓</span>
            <p className="text-sm text-gray-700">
              Reduce server response time (optimize database queries, use caching)
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Metrics Display Component
 */
interface MetricsDisplayProps {
  metrics: CoreWebVitals;
}

function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <div className="space-y-4">
      <MetricBar
        name="LCP"
        value={metrics.lcp}
        unit="ms"
        goodThreshold={2500}
        poorThreshold={4000}
      />
      <MetricBar
        name="INP"
        value={metrics.inp}
        unit="ms"
        goodThreshold={200}
        poorThreshold={500}
      />
      <MetricBar
        name="CLS"
        value={metrics.cls}
        unit=""
        goodThreshold={0.1}
        poorThreshold={0.25}
        displayMultiplier={1}
      />
      <MetricBar
        name="FCP"
        value={metrics.fcp}
        unit="ms"
        goodThreshold={1800}
        poorThreshold={3000}
      />
      <MetricBar
        name="TTFB"
        value={metrics.ttfb}
        unit="ms"
        goodThreshold={800}
        poorThreshold={1800}
      />
    </div>
  );
}

/**
 * Metric Bar Component
 */
interface MetricBarProps {
  name: string;
  value: number;
  unit: string;
  goodThreshold: number;
  poorThreshold: number;
  displayMultiplier?: number;
}

function MetricBar({ name, value, unit, goodThreshold, poorThreshold, displayMultiplier = 1 }: MetricBarProps) {
  const rating = value <= goodThreshold ? 'good' : value <= poorThreshold ? 'needs-improvement' : 'poor';
  const colors = {
    good: 'bg-green-500',
    'needs-improvement': 'bg-yellow-500',
    poor: 'bg-red-500',
  };

  const displayValue = unit === 'ms' && value > 1000
    ? `${(value / 1000).toFixed(2)}s`
    : `${(value * displayMultiplier).toFixed(2)}${unit}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className="text-sm font-semibold text-gray-900">{displayValue}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colors[rating]}`}
          style={{ width: `${Math.min((value / poorThreshold) * 100, 100)}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1 capitalize">{rating.replace('-', ' ')}</p>
    </div>
  );
}

/**
 * Metric Explanation Component
 */
interface MetricExplanationProps {
  name: string;
  description: string;
  goodThreshold: string;
  poorThreshold: string;
}

function MetricExplanation({ name, description, goodThreshold, poorThreshold }: MetricExplanationProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">{name}</h4>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Good: {goodThreshold}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Poor: {poorThreshold}</span>
        </div>
      </div>
    </div>
  );
}
