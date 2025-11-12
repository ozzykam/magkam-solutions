import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import ProductActions from '@/components/products/ProductActions';
import ProductReviews from '@/components/products/ProductReviews';
import RelatedProducts from '@/components/products/RelatedProducts';
import { getProductBySlug, getProductsByCategory } from '@/services/product-service';
import { getProductReviews } from '@/services/review-service';
import { getSEOForTemplate } from '@/services/seo-service';
import { truncateForSEO } from '@/services/seo-service';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Enable ISR - Revalidate every 60 seconds
export const revalidate = 60;

// Optional: Generate static params for popular products at build time
// Uncomment and customize this function to pre-generate specific product pages
/*
export async function generateStaticParams() {
  // Fetch top 20 most popular products
  const popularProducts = await getProducts({ limit: 20 });

  return popularProducts.map((product) => ({
    slug: product.slug,
  }));
}
*/

/**
 * Generate metadata for SEO using admin-configured templates
 * Uses timeout to prevent blocking if Firestore is slow
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Add timeout to prevent hanging on slow Firestore queries
    const product = await Promise.race([
      getProductBySlug(slug),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)) // 5 second timeout
    ]);

    if (!product) {
      return {
        title: 'Product Not Found',
      };
    }

    // Fetch store settings with timeout
    const storeSettings = await Promise.race([
      getDoc(doc(db, 'storeSettings', 'main')).then(doc => doc.data() as StoreSettings | undefined),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000)) // 3 second timeout
    ]);
    const businessName = storeSettings?.businessName || 'Our Store';

    // Get SEO settings from admin-configured template
    const seoConfig = await getSEOForTemplate('product', {
      name: product.name,
      description: truncateForSEO(product.description, 160),
      categoryName: product.categoryName,
      vendorName: product.vendorName,
      businessName,
    });

    const displayPrice = product.onSale && product.salePrice ? product.salePrice : product.price;
    const inStock = product.stock > 0;

    return {
      title: seoConfig.title || `${product.name} - ${product.categoryName} | ${businessName}`,
      description: seoConfig.description || truncateForSEO(product.description, 160),
      keywords: seoConfig.keywords?.join(', ') || [product.name, product.categoryName, product.vendorName, ...product.tags].join(', '),
      openGraph: {
        title: seoConfig.title || product.name,
        description: seoConfig.description || truncateForSEO(product.description, 160),
        images: [
          {
            url: product.images[0] || '/placeholder-product.jpg',
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        type: 'website', // Next.js type limitation - product data in 'other' field
        siteName: businessName,
      },
      twitter: {
        card: 'summary_large_image',
        title: seoConfig.title || product.name,
        description: seoConfig.description || truncateForSEO(product.description, 160),
        images: [product.images[0] || '/placeholder-product.jpg'],
      },
      other: {
        // Product Rich Pins (Pinterest, Facebook, Google)
        'product:price:amount': displayPrice.toString(),
        'product:price:currency': 'USD',
        'product:availability': inStock ? 'in stock' : 'out of stock',
        'product:condition': 'new',
        'product:retailer_item_id': product.id,
        'product:brand': product.vendorName,
        'product:category': product.categoryName,
        // Pinterest-specific
        'pinterest:card': 'product',
      },
      robots: seoConfig.noindex ? 'noindex, nofollow' : 'index, follow',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product',
      description: 'View product details',
    };
  }
}

/**
 * Product Details Page - Server Component
 *
 * This page is rendered on the server for:
 * - Better SEO (Google can crawl product content)
 * - Faster initial page load
 * - Proper 404 handling with notFound()
 *
 * Interactive parts (cart, reviews, image gallery) are in Client Components
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  // Await the params (Next.js 15 requirement)
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related data in parallel with error handling and limits
  const [reviews, categoryProducts] = await Promise.all([
    getProductReviews(product.id).catch(err => {
      console.error('Error fetching reviews:', err);
      return []; // Return empty array if reviews fail
    }),
    getProductsByCategory(product.categoryId).then(products =>
      products.slice(0, 8) // Limit to 8 related products for performance
    ).catch(err => {
      console.error('Error fetching category products:', err);
      return []; // Return empty array if category products fail
    }),
  ]);

  // Convert Firestore Timestamps to plain Dates for client components
  const serializedProduct = {
    ...product,
    createdAt: product.createdAt.toDate(),
    updatedAt: product.updatedAt.toDate(),
    saleStart: product.saleStart ? product.saleStart.toDate() : undefined,
    saleEnd: product.saleEnd ? product.saleEnd.toDate() : undefined,
  };

  const serializedReviews = reviews.map(review => ({
    ...review,
    createdAt: review.createdAt.toDate(),
    updatedAt: review.updatedAt.toDate(),
  }));

  const serializedCategoryProducts = categoryProducts.map(p => ({
    ...p,
    createdAt: p.createdAt.toDate(),
    updatedAt: p.updatedAt.toDate(),
    saleStart: p.saleStart ? p.saleStart.toDate() : undefined,
    saleEnd: p.saleEnd ? p.saleEnd.toDate() : undefined,
  }));

  // Calculate display values
  const displayPrice = product.onSale && product.salePrice ? product.salePrice : product.price;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);
  const salePercent = product.onSale && product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center gap-2 text-gray-600">
              <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
              <li>/</li>
              <li><Link href="/shop" className="hover:text-primary-600">Shop</Link></li>
              <li>/</li>
              <li><Link href={`/categories/${product.categorySlug}`} className="hover:text-primary-600">{product.categoryName}</Link></li>
              <li>/</li>
              <li className="text-gray-900">{product.name}</li>
            </ol>
          </nav>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Images - Client Component */}
              <ProductImageGallery
                images={product.images}
                productName={product.name}
                onSale={product.onSale}
                salePercent={salePercent}
                isFeatured={product.isFeatured}
                tags={product.tags}
              />

              {/* Product Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

                {/* Rating */}
                {!product.averageRating && !product.totalReviews ? (
                    <p className="text-gray-600 mb-4">No reviews yet</p>
                  )
                  : (product.averageRating && product.totalReviews) && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(product.averageRating!) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-gray-600">
                        {product.averageRating} ({product.totalReviews} {product.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )
                }

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${displayPrice.toFixed(2)}
                      {product.unit && product.unit !== 'each' && (
                        <span className="text-xl text-gray-600">/{product.unit}</span>
                      )}
                    </span>
                    {product.onSale && product.salePrice && (
                      <span className="text-2xl text-red-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {isLowStock && !isOutOfStock && (
                    <p className="text-orange-600 font-medium">Only {product.stock} left in stock!</p>
                  )}
                  {isOutOfStock && (
                    <p className="text-red-600 font-medium">Out of stock</p>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

                {/* Vendor Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Sold by</p>
                  <Link
                    href={`/vendors/${product.vendorSlug}`}
                    className="text-lg font-semibold text-primary-600 hover:text-primary-700"
                  >
                    {product.vendorName}
                  </Link>
                </div>

                {/* Actions (Quantity, Add to Cart, Wishlist) - Client Component */}
                <ProductActions product={serializedProduct} isOutOfStock={isOutOfStock} />
              </div>
            </div>
          </div>

          {/* Reviews Section - Client Component */}
          <ProductReviews
            productId={product.id}
            productSlug={product.slug}
            initialReviews={serializedReviews}
            totalReviews={product.totalReviews}
          />

          {/* Related Products */}
          <RelatedProducts
            currentProduct={serializedProduct}
            allProducts={serializedCategoryProducts}
            maxProducts={4}
          />
        </div>
      </main>

      <Footer />

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.name,
            image: product.images,
            description: product.description,
            sku: product.sku || product.id,
            brand: {
              '@type': 'Brand',
              name: product.vendorName,
            },
            offers: {
              '@type': 'Offer',
              url: `https://yourstore.com/products/${product.slug}`,
              priceCurrency: 'USD',
              price: displayPrice,
              priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              itemCondition: 'https://schema.org/NewCondition',
              availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
              seller: {
                '@type': 'Organization',
                name: product.vendorName,
              },
            },
            aggregateRating: product.averageRating && product.totalReviews ? {
              '@type': 'AggregateRating',
              ratingValue: product.averageRating,
              reviewCount: product.totalReviews,
            } : undefined,
          }),
        }}
      />
    </div>
  );
}
