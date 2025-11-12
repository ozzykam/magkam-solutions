'use client';

import Input from '@/components/ui/Input';

interface ShopControlsProps {
  searchQuery: string;
  sortBy: string;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: string) => void;
}

export default function ShopControls({
  searchQuery,
  sortBy,
  onSearchChange,
  onSortChange,
}: ShopControlsProps) {
  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-4">
      <div className="flex-1 max-w-xl">
        <Input
          type="search"
          placeholder="Search products by name or tag (e.g., 'tomato', 'grass fed', 'organic')..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
        >
          <option value="featured">Featured</option>
          <option value="name">Name (A-Z)</option>
          <option value="price-low">Price (Low to High)</option>
          <option value="price-high">Price (High to Low)</option>
        </select>
      </div>
    </div>
  );
}
