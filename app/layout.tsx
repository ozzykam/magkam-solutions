import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ToastProvider } from "@/components/ui";
import ThemeProvider from "@/components/theme/ThemeProvider";
import {
  GoogleAnalyticsScript,
  MicrosoftClarityScript,
  VerificationMetaTags,
  PageViewTracker,
  PerformanceMetrics,
} from "@/features/google-analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Local Market - Fresh, Local Services",
  description: "Shop fresh, local services from your neighborhood market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <VerificationMetaTags />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <GoogleAnalyticsScript />
        <MicrosoftClarityScript />

        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <PageViewTracker />
              </Suspense>
              <PerformanceMetrics />
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
