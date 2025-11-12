'use client';

import Image from 'next/image';
import { Category } from '@/types/product';
import { Tag } from '@/types/tag';
import { Vendor } from '@/types/vendor';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getAllDescendantCategoryIds } from '@/services/category-service';
import { useState } from 'react';

type CategoryWithDates = Omit<Category, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

interface CategoryWithSubcategories extends CategoryWithDates {
  subcategories: CategoryWithDates[];
}

type VendorWithDates = Omit<Vendor, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

interface ShopFiltersProps {
  categories: CategoryWithSubcategories[];
  availableTags: Tag[];
  availableVendors: (Vendor | VendorWithDates)[];
  filterByCategories: string[];
  filterByTags: string[];
  filterByVendors: string[];
  searchQuery: string;
  onCategoryToggle: (categoryId: string, descendantIds: string[]) => void;
  onTagToggle: (tagSlug: string) => void;
  onVendorToggle: (vendorId: string) => void;
  onClearCategories: () => void;
  onClearTags: () => void;
  onClearVendors: () => void;
  onClearAll: () => void;
  onClearSearch: () => void;
}

export default function ShopFilters({
  categories,
  availableTags,
  availableVendors,
  filterByCategories,
  filterByTags,
  filterByVendors,
  searchQuery,
  onCategoryToggle,
  onTagToggle,
  onVendorToggle,
  onClearCategories,
  onClearTags,
  onClearVendors,
  onClearAll,
  onClearSearch,
}: ShopFiltersProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryToggle = async (categoryId: string) => {
    // Get all descendant category IDs (including the category itself)
    const descendantIds = await getAllDescendantCategoryIds(categoryId);
    onCategoryToggle(categoryId, descendantIds);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>

        {/* Filter Options */}
        <div className="space-y-6">
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
                        onChange={() => handleCategoryToggle(category.id)}
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
                            onChange={() => handleCategoryToggle(subcat.id)}
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

          {/* Tags Filter */}
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
                      onChange={() => onTagToggle(tag.slug)}
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
                      onChange={() => onVendorToggle(vendor.id)}
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
                  onClick={onClearCategories}
                  className="text-sm text-primary-600 hover:text-primary-700 block"
                >
                  Clear category filters
                </button>
              )}
              {filterByTags.length > 0 && (
                <button
                  onClick={onClearTags}
                  className="text-sm text-primary-600 hover:text-primary-700 block"
                >
                  Clear tag filters
                </button>
              )}
              {filterByVendors.length > 0 && (
                <button
                  onClick={onClearVendors}
                  className="text-sm text-primary-600 hover:text-primary-700 block"
                >
                  Clear vendor filters
                </button>
              )}
              {(filterByCategories.length > 0 || filterByTags.length > 0 || filterByVendors.length > 0) && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-primary-600 hover:text-primary-700 block font-medium"
                >
                  Clear all filters
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={onClearSearch}
                  className="text-sm text-primary-600 hover:text-primary-700 block"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>  
  );
}
