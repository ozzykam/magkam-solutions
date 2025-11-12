import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ShoppingBagIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * 404 Not Found Page
 * Displayed when a user navigates to a page that doesn't exist
 */
export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-50 mb-6">
            <span className="text-6xl font-bold text-red-600">404</span>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. The page may have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
          >
            <HomeIcon className="w-5 h-5" />
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors"
          >
            <ShoppingBagIcon className="w-5 h-5" />
            Browse Products
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Here are some helpful links instead:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/shop"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              Shop All Products
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/vendors"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              Our Vendors
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/about"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              About Us
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/contact"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Search Suggestion */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-center gap-2 text-blue-900">
            <MagnifyingGlassIcon className="w-5 h-5" />
            <p className="text-sm font-medium">
              Looking for a specific product? Try searching from the homepage.
            </p>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </div>
  );
}
