import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { getVendorBySlug } from '@/services/vendor-service';
import { getProductsByVendor } from '@/services/product-service';
import ProductCard from '@/components/products/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { getSEOForTemplate } from '@/services/seo-service';
import { getStoreSettings } from '@/services/business-info-service';

interface VendorPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Enable ISR - Revalidate every 60 seconds
export const revalidate = 60;

/**
 * Generate metadata for vendor pages using admin-configured templates
 */
export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const vendorData = await getVendorBySlug(slug);

    if (!vendorData) {
      return {
        title: 'Vendor Not Found',
      };
    }

    const settings = await getStoreSettings();
    const businessName = settings.businessName || 'Our Store';

    // Get SEO settings from admin-configured template
    const seoConfig = await getSEOForTemplate('vendor', {
      name: vendorData.name,
      description: vendorData.description,
      location: `${vendorData.location.city}, ${vendorData.location.state}`,
      businessName,
    });

    return {
      title: seoConfig.title || `${vendorData.name} | ${businessName}`,
      description: seoConfig.description || vendorData.description,
      keywords: seoConfig.keywords?.join(', '),
      openGraph: {
        title: seoConfig.title || `${vendorData.name} | ${businessName}`,
        description: seoConfig.description || vendorData.description,
        type: 'website',
        images: vendorData.logo ? [{ url: vendorData.logo }] : undefined,
      },
      robots: seoConfig.noindex ? 'noindex, nofollow' : 'index, follow',
    };
  } catch (error) {
    console.error('Error generating vendor metadata:', error);
    return {
      title: 'Vendor',
      description: 'View vendor details',
    };
  }
}

/**
 * Vendor Page - Server Component
 *
 * This page is rendered on the server for:
 * - Better SEO (Google can crawl vendor content)
 * - Faster initial page load
 * - Proper 404 handling with notFound()
 */
export default async function VendorPage({ params }: VendorPageProps) {
  // Await the params (Next.js 15 requirement)
  const { slug } = await params;

  // Fetch vendor data
  const vendorData = await getVendorBySlug(slug);

  // Handle 404 - this will trigger app/not-found.tsx
  if (!vendorData) {
    notFound();
  }

  // Fetch products from this vendor with error handling
  const products = await getProductsByVendor(vendorData.id).catch(err => {
    console.error('Error fetching vendor products:', err);
    return [];
  });

  // Convert Firestore Timestamps to plain Dates for client components
  const serializedProducts = products.map(product => ({
    ...product,
    createdAt: product.createdAt.toDate(),
    updatedAt: product.updatedAt.toDate(),
    saleStart: product.saleStart ? product.saleStart.toDate() : undefined,
    saleEnd: product.saleEnd ? product.saleEnd.toDate() : undefined,
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section with Cover Image */}
        <div className="relative h-64 bg-gradient-to-r from-primary-600 to-primary-800">
          {vendorData.coverImage && (
            <Image
              src={vendorData.coverImage}
              alt={`${vendorData.name} cover`}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Vendor Info Card - Overlapping Hero */}
          <div className="relative -mt-16 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                {vendorData.logo && (
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-white shadow-lg">
                      <Image
                        src={vendorData.logo}
                        alt={vendorData.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Vendor Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendorData.name}</h1>
                      <p className="text-gray-600 mb-4">{vendorData.description}</p>
                    </div>
                    {vendorData.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        <CheckBadgeIcon className="h-4 w-4" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Certifications */}
                  {vendorData.certifications && vendorData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {vendorData.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium uppercase"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p>{vendorData.location.address}</p>
                        <p>
                          {vendorData.location.city}, {vendorData.location.state} {vendorData.location.zipCode}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {vendorData.contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                          <a href={`tel:${vendorData.contact.phone}`} className="hover:text-primary-600">
                            {vendorData.contact.phone}
                          </a>
                        </div>
                      )}
                      {vendorData.contact.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          <a href={`mailto:${vendorData.contact.email}`} className="hover:text-primary-600">
                            {vendorData.contact.email}
                          </a>
                        </div>
                      )}
                      {vendorData.contact.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                          <a
                            href={vendorData.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-600"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Media */}
                  {vendorData.socialMedia && (
                    <div className="flex gap-4 mt-4">
                      {vendorData.socialMedia.facebook && (
                        <a
                          href={vendorData.socialMedia.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-primary-600"
                        >
                          <span className="sr-only">Facebook</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                      )}
                      {vendorData.socialMedia.instagram && (
                        <a
                          href={vendorData.socialMedia.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-primary-600"
                        >
                          <span className="sr-only">Instagram</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                          </svg>
                        </a>
                      )}
                      {vendorData.socialMedia.twitter && (
                        <a
                          href={vendorData.socialMedia.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-primary-600"
                        >
                          <span className="sr-only">X (formerly Twitter)</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Story Section */}
          {vendorData.story && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
              <div className="prose max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{vendorData.story}</p>
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Products from {vendorData.name}</h2>
                <p className="text-gray-600 mt-1">{serializedProducts.length} products available</p>
              </div>
              <Link
                href={`/shop?vendor=${vendorData.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View all →
              </Link>
            </div>

            {serializedProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No products available from this vendor at the moment.
                </p>
                <Link
                  href="/shop"
                  className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Other Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {serializedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
