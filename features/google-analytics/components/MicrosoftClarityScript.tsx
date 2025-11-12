'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useAnalyticsFeature } from '@/lib/hooks/useSettings';

/**
 * Microsoft Clarity Script Component
 *
 * Loads Microsoft Clarity tracking code when enabled in settings.
 * Clarity provides:
 * - Session recordings
 * - Heatmaps
 * - Dead clicks and rage clicks detection
 * - User behavior insights
 *
 * FREE and incredibly valuable for UX optimization!
 */

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export default function MicrosoftClarityScript() {
  const { bingEnabled, config } = useAnalyticsFeature();

  const clarityId = config?.bing?.clarityId;
  const trackHeatmaps = config?.bing?.trackHeatmaps ?? true;

  useEffect(() => {
    if (!bingEnabled || !clarityId) return;

    console.log('[Microsoft Clarity] Initialized with ID:', clarityId);
  }, [bingEnabled, clarityId]);

  if (!bingEnabled || !clarityId) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `,
      }}
    />
  );
}
