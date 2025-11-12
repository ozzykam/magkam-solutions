'use client';

import { useCallback } from 'react';
import { useAnalyticsFeature } from '@/lib/hooks/useSettings';
import {
  GAViewItem,
  GAAddToCart,
  GABeginCheckout,
  GAPurchase,
  GAEcommerceItem,
  GAEvent,
  GAPageView,
} from '../types/analytics';

/**
 * Analytics Event Tracking Hook
 *
 * Provides functions to track events across Google Analytics and other platforms.
 * Automatically respects feature flags and platform settings.
 */

export function useAnalytics() {
  const { googleEnabled, bingEnabled, config } = useAnalyticsFeature();

  const trackEcommerce = config?.google?.trackEcommerce ?? true;

  /**
   * Track a page view
   */
  const trackPageView = useCallback((pageData: GAPageView) => {
    if (!googleEnabled || typeof window === 'undefined') return;

    window.gtag?.('event', 'page_view', pageData);
  }, [googleEnabled]);

  /**
   * Track a custom event
   */
  const trackEvent = useCallback((event: GAEvent) => {
    if (!googleEnabled || typeof window === 'undefined') return;

    window.gtag?.('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }, [googleEnabled]);

  /**
   * Track product view (e-commerce)
   */
  const trackViewItem = useCallback((data: GAViewItem) => {
    if (!googleEnabled || !trackEcommerce || typeof window === 'undefined') return;

    window.gtag?.('event', 'view_item', {
      currency: data.currency,
      value: data.value,
      items: data.items,
    });
  }, [googleEnabled, trackEcommerce]);

  /**
   * Track add to cart (e-commerce)
   */
  const trackAddToCart = useCallback((data: GAAddToCart) => {
    if (!googleEnabled || !trackEcommerce || typeof window === 'undefined') return;

    window.gtag?.('event', 'add_to_cart', {
      currency: data.currency,
      value: data.value,
      items: data.items,
    });
  }, [googleEnabled, trackEcommerce]);

  /**
   * Track begin checkout (e-commerce)
   */
  const trackBeginCheckout = useCallback((data: GABeginCheckout) => {
    if (!googleEnabled || !trackEcommerce || typeof window === 'undefined') return;

    window.gtag?.('event', 'begin_checkout', {
      currency: data.currency,
      value: data.value,
      items: data.items,
    });
  }, [googleEnabled, trackEcommerce]);

  /**
   * Track purchase (e-commerce)
   */
  const trackPurchase = useCallback((data: GAPurchase) => {
    if (!googleEnabled || !trackEcommerce || typeof window === 'undefined') return;

    window.gtag?.('event', 'purchase', {
      transaction_id: data.transaction_id,
      currency: data.currency,
      value: data.value,
      tax: data.tax,
      shipping: data.shipping,
      items: data.items,
    });
  }, [googleEnabled, trackEcommerce]);

  /**
   * Track search query
   */
  const trackSearch = useCallback((searchTerm: string) => {
    if (!googleEnabled || typeof window === 'undefined') return;

    window.gtag?.('event', 'search', {
      search_term: searchTerm,
    });
  }, [googleEnabled]);

  return {
    trackPageView,
    trackEvent,
    trackViewItem,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    trackSearch,
    isEnabled: googleEnabled,
  };
}

/**
 * Hook for auto-tracking page views on route change
 */
export function usePageViewTracking() {
  const { trackPageView } = useAnalytics();

  const trackCurrentPage = useCallback(() => {
    if (typeof window === 'undefined') return;

    trackPageView({
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  }, [trackPageView]);

  return { trackCurrentPage };
}
