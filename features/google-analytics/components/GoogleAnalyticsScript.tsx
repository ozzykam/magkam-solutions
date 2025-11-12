'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useAnalyticsFeature } from '@/lib/hooks/useSettings';

/**
 * Google Analytics 4 (GA4) Script Component
 *
 * Loads Google Analytics tracking code when enabled in settings.
 * Supports:
 * - Page view tracking
 * - E-commerce events
 * - IP anonymization (GDPR)
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export default function GoogleAnalyticsScript() {
  const { googleEnabled, config } = useAnalyticsFeature();

  const measurementId = config?.google?.measurementId;
  const anonymizeIp = config?.google?.anonymizeIp ?? true; // Default to true for GDPR
  const trackEcommerce = config?.google?.trackEcommerce ?? true;

  useEffect(() => {
    if (!googleEnabled || !measurementId) return;

    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];

    // Define gtag function
    function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    }
    window.gtag = gtag;

    // Initialize GA4
    gtag('js', new Date());
    gtag('config', measurementId, {
      anonymize_ip: anonymizeIp,
      send_page_view: true,
    });

    console.log('[Google Analytics] Initialized with ID:', measurementId);
  }, [googleEnabled, measurementId, anonymizeIp]);

  if (!googleEnabled || !measurementId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 Script */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />

      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              anonymize_ip: ${anonymizeIp},
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}
