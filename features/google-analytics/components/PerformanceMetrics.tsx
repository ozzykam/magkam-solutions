'use client';

import { useEffect, useState } from 'react';
import type { CoreWebVitals } from '../types/analytics';

/**
 * Performance Metrics Component
 *
 * Tracks and displays Core Web Vitals using the Web Vitals library.
 * Automatically sends metrics to Google Analytics if enabled.
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - INP (Interaction to Next Paint) - Interactivity (replaces FID)
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - FCP (First Contentful Paint) - Perceived load speed
 * - TTFB (Time to First Byte) - Server response time
 */

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<CoreWebVitals>({
    lcp: 0,
    inp: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  });

  useEffect(() => {
    // Dynamically import web-vitals to avoid SSR issues
    if (typeof window === 'undefined') return;

    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      // Track LCP (Largest Contentful Paint)
      onLCP((metric) => {
        setMetrics((prev) => ({ ...prev, lcp: metric.value }));
        sendToAnalytics('LCP', metric.value);
      });

      // Track INP (Interaction to Next Paint)
      onINP((metric) => {
        setMetrics((prev) => ({ ...prev, inp: metric.value }));
        sendToAnalytics('INP', metric.value);
      });

      // Track CLS (Cumulative Layout Shift)
      onCLS((metric) => {
        setMetrics((prev) => ({ ...prev, cls: metric.value }));
        sendToAnalytics('CLS', metric.value);
      });

      // Track FCP (First Contentful Paint)
      onFCP((metric) => {
        setMetrics((prev) => ({ ...prev, fcp: metric.value }));
        sendToAnalytics('FCP', metric.value);
      });

      // Track TTFB (Time to First Byte)
      onTTFB((metric) => {
        setMetrics((prev) => ({ ...prev, ttfb: metric.value }));
        sendToAnalytics('TTFB', metric.value);
      });
    });
  }, []);

  // This component doesn't render anything visible
  // It only tracks metrics and sends them to analytics
  return null;
}

/**
 * Send performance metric to Google Analytics
 */
function sendToAnalytics(metric: string, value: number) {
  if (typeof window === 'undefined' || !window.gtag) return;

  // Send as event to Google Analytics
  window.gtag('event', metric, {
    event_category: 'Web Vitals',
    value: Math.round(metric === 'CLS' ? value * 1000 : value),
    event_label: getMetricRating(metric, value),
    non_interaction: true,
  });
}

/**
 * Get performance rating based on Core Web Vitals thresholds
 */
function getMetricRating(metric: string, value: number): string {
  const thresholds = {
    LCP: { good: 2500, needsImprovement: 4000 },
    INP: { good: 200, needsImprovement: 500 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  };

  const threshold = thresholds[metric as keyof typeof thresholds];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}
