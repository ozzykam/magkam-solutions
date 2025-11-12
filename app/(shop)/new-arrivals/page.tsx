'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCarousel from '@/components/products/ProductCarousel';
import Input from '@/components/ui/Input';
import { Product } from '@/types/product';
import { Category } from '@/types/product';
import { Tag } from '@/types/tag';
import { Vendor } from '@/types/vendor';
import { getProducts } from '@/services/product-service';
import { getAllTags } from '@/services/tag-service';
import { getVendors } from '@/services/vendor-service';
import { getCategoryHierarchy, getAllDescendantCategoryIds } from '@/services/category-service';
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterByCategories, setFilterByCategories] = useState<string[]>([]);
  const [filterByTags, setFilterByTags] = useState<string[]>([]);
  const [filterByVendors, setFilterByVendors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  // Load products, tags, vendors, and categories from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allProducts, allCategories, allTags, allVendors] = await Promise.all([
          getProducts(),
          getCategoryHierarchy(),
          getAllTags(true), // Only active tags
          getVendors(),
        ]);

        // Filter products created in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newProducts = allProducts.filter(p => {
          // Only show active products to customers
          if (!p.isActive) return false;

          // Check if created within last 30 days
          const createdAt = p.createdAt?.toDate?.() || new Date(0);
          return createdAt >= thirtyDaysAgo;
        });

        setProducts(newProducts);
        setCategories(allCategories);
        setTags(allTags);
        setVendors(allVendors);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Search function - searches name and tags
  const searchProducts = (products: Product[], query: string): Product[] => {
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
  let filteredProducts = [...products];

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
  } else if (sortBy === 'newest') {
    filteredProducts.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  // Toggle category filter with cascading to subcategories
  const toggleCategoryFilter = async (categoryId: string) => {
    const isCurrentlySelected = filterByCategories.includes(categoryId);

    // Get all descendant category IDs (including the category itself)
    const descendantIds = await getAllDescendantCategoryIds(categoryId);

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

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Get unique tag slugs from all products
  const productTagSlugs = Array.from(
    new Set(products.flatMap(p => p.tags || []))
  );

  // Filter tags to only show those that are used by products
  const availableTags = tags.filter(tag => productTagSlugs.includes(tag.slug));

  // Get unique vendor IDs from all products
  const productVendorIds = Array.from(
    new Set(products.map(p => p.vendorId).filter(Boolean))
  );

  // Filter vendors to only show those that have products
  const availableVendors = vendors.filter(vendor => productVendorIds.includes(vendor.id));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">New Arrivals</h1>
            </div>
            <p className="text-gray-600">
              Fresh additions from the last 30 days - {products.length} new {products.length === 1 ? 'product' : 'products'}
            </p>

            {/* Search Bar and Sort */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 max-w-xl">
                <Input
                  type="search"
                  placeholder="Search new arrivals by name or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                  fullWidth
                />
              </div>

              <div className="sm:w-48">
                <label htmlFor="sort-select" className="sr-only">Sort by</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  {/* Mobile toggle button */}
                  <button
                    onClick={() => setMobileFiltersExpanded(!mobileFiltersExpanded)}
                    className="lg:hidden p-1 hover:bg-gray-100 rounded"
                    aria-label="Toggle filters"
                  >
                    {mobileFiltersExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Filter Options - Hidden on mobile unless expanded */}
                <div className={`space-y-6 ${mobileFiltersExpanded ? 'block' : 'hidden lg:block'}`}>
                  {/* Categories Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                    <div className="space-y-1">
                      {categories.map((category) => (
                        <div key={category.id}>
                          {/* Parent Category */}
                          <div className="flex items-center gap-1">
                            {category.subcategories.length > 0 ? (
                              <button
                                onClick={() => toggleCategoryExpanded(category.id)}
                                className="p-0.5 hover:bg-gray-100 rounded"
                              >
                                {expandedCategories.includes(category.id) ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                            ) : (
                              <div className="w-5 flex-shrink-0" />
                            )}
                            <label className="flex items-center gap-2 cursor-pointer group flex-1">
                              <input
                                type="checkbox"
                                checked={filterByCategories.includes(category.id)}
                                onChange={() => toggleCategoryFilter(category.id)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                {category.name}
                              </span>
                            </label>
                          </div>

                          {/* Subcategories */}
                          {expandedCategories.includes(category.id) && category.subcategories.length > 0 && (
                            <div className="ml-9 mt-1 space-y-1">
                              {category.subcategories.map((subcat) => (
                                <label key={subcat.id} className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={filterByCategories.includes(subcat.id)}
                                    onChange={() => toggleCategoryFilter(subcat.id)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                                    {subcat.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="space-y-2">
                      {availableTags.length === 0 ? (
                        <p className="text-sm text-gray-500">No tags available</p>
                      ) : (
                        availableTags.map(tag => (
                          <label key={tag.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filterByTags.includes(tag.slug)}
                              onChange={() => toggleTagFilter(tag.slug)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="relative w-5 h-5 rounded overflow-hidden bg-white flex-shrink-0">
                              <Image
                                src={tag.imageUrl}
                                alt={tag.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{tag.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Vendors Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Vendors</h3>
                    <div className="space-y-2">
                      {availableVendors.length === 0 ? (
                        <p className="text-sm text-gray-500">No vendors available</p>
                      ) : (
                        availableVendors.map(vendor => (
                          <label key={vendor.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filterByVendors.includes(vendor.id)}
                              onChange={() => toggleVendorFilter(vendor.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{vendor.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(filterByCategories.length > 0 || filterByTags.length > 0 || filterByVendors.length > 0 || searchQuery) && (
                    <div className="pt-4 border-t space-y-2">
                      {filterByCategories.length > 0 && (
                        <button
                          onClick={() => setFilterByCategories([])}
                          className="text-sm text-primary-600 hover:text-primary-700 block"
                        >
                          Clear category filters
                        </button>
                      )}
                      {filterByTags.length > 0 && (
                        <button
                          onClick={() => setFilterByTags([])}
                          className="text-sm text-primary-600 hover:text-primary-700 block"
                        >
                          Clear tag filters
                        </button>
                      )}
                      {filterByVendors.length > 0 && (
                        <button
                          onClick={() => setFilterByVendors([])}
                          className="text-sm text-primary-600 hover:text-primary-700 block"
                        >
                          Clear vendor filters
                        </button>
                      )}
                      {(filterByCategories.length > 0 || filterByTags.length > 0 || filterByVendors.length > 0) && (
                        <button
                          onClick={() => {
                            setFilterByCategories([]);
                            setFilterByTags([]);
                            setFilterByVendors([]);
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700 block font-medium"
                        >
                          Clear all filters
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-sm text-primary-600 hover:text-primary-700 block"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Products Carousels by Category */}
            <div className="flex-grow">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
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
                          ? `No new arrivals found for "${searchQuery}"`
                          : "No new arrivals match your filters"}
                      </p>
                    </div>
                  )}

                  {/* Show message if no new arrivals at all */}
                  {products.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        No new arrivals in the last 30 days
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Check back soon for new products!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
