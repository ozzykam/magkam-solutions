'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Service } from '@/types/services';
import ShopControls from './ShopControls';


type ServiceWithDates = Omit<Service, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Date;
  updatedAt: Date;
  saleStart?: Date;
  saleEnd?: Date;
};

interface ShopContentProps {
  initialServices: ServiceWithDates[];
}

export default function ShopContent({
  initialServices,
}: ShopContentProps) {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';

  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Update search query when URL params change
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Search function - searches name and tags
  const searchServices = (services: ServiceWithDates[], query: string): ServiceWithDates[] => {
    if (!query.trim()) return services;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return services.filter(service => {
      const serviceName = service.name.toLowerCase();
      const serviceTags = service.tags.map(tag => tag.toLowerCase());
      const allSearchableText = [serviceName, ...serviceTags].join(' ');

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

  // Filter and search services
  let filteredServices = [...initialServices];

  // Apply search
  filteredServices = searchServices(filteredServices, searchQuery);

  // Sort services
  if (sortBy === 'price-low') {
    filteredServices.sort((a, b) => {
      const priceA = a.onSale && a.salePrice ? a.salePrice : Number(a.basePrice);
      const priceB = b.onSale && b.salePrice ? b.salePrice : Number(b.basePrice);
      return priceA - priceB;
    });
  } else if (sortBy === 'price-high') {
    filteredServices.sort((a, b) => {
      const priceA = a.onSale && a.salePrice ? a.salePrice : Number(a.basePrice);
      const priceB = b.onSale && b.salePrice ? b.salePrice : Number(b.basePrice);
      return priceB - priceA;
    });
  } else if (sortBy === 'name') {
    filteredServices.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'featured') {
    filteredServices.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }


  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop All Services</h1>
          <p className="text-gray-600">Fresh, local services from your community</p>

          {/* Search Bar and Sort */}
          <ShopControls
            searchQuery={searchQuery}
            sortBy={sortBy}
            onSearchChange={setSearchQuery}
            onSortChange={setSortBy}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Hidden on mobile unless mobileFiltersOpen is true */}
          <aside className={`${mobileFiltersOpen ? 'block animate-fade-in' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
             
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
