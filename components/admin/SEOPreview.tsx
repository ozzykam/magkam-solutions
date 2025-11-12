'use client';

import React from 'react';
import { truncateForSEO } from '@/services/seo-service';

interface SEOPreviewProps {
  title: string;
  description: string;
  url?: string;
  className?: string;
}

export default function SEOPreview({
  title,
  description,
  url = 'yourstore.com',
  className = '',
}: SEOPreviewProps) {
  // Truncate to Google's display limits
  const displayTitle = truncateForSEO(title, 60);
  const displayDescription = truncateForSEO(description, 160);
  const displayUrl = url.replace(/^https?:\/\//, '');

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Google Search Preview
      </h3>

      {/* Google Search Result Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        {/* URL Breadcrumb */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-600">🌐</span>
          </div>
          <span className="text-sm text-gray-600">{displayUrl}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl text-blue-600 hover:underline cursor-pointer mb-1">
          {displayTitle || 'Your Page Title Will Appear Here'}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {displayDescription || 'Your meta description will appear here. Make it compelling to encourage clicks!'}
        </p>
      </div>

      {/* Helper Text */}
      <p className="mt-3 text-xs text-gray-500">
        This is how your page will appear in Google search results. Make sure your title and description are compelling!
      </p>
    </div>
  );
}
