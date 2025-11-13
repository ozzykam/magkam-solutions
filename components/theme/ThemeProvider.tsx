'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadAndApplyTheme = async () => {
      try {
        // Load settings from Firestore
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        const settings = settingsDoc.data() as StoreSettings | undefined;

        const theme = settings?.themeSettings;

        if (theme) {
          // Apply CSS variables for colors
          const root = document.documentElement;

          if (theme.primaryColor) {
            // Convert hex to RGB for Tailwind
            const primaryRgb = hexToRgb(theme.primaryColor);
            if (primaryRgb) {
              root.style.setProperty('--color-primary', primaryRgb);
              root.style.setProperty('--color-primary-hex', theme.primaryColor);
            }
          }

          if (theme.secondaryColor) {
            const secondaryRgb = hexToRgb(theme.secondaryColor);
            if (secondaryRgb) {
              root.style.setProperty('--color-secondary', secondaryRgb);
              root.style.setProperty('--color-secondary-hex', theme.secondaryColor);
            }
          }

          // Apply font family
          if (theme.fontFamily && theme.fontFamily !== 'Inter') {
            // Load Google Font
            const fontName = theme.fontFamily.replace(/\s+/g, '+');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700;800;900&display=swap`;
            document.head.appendChild(link);

            // Apply font family
            root.style.setProperty('--font-family', `"${theme.fontFamily}", sans-serif`);
            document.body.style.fontFamily = `"${theme.fontFamily}", sans-serif`;
          }

          // Apply favicon
          if (theme.favicon) {
            updateFavicon(theme.favicon);
          }
        }

        setThemeLoaded(true);
      } catch (error) {
        console.error('Error loading theme:', error);
        setThemeLoaded(true);
      }
    };

    loadAndApplyTheme();
  }, []);

  return <>{children}</>;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : null;
}

// Helper function to update favicon
function updateFavicon(faviconUrl: string) {
  // Remove existing favicons
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(favicon => favicon.remove());

  // Add new favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = faviconUrl;
  document.head.appendChild(link);

  // Add apple touch icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = faviconUrl;
  document.head.appendChild(appleLink);
}
