'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Global Error Component
 * Catches errors in the root layout
 * This is a fallback when error.tsx fails
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4 py-16">
          <div className="max-w-2xl w-full text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-100 mb-6">
                <svg
                  className="w-16 h-16 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Critical Error
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              We&apos;re experiencing technical difficulties. Please try refreshing the page or come back later.
            </p>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-xl mx-auto">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  Global Error (Development):
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
