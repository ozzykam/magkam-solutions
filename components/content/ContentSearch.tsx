'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ContentPost } from '@/types/content';
import { stripHtml } from '@/lib/utils/html';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import BookmarkButton from '@/components/content/BookmarkButton';

interface ContentSearchProps {
  posts: Array<Omit<ContentPost, 'createdAt' | 'updatedAt' | 'publishedAt'> & {
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
  }>;
  contentSlug: string;
  sectionNamePlural: string;
  itemsLabel: string;
  showAuthor: boolean;
  showViewCount: boolean;
}

type SortOption = 'newest' | 'oldest' | 'popular' | 'rating';

export default function ContentSearch({
  posts,
  contentSlug,
  sectionNamePlural,
  itemsLabel,
  showAuthor,
  showViewCount,
}: ContentSearchProps) {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Update search query when URL params change
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // Search by title, excerpt, description, and tags
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const excerptMatch = post.excerpt?.toLowerCase().includes(query);
        // Strip HTML from description before searching
        const descriptionMatch = stripHtml(post.description).toLowerCase().includes(query);
        const tagsMatch = post.tags.some((tag) => tag.toLowerCase().includes(query));
        return titleMatch || excerptMatch || descriptionMatch || tagsMatch;
      });
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter((post) => post.tags.includes(selectedTag));
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0);
        case 'oldest':
          return (a.publishedAt?.getTime() || 0) - (b.publishedAt?.getTime() || 0);
        case 'popular':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [posts, searchQuery, selectedTag, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${sectionNamePlural.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'result' : 'results'}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
        {(searchQuery || selectedTag) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('');
            }}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <p className="text-gray-500 text-lg">
            {searchQuery || selectedTag
              ? 'No results found. Try adjusting your search or filters.'
              : `No ${sectionNamePlural.toLowerCase()} available yet. Check back soon!`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/${contentSlug}/${post.slug}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Cover Image */}
              {post.coverImage && (
                <div className="relative w-full h-48 bg-gray-100">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Bookmark Button Overlay */}
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
                    <BookmarkButton postId={post.id} postTitle={post.title} variant="default" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h2>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt || stripHtml(post.description).slice(0, 150)}...
                </p>
                <p className="text-primary-600 font-medium group-hover:underline mb-2">
                  Read More &rarr;
                </p>

                {/* Rating */}
                {post.averageRating !== undefined && post.totalReviews !== undefined && post.totalReviews > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(post.averageRating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {post.averageRating.toFixed(1)} ({post.totalReviews})
                    </span>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {showAuthor && (
                      <>
                        <span>{post.authorName}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Draft'}
                    </span>
                  </div>
                  {showViewCount && <span>{post.viewCount} views</span>}
                </div>

                {/* Category & Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Category Badge */}
                  {post.categoryName && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded font-medium">
                      {post.categoryName}
                    </span>
                  )}

                  {/* Tags */}
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Featured Items Count */}
                {post.featuredItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {post.featuredItems.length} {itemsLabel.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
