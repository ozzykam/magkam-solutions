import React from 'react';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ServicesContent from '@/components/services/ServicesContent';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';
import { getStoreSettings } from '@/services/business-info-service';
import { getServices, getFeaturedServices } from '@/services/services-service';
import { getContentCategories } from '@/services/content-category-service';

/**
 * Generate metadata for the services page using admin-configured SEO settings
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';
  const serviceName = settings.serviceSettings?.serviceNamePlural || 'Services';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/services');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `${serviceName} | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Browse our complete selection of professional ${serviceName.toLowerCase()} tailored to meet your needs.`;

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
  // Fetch store settings
  const settings = await getStoreSettings();
  const serviceNamePlural = settings.serviceSettings?.serviceNamePlural || 'Services';

  // Fetch all active services
  const allServices = await getServices({ activeOnly: true });

  // Fetch featured services
  const featured = await getFeaturedServices();

  // Fetch categories for filter dropdown
  const categories = await getContentCategories();

  // Convert Firestore Timestamps to plain Dates for client components
  const serializedServices = allServices.map(service => ({
    ...service,
    createdAt: service.createdAt instanceof Date
      ? service.createdAt
      : service.createdAt.toDate(),
    updatedAt: service.updatedAt instanceof Date
      ? service.updatedAt
      : service.updatedAt.toDate(),
    saleStart: service.saleStart instanceof Date
      ? service.saleStart
      : service.saleStart?.toDate(),
    saleEnd: service.saleEnd instanceof Date
      ? service.saleEnd
      : service.saleEnd?.toDate(),
  }));

  const serializedFeatured = featured.map(service => ({
    ...service,
    createdAt: service.createdAt instanceof Date
      ? service.createdAt
      : service.createdAt.toDate(),
    updatedAt: service.updatedAt instanceof Date
      ? service.updatedAt
      : service.updatedAt.toDate(),
    saleStart: service.saleStart instanceof Date
      ? service.saleStart
      : service.saleStart?.toDate(),
    saleEnd: service.saleEnd instanceof Date
      ? service.saleEnd
      : service.saleEnd?.toDate(),
  }));

  // Map categories to simple objects
  const categoryOptions = categories
    .filter(cat => cat.isActive)
    .map(cat => ({
      id: cat.id,
      name: cat.name,
    }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        <ServicesContent
          services={serializedServices}
          featuredServices={serializedFeatured}
          categories={categoryOptions}
          serviceNamePlural={serviceNamePlural}
        />
      </main>

      <Footer />
    </div>
  );
}
