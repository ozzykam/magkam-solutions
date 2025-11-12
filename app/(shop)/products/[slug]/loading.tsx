import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Loading state for product detail page
 * This shows while the server is fetching product data
 */
export default function ProductLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-8">
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>

          {/* Product Details Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Image Skeleton */}
              <div>
                <div className="aspect-square bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                <div className="flex gap-2">
                  <div className="w-20 h-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Product Info Skeleton */}
              <div>
                {/* Title */}
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="h-10 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>

                {/* Vendor */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded flex-1 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Related Products Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
