'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';

/**
 * Hook to access store settings with real-time updates
 * Subscribes to Firestore and updates when settings change
 */
export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'storeSettings', 'main');

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings({
            id: snapshot.id,
            ...snapshot.data(),
          } as StoreSettings);
        } else {
          setSettings(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching settings:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { settings, loading, error };
}

/**
 * Hook to check if analytics feature is enabled
 */
export function useAnalyticsFeature() {
  const { settings, loading } = useSettings();

  const isEnabled = settings?.features?.analytics?.enabled ?? false;
  const googleEnabled = settings?.features?.analytics?.google?.enabled ?? false;
  const bingEnabled = settings?.features?.analytics?.bing?.enabled ?? false;
  const config = settings?.features?.analytics;

  return {
    isEnabled,
    googleEnabled,
    bingEnabled,
    config,
    loading,
  };
}
