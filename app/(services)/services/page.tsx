import React from 'react';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';
import { getStoreSettings } from '@/services/business-info-service';

/**
 * Generate metadata for the shop page using admin-configured SEO settings
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/shop');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `Shop All Services | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Browse our complete selection of fresh, local services from trusted vendors in your community.`;

  return {
    title,
    description,
    keywords: seoConfig.keywords?.join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      images: seoConfig.ogImage ? [{ url: seoConfig.ogImage }] : undefined,
    },
    robots: seoConfig.noindex ? 'noindex, nofollow' : 'index, follow',
  };
}

/**
 * Services Page - Server Component
 *
 * This page is rendered on the server for:
 * - Better SEO (Google can crawl all services)
 * - Faster initial page load
 * - Pre-rendered service listings
 **/
export default async function ServicesPage() {


  // Convert Firestore Timestamps to plain Dates for client components

 

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
      </main>

      <Footer />
    </div>
  );
};

