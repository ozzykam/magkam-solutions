'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, Category } from '@/types/product';
import { Tag } from '@/types/tag';
import { Vendor } from '@/types/vendor';
import ProductCarousel from '@/components/products/ProductCarousel';
import ShopFilters from './ShopFilters';
import ShopControls from './ShopControls';

type CategoryWithDates = Omit<Category, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

interface CategoryWithSubcategories extends CategoryWithDates {
  subcategories: CategoryWithDates[];
}

type ProductWithDates = Omit<Product, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Date;
  updatedAt: Date;
  saleStart?: Date;
  saleEnd?: Date;
};

type VendorWithDates = Omit<Vendor, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

interface ShopContentProps {
  initialProducts: ProductWithDates[];
  categories: CategoryWithSubcategories[];
  tags: Tag[];
  vendors: VendorWithDates[];
}

export default function ShopContent({
  initialProducts,
  categories,
  tags,
  vendors,
}: ShopContentProps) {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';

  const [sortBy, setSortBy] = useState('featured');
  const [filterByCategories, setFilterByCategories] = useState<string[]>([]);
  const [filterByTags, setFilterByTags] = useState<string[]>([]);
  const [filterByVendors, setFilterByVendors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Update search query when URL params change
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Search function - searches name and tags
  const searchProducts = (products: ProductWithDates[], query: string): ProductWithDates[] => {
    if (!query.trim()) return products;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return products.filter(product => {
      const productName = product.name.toLowerCase();
      const productTags = product.tags.map(tag => tag.toLowerCase());
      const allSearchableText = [productName, ...productTags].join(' ');

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

  // Filter and search products
  let filteredProducts = [...initialProducts];

  // Apply search
  filteredProducts = searchProducts(filteredProducts, searchQuery);

  // Apply category filters
  if (filterByCategories.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      filterByCategories.includes(product.categoryId)
    );
  }

  // Apply tag filters
  if (filterByTags.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      filterByTags.some(filter => product.tags?.includes(filter))
    );
  }

  // Apply vendor filters
  if (filterByVendors.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      filterByVendors.includes(product.vendorId)
    );
  }

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => {
      const priceA = a.onSale && a.salePrice ? a.salePrice : a.price;
      const priceB = b.onSale && b.salePrice ? b.salePrice : b.price;
      return priceA - priceB;
    });
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => {
      const priceA = a.onSale && a.salePrice ? a.salePrice : a.price;
      const priceB = b.onSale && b.salePrice ? b.salePrice : b.price;
      return priceB - priceA;
    });
  } else if (sortBy === 'name') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'featured') {
    filteredProducts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  // Toggle category filter with cascading to subcategories
  const handleCategoryToggle = (categoryId: string, descendantIds: string[]) => {
    const isCurrentlySelected = filterByCategories.includes(categoryId);

    if (isCurrentlySelected) {
      // Uncheck: remove this category and all descendants
      setFilterByCategories(prev =>
        prev.filter(id => !descendantIds.includes(id))
      );
    } else {
      // Check: add this category and all descendants
      setFilterByCategories(prev => {
        const newFilters = [...prev];
        descendantIds.forEach(id => {
          if (!newFilters.includes(id)) {
            newFilters.push(id);
          }
        });
        return newFilters;
      });
    }
  };

  const toggleTagFilter = (tagSlug: string) => {
    setFilterByTags(prev =>
      prev.includes(tagSlug)
        ? prev.filter(f => f !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  const toggleVendorFilter = (vendorId: string) => {
    setFilterByVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(f => f !== vendorId)
        : [...prev, vendorId]
    );
  };

  // Get unique tag slugs from all products
  const productTagSlugs = Array.from(
    new Set(initialProducts.flatMap(p => p.tags || []))
  );

  // Filter tags to only show those that are used by products
  const availableTags = tags.filter(tag => productTagSlugs.includes(tag.slug));

  // Get unique vendor IDs from all products
  const productVendorIds = Array.from(
    new Set(initialProducts.map(p => p.vendorId).filter(Boolean))
  );

  // Filter vendors to only show those that have products
  const availableVendors = vendors.filter(vendor => productVendorIds.includes(vendor.id));

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop All Products</h1>
          <p className="text-gray-600">Fresh, local products from your community</p>

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
            <span className="font-medium text-gray-700">
              {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
            </span>
            {(filterByCategories.length > 0 || filterByTags.length > 0 || filterByVendors.length > 0) && (
              <span className="ml-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {filterByCategories.length + filterByTags.length + filterByVendors.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Hidden on mobile unless mobileFiltersOpen is true */}
          <aside className={`${mobileFiltersOpen ? 'block animate-fade-in' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
              <ShopFilters
              categories={categories}
              availableTags={availableTags}
              availableVendors={availableVendors}
              filterByCategories={filterByCategories}
              filterByTags={filterByTags}
              filterByVendors={filterByVendors}
              searchQuery={searchQuery}
              onCategoryToggle={handleCategoryToggle}
              onTagToggle={toggleTagFilter}
              onVendorToggle={toggleVendorFilter}
              onClearCategories={() => setFilterByCategories([])}
              onClearTags={() => setFilterByTags([])}
              onClearVendors={() => setFilterByVendors([])}
              onClearAll={() => {
                setFilterByCategories([]);
                setFilterByTags([]);
                setFilterByVendors([]);
              }}
              onClearSearch={() => setSearchQuery('')}
              />
            </div>
          </aside>

          {/* Products Carousels by Category */}
          <div className="flex-grow">
            {/* Group products by top-level category */}
            {categories.map((topCategory) => {
              // Get all category IDs for this top-level category (including subcategories)
              const categoryIds = [topCategory.id, ...topCategory.subcategories.map(s => s.id)];

              // Filter products that belong to this category tree
              const categoryProducts = filteredProducts.filter(p =>
                categoryIds.includes(p.categoryId)
              );

              if (categoryProducts.length === 0) return null;

              return (
                <ProductCarousel
                  key={topCategory.id}
                  title={topCategory.name}
                  products={categoryProducts}
                  viewAllHref={`/categories/${topCategory.slug}`}
                />
              );
            })}

            {/* Show message if no products in any category */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? `No products found for "${searchQuery}"`
                    : "No products match your filters"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
