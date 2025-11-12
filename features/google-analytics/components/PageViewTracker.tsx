'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePageViewTracking } from '../hooks/useAnalytics';

/**
 * Page View Tracker Component
 *
 * Automatically tracks page views when the route changes.
 * Place this in your root layout to track all pages.
 *
 * Tracks:
 * - Route changes
 * - Search parameter changes
 * - Page title
 * - Full URL
 */

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackCurrentPage } = usePageViewTracking();

  useEffect(() => {
    // Track page view on route change
    trackCurrentPage();
  }, [pathname, searchParams, trackCurrentPage]);

  return null; // This component renders nothing
}
