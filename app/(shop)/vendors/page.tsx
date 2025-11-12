import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getVendors } from '@/services/vendor-service';
import {
  MapPinIcon,
  CheckBadgeIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';
import { getStoreSettings } from '@/services/business-info-service';

/**
 * Generate metadata for vendors listing page
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/vendors');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `Our Vendors | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Meet the local farmers and producers who bring you fresh, quality products.`;

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
 * Vendors Listing Page - Server Component
 *
 * This page is rendered on the server for:
 * - Better SEO (Google can discover all vendors)
 * - Faster initial page load
 * - Pre-rendered vendor directory
 */
export default async function VendorsPage() {
  // Fetch all active vendors server-side
  const allVendors = await getVendors();

  // Filter to only show active vendors
  const activeVendors = allVendors.filter(vendor => vendor.isActive);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Vendors
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Meet the local farmers and producers who bring you fresh, quality products
            </p>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <p className="text-gray-600">
              Showing {activeVendors.length} {activeVendors.length === 1 ? 'vendor' : 'vendors'}
            </p>
          </div>

          {activeVendors.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No vendors available
              </h3>
              <p className="text-gray-500 mb-6">
                Check back soon as we add more local vendors to our marketplace.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.slug}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  {/* Cover Image */}
                  <div className="relative h-32 bg-gradient-to-r from-primary-600 to-primary-800">
                    {vendor.coverImage && (
                      <Image
                        src={vendor.coverImage}
                        alt={`${vendor.name} cover`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                    {vendor.isFeatured && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm text-primary-700 rounded-full text-xs font-medium">
                          <CheckBadgeIcon className="h-4 w-4" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vendor Info */}
                  <div className="p-6">
                    {/* Logo */}
                    {vendor.logo && (
                      <div className="relative -mt-12 mb-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden border-4 border-white shadow-lg bg-white">
                          <Image
                            src={vendor.logo}
                            alt={vendor.name}
                            width={80}
                            height={80}
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {vendor.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {vendor.description}
                    </p>

                    {/* Location */}
                    <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                      <MapPinIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p>{vendor.location.city}, {vendor.location.state}</p>
                      </div>
                    </div>

                    {/* Certifications */}
                    {vendor.certifications && vendor.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {vendor.certifications.slice(0, 3).map((cert) => (
                          <span
                            key={cert}
                            className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium uppercase"
                          >
                            {cert}
                          </span>
                        ))}
                        {vendor.certifications.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            +{vendor.certifications.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
