'use client';

import { useSettings } from '@/lib/hooks/useSettings';
import { ReactNode } from 'react';

/**
 * FeatureGuard Component
 *
 * Controls access to premium features based on store settings.
 * Use this to wrap any feature that should be tier-gated.
 *
 * Example:
 * <FeatureGuard feature="analytics">
 *   <AnalyticsDashboard />
 * </FeatureGuard>
 */

type FeatureName = 'analytics'; // Add more features here as you build them

interface FeatureGuardProps {
  feature: FeatureName;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  children: ReactNode;
}

export default function FeatureGuard({
  feature,
  fallback = null,
  loadingFallback = null,
  children
}: FeatureGuardProps) {
  const { settings, loading } = useSettings();

  // Show loading state
  if (loading) {
    return <>{loadingFallback}</>;
  }

  // Check if feature is enabled
  const isEnabled = settings?.features?.[feature]?.enabled ?? false;

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Platform-specific guard for analytics
 * Checks if a specific analytics platform (Google or Bing) is enabled
 */
interface AnalyticsPlatformGuardProps {
  platform: 'google' | 'bing';
  fallback?: ReactNode;
  children: ReactNode;
}

export function AnalyticsPlatformGuard({
  platform,
  fallback = null,
  children
}: AnalyticsPlatformGuardProps) {
  const { settings, loading } = useSettings();

  if (loading) {
    return null;
  }

  const analyticsEnabled = settings?.features?.analytics?.enabled ?? false;
  const platformEnabled = settings?.features?.analytics?.[platform]?.enabled ?? false;

  if (!analyticsEnabled || !platformEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
