import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { ToastProvider } from "@/components/ui";
import CartDrawerWrapper from "@/components/cart/CartDrawerWrapper";
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
  title: "Local Market - Fresh, Local Products",
  description: "Shop fresh, local products from your neighborhood market",
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

        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <Suspense fallback={null}>
                  <PageViewTracker />
                </Suspense>
                <PerformanceMetrics />
                {children}
                <CartDrawerWrapper />
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
