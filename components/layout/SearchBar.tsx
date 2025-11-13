'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getServices } from '@/services/service-service';
import { getContentPosts } from '@/services/content-service';
import { Service } from '@/types/service';
import { ContentPost } from '@/types/content';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { stripHtml } from '@/lib/utils/html';

interface SearchBarProps {
  className?: string;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

interface SearchResults {
  services: Service[];
  contentPosts: ContentPost[];
}

export default function SearchBar({
  className = '',
  isExpanded: externalIsExpanded,
  onToggle
}: SearchBarProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({ services: [], contentPosts: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [contentSlug, setContentSlug] = useState('blog');
  const [contentEnabled, setContentEnabled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load content settings
  useEffect(() => {
    const loadContentSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data() as StoreSettings;
          if (settings.contentSettings?.enabled) {
            setContentEnabled(true);
            setContentSlug(settings.contentSettings.urlSlug || 'blog');
          }
        }
      } catch (error) {
        console.error('Error loading content settings:', error);
      }
    };

    loadContentSettings();
  }, []);

  // Search function for services - matches ShopContent logic
  const searchServices = (services: Service[], query: string): Service[] => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return services.filter(service => {
      const serviceName = service.name.toLowerCase();
      const serviceDescription = service.description.toLowerCase();
      const allSearchableText = [serviceName, serviceDescription].join(' ');

      // Check if any search term matches (supports singular/plural)
      return searchTerms.some(term => {
        // Direct match
        if (allSearchableText.includes(term)) return true;

        // Try adding 's' for plural
        if (allSearchableText.includes(term + 's')) return true;

        // Try removing 's' for singular
        if (term.endsWith('s') && allSearchableText.includes(term.slice(0, -1))) return true;

        // Try adding 'es' for plural
        if (allSearchableText.includes(term + 'es')) return true;

        // Try removing 'es' for singular
        if (term.endsWith('es') && allSearchableText.includes(term.slice(0, -2))) return true;

        return false;
      });
    });
  };

  // Search function for content posts
  const searchContentPosts = (posts: ContentPost[], query: string): ContentPost[] => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return posts.filter(post => {
      const title = post.title.toLowerCase();
      const excerpt = (post.excerpt || '').toLowerCase();
      const description = stripHtml(post.description).toLowerCase();
      const tags = post.tags.map(tag => tag.toLowerCase());
      const allSearchableText = [title, excerpt, description, ...tags].join(' ');

      // Check if any search term matches
      return searchTerms.some(term => {
        // Direct match
        if (allSearchableText.includes(term)) return true;

        // Try adding 's' for plural
        if (allSearchableText.includes(term + 's')) return true;

        // Try removing 's' for singular
        if (term.endsWith('s') && allSearchableText.includes(term.slice(0, -1))) return true;

        // Try adding 'es' for plural
        if (allSearchableText.includes(term + 'es')) return true;

        // Try removing 'es' for singular
        if (term.endsWith('es') && allSearchableText.includes(term.slice(0, -2))) return true;

        return false;
      });
    });
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ services: [], contentPosts: [] });
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        // Fetch services and content posts in parallel
        const [allServices, allContentPosts] = await Promise.all([
          getServices(),
          contentEnabled ? getContentPosts(true) : Promise.resolve([]),
        ]);

        // Filter to active services only
        const activeServices = allServices.filter(p => p.isActive);

        // Search both
        const serviceResults = searchServices(activeServices, searchQuery);
        const contentResults = searchContentPosts(allContentPosts, searchQuery);

        // Sort services (featured first, then by name)
        serviceResults.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.name.localeCompare(b.name);
        });

        // Sort content posts (by view count, then by date)
        contentResults.sort((a, b) => {
          const viewDiff = (b.viewCount || 0) - (a.viewCount || 0);
          if (viewDiff !== 0) return viewDiff;
          return (b.publishedAt?.toMillis() || 0) - (a.publishedAt?.toMillis() || 0);
        });

        // Take top 5 from each (or split to max 5 total)
        setSearchResults({
          services: serviceResults.slice(0, 3),
          contentPosts: contentResults.slice(0, 2),
        });
        setShowResults(true);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults({ services: [], contentPosts: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, contentEnabled]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (onToggle) {
          onToggle(false);
        } else {
          setInternalIsExpanded(false);
        }
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggle]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowResults(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleExpand = () => {
    if (onToggle) {
      onToggle(true);
    } else {
      setInternalIsExpanded(true);
    }
  };

  const handleCollapse = () => {
    if (onToggle) {
      onToggle(false);
    } else {
      setInternalIsExpanded(false);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleResultClick = () => {
    if (onToggle) {
      onToggle(false);
    } else {
      setInternalIsExpanded(false);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const handleViewMore = () => {
    if (onToggle) {
      onToggle(false);
    } else {
      setInternalIsExpanded(false);
    }
    setShowResults(false);
  };

  const hasResults = searchResults.services.length > 0 || searchResults.contentPosts.length > 0;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {!isExpanded ? (
        // Collapsed state - just icon
        <button
          onClick={handleExpand}
          className="text-gray-700 hover:text-primary-600 transition-colors"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="w-6 h-6" />
        </button>
      ) : (
        // Expanded state - search input
        <div className={externalIsExpanded !== undefined ? "w-full" : "absolute right-0 top-0 z-50 animate-slide-in-right"}>
          <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-lg overflow-hidden focus-within:ring-0">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search services and content..."
              className="w-full px-4 py-4"
              style={{
                outline: 'none',
                border: 'none',
                boxShadow: 'none'
              }}
            />
              <button
                onClick={handleCollapse}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className={`absolute ${externalIsExpanded !== undefined ? 'left-0' : 'right-0'} mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-[500px] overflow-y-auto animate-fade-in`}>
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary-600 border-r-transparent"></div>
                  <p className="text-sm text-gray-600 mt-2">Searching...</p>
                </div>
              ) : hasResults ? (
                <>
                  {/* Services Section */}
                  {searchResults.services.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Services
                      </div>
                      {searchResults.services.map((service) => {
                        const displayPrice = service.onSale && service.salePrice
                          ? service.salePrice
                          : service.basePrice;

                        return (
                          <Link
                            key={service.id}
                            href={`/services/${service.slug}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            {/* Service Image */}
                            {service.images[0] && (
                              <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded">
                                <Image
                                  src={service.images[0]}
                                  alt={service.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            )}

                            {/* Service Info */}
                            <div className="flex-grow min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {service.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-semibold text-primary-600">
                                  ${displayPrice?.toFixed(2)}
                                </span>
                                {service.onSale && service.salePrice && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ${service.basePrice?.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Featured Badge */}
                            {service.isFeatured && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                Featured
                              </span>
                            )}
                          </Link>
                        );
                      })}
                      <div className="px-4 py-2">
                        <Link
                          href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                          onClick={handleViewMore}
                          className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          View all services for &quot;{searchQuery}&quot;
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Content Posts Section */}
                  {searchResults.contentPosts.length > 0 && (
                    <div className={`py-2 ${searchResults.services.length > 0 ? 'border-t border-gray-200' : ''}`}>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Content
                      </div>
                      {searchResults.contentPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/${contentSlug}/${post.slug}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          {/* Cover Image */}
                          {post.coverImage && (
                            <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded">
                              <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          )}

                          {/* Post Info */}
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {post.categoryName && (
                                <span className="text-xs text-gray-600">
                                  {post.categoryName}
                                </span>
                              )}
                              {post.viewCount > 0 && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-600">
                                    {post.viewCount} views
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                      <div className="px-4 py-2">
                        <Link
                          href={`/${contentSlug}?search=${encodeURIComponent(searchQuery)}`}
                          onClick={handleViewMore}
                          className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          View all content for &quot;{searchQuery}&quot;
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-sm text-gray-600">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
