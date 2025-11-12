'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Error Boundary Component
 * Catches runtime errors and displays a friendly error page
 * This must be a Client Component
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error('Application error:', error);

    // In production, you could send this to an error tracking service
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-orange-100 mb-6">
            <ExclamationTriangleIcon className="w-16 h-16 text-orange-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          We encountered an unexpected error. Don&apos;t worry, our team has been notified and we&apos;re working on it.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-xl mx-auto">
            <h3 className="text-sm font-semibold text-red-800 mb-2">
              Error Details (Development Only):
            </h3>
            <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        {/* Helpful Information */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">If this problem persists, please contact us:</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm">
            <Link
              href="/contact"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              Contact Support
            </Link>
            <span className="hidden sm:inline text-gray-300">•</span>
            <a
              href="mailto:support@example.com"
              className="text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              support@example.com
            </a>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-900">
            <strong>What you can do:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• Try refreshing the page</li>
            <li>• Clear your browser cache</li>
            <li>• Try a different browser</li>
            <li>• Contact us if the issue continues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
