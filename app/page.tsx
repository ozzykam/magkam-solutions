import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { getTopLevelCategories } from '@/services/category-service';
import { FolderIcon } from '@heroicons/react/24/outline';
import { Category } from '@/types/product';
import SearchBar from '@/components/layout/SearchBar';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata(): Promise<Metadata> {
  // Fetch store settings for business name
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
  const businessName = storeSettings?.businessName || 'Our Store';
  const businessDescription = storeSettings?.businessDescription || 'The best quality near you';

  return {
    title: `${businessName} - ${businessDescription}`,
    description: businessDescription,
    keywords: 'local products, fresh food, farmers market, organic, local delivery, farm to table',
    openGraph: {
      title: `${businessName} - Fresh Local Products`,
      description: businessDescription,
      type: 'website',
      locale: 'en_US',
      siteName: businessName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${businessName} - Fresh Local Products`,
      description: businessDescription,
    },
  };
}

export default async function Home() {
  // Fetch store settings for JSON-LD
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
  const businessName = storeSettings?.businessName || 'Our Store';
  const businessDescription = storeSettings?.businessDescription || 'The best quality near you';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

  // Fetch categories server-side for SEO
  let categories: Category[] = [];
  try {
    const allCategories = await getTopLevelCategories();
    // Limit to 8 categories for homepage display
    categories = allCategories.slice(0, 8);
  } catch (error) {
    console.error('Error loading categories:', error);
    // Fallback to empty array if fetch fails
    categories = [];
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Fresh, Local Products
                <br />
                <span className="text-primary-600">Delivered to Your Door</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Support local farmers and businesses while enjoying the freshest products from your community.
              </p>
              {/* Search Bar */}
              <SearchBar className="max-w-sm mx-auto mb-12 top-4"/> 
              <div className="flex gap-4 justify-center">
                <Link href="/shop">
                  <Button variant="primary" size="lg">
                    Shop Now
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Fresh & Local</h3>
                <p className="text-gray-600">
                  All products sourced from local farmers and producers in your area.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Same-day or next-day delivery available for most orders.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600">
                  100% satisfaction guarantee or your money back.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Preview Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
              <p className="text-gray-600">Browse our selection of fresh, local products</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow group"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-primary-50 flex items-center justify-center">
                      {category.image ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      ) : (
                        <FolderIcon className="w-10 h-10 text-primary-600" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No categories available yet.</p>
                  <Link href="/shop" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
                    Browse all products →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to support local?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of customers enjoying fresh, local products
            </p>
            <Link href="/register">
              <Button variant="secondary" size="lg">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: businessName,
            description: businessDescription,
            url: baseUrl,
            logo: `${baseUrl}/logo.png`,
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: storeSettings?.email || 'info@yourstore.com',
            },
            address: storeSettings?.address ? {
              '@type': 'PostalAddress',
              streetAddress: storeSettings.address.street,
              addressLocality: storeSettings.address.city,
              addressRegion: storeSettings.address.state,
              postalCode: storeSettings.address.zipCode,
              addressCountry: 'US',
            } : undefined,
            sameAs: [
              storeSettings?.socialMedia?.facebook,
              storeSettings?.socialMedia?.instagram,
              storeSettings?.socialMedia?.x,
              storeSettings?.socialMedia?.linkedin,
              storeSettings?.socialMedia?.youtube,
            ].filter(Boolean),
          }),
        }}
      />
    </div>
  );
}
