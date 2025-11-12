import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ShopContent from '@/components/shop/ShopContent';
import { getProducts } from '@/services/product-service';
import { getAllTags } from '@/services/tag-service';
import { getVendors } from '@/services/vendor-service';
import { getCategoryHierarchy } from '@/services/category-service';
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
    : `Shop All Products | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Browse our complete selection of fresh, local products from trusted vendors in your community.`;

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
 * Shop Page - Server Component
 *
 * This page is rendered on the server for:
 * - Better SEO (Google can crawl all products)
 * - Faster initial page load
 * - Pre-rendered product listings
 *
 * Interactive parts (filters, search, sort) are in Client Components
 */
export default async function ShopPage() {
  // Fetch all data in parallel on the server
  const [allProducts, allCategories, allTags, allVendors] = await Promise.all([
    getProducts(),
    getCategoryHierarchy(),
    getAllTags(true), // Only active tags
    getVendors(),
  ]);

  // Only show active products to customers
  const activeProducts = allProducts.filter(p => p.isActive);

  // Convert Firestore Timestamps to plain Dates for client components
  const serializedProducts = activeProducts.map(product => ({
    ...product,
    createdAt: product.createdAt.toDate(),
    updatedAt: product.updatedAt.toDate(),
    saleStart: product.saleStart ? product.saleStart.toDate() : undefined,
    saleEnd: product.saleEnd ? product.saleEnd.toDate() : undefined,
  }));

  const serializedCategories = allCategories.map(category => ({
    ...category,
    createdAt: category.createdAt.toDate(),
    updatedAt: category.updatedAt.toDate(),
    subcategories: category.subcategories.map(subcat => ({
      ...subcat,
      createdAt: subcat.createdAt.toDate(),
      updatedAt: subcat.updatedAt.toDate(),
    })),
  }));

  const serializedVendors = allVendors.map(vendor => ({
    ...vendor,
    createdAt: vendor.createdAt.toDate(),
    updatedAt: vendor.updatedAt.toDate(),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-64 bg-gray-200 rounded mb-8" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white border rounded-lg shadow-sm" />
                ))}
              </div>
            </div>
          }
        >
          <ShopContent
            initialProducts={serializedProducts}
            categories={serializedCategories}
            tags={allTags}
            vendors={serializedVendors}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
