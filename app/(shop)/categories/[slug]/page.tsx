import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { getCategoryBySlug, getSubcategories, getCategoryBreadcrumbs } from '@/services/category-service';
import { getProductsByCategory } from '@/services/product-service';
import ProductCard from '@/components/products/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { TagIcon, FolderIcon } from '@heroicons/react/24/outline';
import { getSEOForTemplate } from '@/services/seo-service';
import { getStoreSettings } from '@/services/business-info-service';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Enable ISR - Revalidate every 60 seconds
export const revalidate = 60;

/**
 * Generate metadata for category pages using admin-configured templates
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const categoryData = await getCategoryBySlug(slug);

    if (!categoryData) {
      return {
        title: 'Category Not Found',
      };
    }

    const settings = await getStoreSettings();
    const businessName = settings.businessName || 'Our Store';

    // Get SEO settings from admin-configured template
    const seoConfig = await getSEOForTemplate('category', {
      name: categoryData.name,
      description: categoryData.description || `Browse ${categoryData.name} products`,
      businessName,
    });

    return {
      title: seoConfig.title || `${categoryData.name} | ${businessName}`,
      description: seoConfig.description || `Browse our ${categoryData.name} products from trusted local vendors.`,
      keywords: seoConfig.keywords?.join(', '),
      openGraph: {
        title: seoConfig.title || `${categoryData.name} | ${businessName}`,
        description: seoConfig.description || `Browse our ${categoryData.name} products`,
        type: 'website',
        images: categoryData.image ? [{ url: categoryData.image }] : undefined,
      },
      robots: seoConfig.noindex ? 'noindex, nofollow' : 'index, follow',
    };
  } catch (error) {
    console.error('Error generating category metadata:', error);
    return {
      title: 'Category',
      description: 'Browse our products',
    };
  }
}

/**
 * Category Page - Server Component
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  // Await the params (Next.js 15 requirement)
  const { slug } = await params;

  // Fetch all data in parallel for better performance
  const categoryData = await getCategoryBySlug(slug);

  // Handle 404 - this will trigger app/not-found.tsx
  if (!categoryData) {
    notFound();
  }

  // Fetch related data in parallel with error handling
  const [breadcrumbs, subcategories, products] = await Promise.all([
    getCategoryBreadcrumbs(categoryData.id).catch(err => {
      console.error('Error fetching breadcrumbs:', err);
      return [];
    }),
    getSubcategories(categoryData.id).catch(err => {
      console.error('Error fetching subcategories:', err);
      return [];
    }),
    getProductsByCategory(categoryData.id).catch(err => {
      console.error('Error fetching products:', err);
      return [];
    }),
  ]);

  // Convert Firestore Timestamps to plain Dates for client components
  // This is required when passing data from Server Components to Client Components
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
        {/* Hero Section with Category Image */}
        <div className="relative h-64 bg-gradient-to-r from-primary-600 to-primary-800">
          {categoryData.image && (
            <Image
              src={categoryData.image}
              alt={categoryData.name}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Category Title Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-5xl font-bold mb-2">{categoryData.name}</h1>
              <p className="text-xl text-white/90">
                {categoryData.productCount} {categoryData.productCount === 1 ? 'product' : 'products'} available
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-primary-600">Home</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-primary-600">Shop</Link>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <span>/</span>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  ) : (
                    <Link href={`/categories/${crumb.slug}`} className="hover:text-primary-600">
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Subcategories Section */}
          {subcategories.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FolderIcon className="h-6 w-6 text-primary-600" />
                Browse by Subcategory
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {subcategories.map((subcat) => (
                  <Link
                    key={subcat.id}
                    href={`/categories/${subcat.slug}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 text-center">
                      {subcat.image ? (
                        <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                          <Image
                            src={subcat.image}
                            alt={subcat.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
                          <TagIcon className="h-8 w-8 text-primary-600" />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-900 text-sm group-hover:text-primary-600 transition-colors">
                        {subcat.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {subcat.productCount} {subcat.productCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {subcategories.length > 0 ? `All ${categoryData.name}` : 'Products'}
              </h2>
              {products.length > 0 && (
                <p className="text-gray-600">
                  Showing {products.length} {products.length === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products available
                </h3>
                <p className="text-gray-500 mb-6">
                  We don&apos;t have any products in this category at the moment.
                </p>
                {subcategories.length > 0 ? (
                  <p className="text-gray-600">
                    Try browsing our subcategories above or explore other categories.
                  </p>
                ) : (
                  <Link
                    href="/shop"
                    className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Browse All Products
                  </Link>
                )}
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
