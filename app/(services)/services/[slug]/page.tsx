import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ServiceImageGallery from '@/components/services/ServiceImageGallery';
import ServiceReviews from '@/components/services/ServiceReviews';
import ServiceCarousel from '@/components/services/ServiceCarousel';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getServiceBySlug } from '@/services/services-service';
import { getServiceReviews } from '@/services/review-service';
import { getStoreSettings } from '@/services/business-info-service';
import { getRelatedServices } from '@/lib/utils/service-helpers';
import { getPricingDisplay, formatPrice, formatPriceParts, getPricingTypeBadgeColor, getPricingTypeLabel } from '@/lib/utils/pricing-helpers';
import {
  getEffectivePrice,
  calculateSalePercent,
  isCurrentlyOnSale,
  hasCalculator
} from '@/types/services';
import { stripHtml } from '@/lib/utils/html';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Fetch service
  const service = await getServiceBySlug(slug);
  if (!service) {
    return { title: 'Service Not Found' };
  }

  // Fetch store settings
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Our Business';

  // Generate description
  const description = service.shortDescription ||
    (service.description ? stripHtml(service.description).substring(0, 160) : '');

  return {
    title: `${service.name} | ${businessName}`,
    description,
    keywords: service.tags.join(', '),
    openGraph: {
      title: service.name,
      description,
      images: service.images[0] ? [{
        url: service.images[0],
        width: 1200,
        height: 630,
        alt: service.name,
      }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: service.name,
      description,
      images: service.images[0] ? [service.images[0]] : [],
    },
  };
}

/**
 * Service Detail Page - Server Component
 */
export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;

  // Fetch service
  const service = await getServiceBySlug(slug);
  if (!service || !service.isActive) {
    notFound();
  }

  // Fetch reviews
  const reviews = await getServiceReviews(service.id);

  // Serialize timestamps for client components
  const serializedReviews = reviews.map(review => ({
    ...review,
    createdAt: review.createdAt instanceof Date
      ? review.createdAt
      : review.createdAt.toDate(),
    updatedAt: review.updatedAt instanceof Date
      ? review.updatedAt
      : review.updatedAt.toDate(),
  }));

  // Fetch related services
  const relatedServices = await getRelatedServices(service, 6);
  const serializedRelated = relatedServices.map(s => ({
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt : s.createdAt.toDate(),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt : s.updatedAt.toDate(),
    saleStart: s.saleStart instanceof Date ? s.saleStart : s.saleStart?.toDate(),
    saleEnd: s.saleEnd instanceof Date ? s.saleEnd : s.saleEnd?.toDate(),
  }));

  // Fetch store settings
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Our Business';
  const serviceNamePlural = settings.serviceSettings?.serviceNamePlural || 'Services';

  // Calculate pricing details
  const effectivePrice = getEffectivePrice(service);
  const salePercent = calculateSalePercent(Number(service.basePrice), service.salePrice);
  const isOnSale = isCurrentlyOnSale(service);
  const priceParts = effectivePrice ? formatPriceParts(effectivePrice) : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-gray-600">
              <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
              <li>/</li>
              <li><Link href="/services" className="hover:text-primary-600 transition-colors">{serviceNamePlural}</Link></li>
              <li>/</li>
              <li className="text-gray-900">{service.name}</li>
            </ol>
          </nav>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Left Column - Image Gallery */}
            <div>
              <ServiceImageGallery
                images={service.images}
                serviceName={service.name}
                onSale={isOnSale}
                salePercent={salePercent}
                isFeatured={service.isFeatured}
                tags={service.tags}
              />
            </div>

            {/* Right Column - Service Info */}
            <div className="flex flex-col gap-6">
              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {service.name}
              </h1>

              {/* Rating */}
              {service.averageRating && service.totalReviews && service.totalReviews > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= (service.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {service.averageRating.toFixed(1)} ({service.totalReviews} {service.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-baseline gap-3 mb-3">
                  {priceParts && service.pricingType !== 'custom_quote' ? (
                    <>
                      {isOnSale && service.salePrice ? (
                        <>
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-gray-900">
                              ${priceParts.dollars}
                            </span>
                            <span className="text-2xl font-bold text-gray-900">
                              .{priceParts.cents}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl text-gray-400 line-through">
                              {formatPrice(service.basePrice)}
                            </span>
                            <Badge variant="sale">{salePercent}% OFF</Badge>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900">
                            ${priceParts.dollars}
                          </span>
                          <span className="text-2xl font-bold text-gray-900">
                            .{priceParts.cents}
                          </span>
                          {service.pricingType === 'hourly' && (
                            <span className="text-lg text-gray-600 ml-1">/hour</span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">
                      {getPricingDisplay(service)}
                    </span>
                  )}
                </div>

                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPricingTypeBadgeColor(service.pricingType)}`}>
                  {getPricingTypeLabel(service.pricingType)}
                </span>
              </div>

              {/* Short Description */}
              {service.shortDescription && (
                <p className="text-lg text-gray-700 leading-relaxed">
                  {service.shortDescription}
                </p>
              )}

              {/* Deliverables */}
              {service.deliverables && service.deliverables.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">What You&apos;ll Get:</h3>
                  <ul className="space-y-2">
                    {service.deliverables.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duration */}
              {service.duration && (
                <div className="flex items-center gap-2 text-gray-700">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  <span><strong>Duration:</strong> {service.duration}</span>
                </div>
              )}

              {/* Includes */}
              {service.includes && service.includes.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Includes:</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.includes.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Link href="/contact" className="flex-1">
                  <Button variant="primary" size="lg" className="w-full">
                    Get a Quote
                  </Button>
                </Link>
                {hasCalculator(service) && service.calculatorId && (
                  <Link href={`/calculators/${service.calculatorId}`} className="flex-1">
                    <Button variant="outline" size="lg" className="w-full">
                      Calculate Price
                    </Button>
                  </Link>
                )}
              </div>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Description Section */}
          {service.description && (
            <section className="max-w-4xl mx-auto py-12 md:py-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Service</h2>
              <div
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: service.description }}
              />
            </section>
          )}

          {/* Reviews Section */}
          <section className="max-w-4xl mx-auto py-12 md:py-16">
            <ServiceReviews
              serviceId={service.id}
              serviceSlug={service.slug}
              initialReviews={serializedReviews}
              totalReviews={service.totalReviews}
            />
          </section>

          {/* Related Services */}
          {serializedRelated.length > 0 && (
            <section className="py-12 md:py-16 border-t border-gray-200">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Related {serviceNamePlural}</h2>
                <ServiceCarousel services={serializedRelated} />
              </div>
            </section>
          )}

          {/* Back Link */}
          <div className="pt-8 border-t border-gray-200 mt-8">
            <Link
              href="/services"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              ← Back to {serviceNamePlural}
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Service',
            name: service.name,
            description: service.shortDescription || stripHtml(service.description || '').substring(0, 160),
            provider: {
              '@type': 'Organization',
              name: businessName,
            },
            offers: effectivePrice && service.pricingType !== 'custom_quote' ? {
              '@type': 'Offer',
              price: effectivePrice,
              priceCurrency: 'USD',
            } : undefined,
            aggregateRating: service.averageRating && service.totalReviews ? {
              '@type': 'AggregateRating',
              ratingValue: service.averageRating,
              reviewCount: service.totalReviews,
            } : undefined,
            image: service.images,
          }),
        }}
      />
    </div>
  );
}
