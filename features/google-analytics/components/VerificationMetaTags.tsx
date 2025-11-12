'use client';

import { useAnalyticsFeature } from '@/lib/hooks/useSettings';

/**
 * Search Engine Verification Meta Tags
 *
 * Adds verification meta tags for:
 * - Google Search Console
 * - Bing Webmaster Tools
 *
 * These allow the site to be verified and added to each webmaster platform.
 */

export default function VerificationMetaTags() {
  const { googleEnabled, bingEnabled, config } = useAnalyticsFeature();

  const googleVerification = config?.google?.siteVerification;
  const bingVerification = config?.bing?.siteVerification;

  return (
    <>
      {/* Google Search Console Verification */}
      {googleEnabled && googleVerification && (
        <meta name="google-site-verification" content={googleVerification} />
      )}

      {/* Bing Webmaster Tools Verification */}
      {bingEnabled && bingVerification && (
        <meta name="msvalidate.01" content={bingVerification} />
      )}
    </>
  );
}
