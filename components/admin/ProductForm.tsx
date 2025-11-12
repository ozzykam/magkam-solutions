'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { Product, Category } from '@/types/product';
import { getCategories } from '@/services/category-service';
import { getAllTags } from '@/services/tag-service';
import { getVendors } from '@/services/vendor-service';
import { Tag } from '@/types/tag';
import { Vendor } from '@/types/vendor';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImageUploader from '@/components/admin/ImageUploader';
import { PlusIcon } from '@heroicons/react/24/outline';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  submitLabel?: string;
}

export default function ProductForm({ product, onSubmit, submitLabel = 'Save Product' }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(product?.tags || []);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    salePrice: product?.salePrice || 0,
    stock: product?.stock || 0,
    unit: product?.unit || 'lb',
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    categoryName: product?.categoryName || '',
    categorySlug: product?.categorySlug || '',
    vendorId: product?.vendorId || '',
    vendorName: product?.vendorName || '',
    vendorSlug: product?.vendorSlug || '',
    lowStockThreshold: product?.lowStockThreshold || 10,
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    onSale: product?.onSale ?? false,
    canDiscount: product?.canDiscount ?? true,
  });

  const [images, setImages] = useState<string[]>(product?.images || []);
  const [scheduledSale, setScheduledSale] = useState(Boolean(product?.saleStart && product?.saleEnd));
  const [saleStartDate, setSaleStartDate] = useState(
    product?.saleStart
      ? new Date(product.saleStart.toMillis()).toISOString().slice(0, 16)
      : ''
  );
  const [saleEndDate, setSaleEndDate] = useState(
    product?.saleEnd
      ? new Date(product.saleEnd.toMillis()).toISOString().slice(0, 16)
      : ''
  );

  useEffect(() => {
    loadCategories();
    loadVendors();
    loadTags();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const fetchedVendors = await getVendors();
      setVendors(fetchedVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const loadTags = async () => {
    try {
      setLoadingTags(true);
      const fetchedTags = await getAllTags(true); // Only active tags
      setTags(fetchedTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleTagToggle = (tagSlug: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagSlug)) {
        return prev.filter(t => t !== tagSlug);
      } else {
        return [...prev, tagSlug];
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    const selectedCategory = categories.find(cat => cat.id === categoryId);

    if (selectedCategory) {
      setFormData(prev => ({
        ...prev,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categorySlug: selectedCategory.slug,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoryId: '',
        categoryName: '',
        categorySlug: '',
      }));
    }
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    const selectedVendor = vendors.find(v => v.id === vendorId);

    if (selectedVendor) {
      setFormData(prev => ({
        ...prev,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        vendorSlug: selectedVendor.slug,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        vendorId: '',
        vendorName: '',
        vendorSlug: '',
      }));
    }
  };

  const cleanProductData = (data: Record<string, unknown>): Partial<Product> => {
    const cleaned: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        cleaned[key] = data[key];
      }
    });
    return cleaned as Partial<Product>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate scheduled sale dates if scheduled
    if (scheduledSale) {
      if (!saleStartDate || !saleEndDate) {
        alert('Please select both start and end dates for the scheduled sale');
        return;
      }
      if (new Date(saleStartDate) >= new Date(saleEndDate)) {
        alert('End date must be after start date');
        return;
      }
    }

    setLoading(true);

    try {
      // Convert date strings to Firestore Timestamps if scheduled
      const saleStart = scheduledSale && saleStartDate ? Timestamp.fromDate(new Date(saleStartDate)) : undefined;
      const saleEnd = scheduledSale && saleEndDate ? Timestamp.fromDate(new Date(saleEndDate)) : undefined;

      const rawProductData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        salePrice: formData.salePrice > 0 ? formData.salePrice : undefined,
        stock: formData.stock,
        unit: formData.unit,
        sku: formData.sku || undefined,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        categorySlug: formData.categorySlug,
        vendorId: formData.vendorId,
        vendorName: formData.vendorName,
        vendorSlug: formData.vendorSlug,
        tags: selectedTags,
        lowStockThreshold: formData.lowStockThreshold,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        onSale: scheduledSale ? false : formData.onSale, // False for scheduled sales
        canDiscount: formData.canDiscount,
        images: images,
        saleStart,
        saleEnd,
      };

      // Clean undefined values before submitting
      const productData = cleanProductData(rawProductData);

      await onSubmit(productData);
      router.push('/admin/products');
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : 'Select a category'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vendorId}
                onChange={handleVendorChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={loadingVendors}
              >
                <option value="">
                  {loadingVendors ? 'Loading vendors...' : 'Select a vendor'}
                </option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="SKU"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="Optional"
          />

          {/* Tags Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/tags')}
              >
                <PlusIcon />Create Tag
              </Button>
            </div>

            {loadingTags ? (
              <p className="text-sm text-gray-500">Loading tags...</p>
            ) : tags.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500 mb-2">No tags available</p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/admin/tags')}
                >
                  <PlusIcon /> Create Your First Tag
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTags.includes(tag.slug)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.slug)}
                      onChange={() => handleTagToggle(tag.slug)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={tag.imageUrl}
                        alt={tag.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Regular Price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              required
            />

            <Input
              label="Sale Price (optional)"
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.salePrice}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="onSale"
              id="onSale"
              checked={formData.onSale}
              onChange={handleChange}
              disabled={scheduledSale}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
            />
            <label htmlFor="onSale" className="text-sm font-medium text-gray-700">
              On Sale {scheduledSale && '(disabled for scheduled sale)'}
            </label>
          </div>

          {/* Schedule Sale Toggle */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="scheduledSale"
                checked={scheduledSale}
                onChange={(e) => {
                  setScheduledSale(e.target.checked);
                  if (!e.target.checked) {
                    setSaleStartDate('');
                    setSaleEndDate('');
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="scheduledSale" className="text-sm font-medium text-gray-700">
                Schedule this sale
              </label>
            </div>

            {/* Date Inputs (shown when scheduled) */}
            {scheduledSale && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={saleStartDate}
                    onChange={(e) => setSaleStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={saleEndDate}
                    onChange={(e) => setSaleEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div className="col-span-full">
                  <p className="text-xs text-gray-600">
                    The sale will automatically activate at the start date and deactivate at the end date.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="canDiscount"
              id="canDiscount"
              checked={formData.canDiscount}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="canDiscount" className="text-sm font-medium text-gray-700">
              Can be discounted
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="lb">lb (pounds)</option>
                <option value="oz">oz (ounces)</option>
                <option value="kg">kg (kilograms)</option>
                <option value="g">g (grams)</option>
                <option value="unit">unit</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
          </div>

          <Input
            label="Low Stock Threshold"
            name="lowStockThreshold"
            type="number"
            min="0"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            helperText="Alert when stock falls below this amount"
          />
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload up to 5 images. The first image will be the featured image shown on product listings.
            </p>
          </div>

          <ImageUploader
            images={images}
            onChange={setImages}
            maxImages={5}
          />
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Status</h2>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (visible in store)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
              Featured product
            </label>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
