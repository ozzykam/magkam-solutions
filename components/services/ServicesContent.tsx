'use client';

import { useState, useMemo } from 'react';
import ServiceGrid from './ServiceGrid';
import ServiceCarousel from './ServiceCarousel';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import {
  filterServicesBySearch,
  filterServicesByCategory,
  filterServicesOnSale,
  sortServices,
  ServiceSortOption,
  paginateServices,
  ServiceWithOptionalDates,
} from '@/lib/utils/service-helpers';

interface ServicesContentProps {
  services: ServiceWithOptionalDates[];
  featuredServices: ServiceWithOptionalDates[];
  categories: Array<{ id: string; name: string }>;
  serviceNamePlural: string;
}

const ITEMS_PER_PAGE = 12;

export default function ServicesContent({
  services,
  featuredServices,
  categories,
  serviceNamePlural,
}: ServicesContentProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ServiceSortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Apply filters and sorting
  const filteredAndSortedServices = useMemo(() => {
    let filtered = [...services];

    // Apply search filter
    if (searchQuery) {
      filtered = filterServicesBySearch(filtered, searchQuery);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filterServicesByCategory(filtered, selectedCategory);
    }

    // Apply on-sale filter
    if (onSaleOnly) {
      filtered = filterServicesOnSale(filtered);
    }

    // Apply sorting
    filtered = sortServices(filtered, sortBy);

    return filtered;
  }, [services, searchQuery, selectedCategory, onSaleOnly, sortBy]);

  // Paginate results
  const paginatedResults = useMemo(() => {
    return paginateServices(filteredAndSortedServices, currentPage, ITEMS_PER_PAGE);
  }, [filteredAndSortedServices, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === 'all' ? null : value);
    handleFilterChange();
  };

  const handleSaleToggle = () => {
    setOnSaleOnly(!onSaleOnly);
    handleFilterChange();
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as ServiceSortOption);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setOnSaleOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory || onSaleOnly;

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {serviceNamePlural}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive range of professional {serviceNamePlural.toLowerCase()} tailored to meet your needs
          </p>
        </div>

        {/* Featured Services Carousel */}
        {featuredServices.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured {serviceNamePlural}</h2>
            <ServiceCarousel services={featuredServices} />
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <label htmlFor="search" className="sr-only">Search services</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="sr-only">Filter by category</label>
              <select
                id="category"
                value={selectedCategory || 'all'}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label htmlFor="sort" className="sr-only">Sort by</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="rating-asc">Lowest Rated</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            {/* On Sale Filter */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={handleSaleToggle}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">On Sale Only</span>
              </label>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FunnelIcon className="w-4 h-4" />
                <span>
                  Showing {filteredAndSortedServices.length} of {services.length} {serviceNamePlural.toLowerCase()}
                </span>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Services Grid */}
        {filteredAndSortedServices.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No {serviceNamePlural} Found</h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : `No ${serviceNamePlural.toLowerCase()} are currently available.`}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md font-semibold hover:bg-primary-700 transition-colors duration-200"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <ServiceGrid services={paginatedResults.services} columns={4} />

            {/* Pagination */}
            {paginatedResults.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!paginatedResults.hasPrevPage}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: paginatedResults.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                        page === currentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(paginatedResults.totalPages, p + 1))}
                  disabled={!paginatedResults.hasNextPage}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedServices.length)} of {filteredAndSortedServices.length} {serviceNamePlural.toLowerCase()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
