'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { isCurrentlyOnSale, Product } from '@/types/product';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DocumentDuplicateIcon, TrashIcon, PencilIcon, TagIcon } from '@heroicons/react/24/solid';
import { decrementCategoryProductCount, incrementCategoryProductCount } from '@/services/category-service';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDuplicate, setProductToDuplicate] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSale, setFilterSale] = useState<'all' | 'on-sale' | 'not-on-sale'>('all');

  // Bulk sale state
  const [bulkSaleMode, setBulkSaleMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [salePercentage, setSalePercentage] = useState('');
  const [showBulkSaleDialog, setShowBulkSaleDialog] = useState(false);
  const [showRemoveSaleDialog, setShowRemoveSaleDialog] = useState(false);
  const [applyingSale, setApplyingSale] = useState(false);
  const [removingSale, setRemovingSale] = useState(false);
  const [scheduledSale, setScheduledSale] = useState(false);
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(productsQuery);
      const productsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProductsList = useCallback(async () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => (filterStatus === 'active' ? p.isActive : !p.isActive));
    }

    // Filter by sale status
    if (filterSale !== 'all') {
      filtered = filtered.filter(p => (filterSale === 'on-sale' ? p.onSale : !p.onSale));
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterStatus, filterSale]);

    useEffect(() => {
    filterProductsList();
  }, [filterProductsList]);



  const openDeleteDialog = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setShowDeleteDialog(false);

    try {
      setDeleting(true);

      // Find the product to get its categoryId before deleting
      const product = products.find(p => p.id === productToDelete);

      await deleteDoc(doc(db, 'products', productToDelete));
      setProducts(products.filter(p => p.id !== productToDelete));

      // Decrement category product count
      if (product?.categoryId) {
        await decrementCategoryProductCount(product.categoryId);
      }

      setDeleting(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
      setDeleting(false);
    }
  };

  const openDuplicateDialog = (productId: string) => {
    setProductToDuplicate(productId);
    setShowDuplicateDialog(true);
  };

  const closeDuplicateDialog = () => {
    setShowDuplicateDialog(false);
    setProductToDuplicate(null);
  };

  const confirmDuplicate = async () => {
    if (!productToDuplicate) return;

    setShowDuplicateDialog(false);

    try {
      setDuplicating(true);

      const product = products.find(p => p.id === productToDuplicate);
      if (!product) return;

      // Generate unique slug
      let copySlug = `${product.slug}-copy`;
      let copyName = `${product.name} (Copy)`;
      let counter = 1;

      // Check if slug already exists and increment if needed
      while (products.some(p => p.slug === copySlug)) {
        counter++;
        copySlug = `${product.slug}-copy-${counter}`;
        copyName = `${product.name} (Copy ${counter})`;
      }

      // Create duplicate product data (exclude id)
      const { id: _unused, ...productWithoutId } = product;

      const productDataWithoutId = {
        ...productWithoutId,
        name: copyName,
        slug: copySlug,
        sku: '', // Blank SKU
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      void _unused;

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'products'), productDataWithoutId);

      // Add to local state
      const newProduct = { ...productDataWithoutId, id: docRef.id } as Product;
      setProducts([newProduct, ...products]);

      // Increment category product count
      if (product.categoryId) {
        await incrementCategoryProductCount(product.categoryId);
      }

      // Redirect to edit page for the new product
      router.push(`/admin/products/${docRef.id}/edit`);
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Failed to duplicate product');
      setDuplicating(false);
    }
  };

  // Bulk sale functions
  const toggleBulkSaleMode = () => {
    setBulkSaleMode(!bulkSaleMode);
    setSelectedProducts(new Set());
    setSalePercentage('');
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllFiltered = () => {
    const allIds = new Set(filteredProducts.map(p => p.id));
    setSelectedProducts(allIds);
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  const openBulkSaleDialog = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }
    if (!salePercentage || parseFloat(salePercentage) <= 0 || parseFloat(salePercentage) >= 100) {
      alert('Please enter a valid sale percentage (1-99)');
      return;
    }
    setShowBulkSaleDialog(true);
  };

  const closeBulkSaleDialog = () => {
    setShowBulkSaleDialog(false);
  };

  const confirmBulkSale = async () => {
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

    setShowBulkSaleDialog(false);
    setApplyingSale(true);

    try {
      const percentage = parseFloat(salePercentage);
      const selectedProductsArray = Array.from(selectedProducts);

      // Convert date strings to Firestore Timestamps if scheduled
      const saleStart = scheduledSale ? Timestamp.fromDate(new Date(saleStartDate)) : null;
      const saleEnd = scheduledSale ? Timestamp.fromDate(new Date(saleEndDate)) : null;

      // Update each selected product
      for (const productId of selectedProductsArray) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        // Calculate sale price based on percentage off regular price
        const salePrice = product.price * (1 - percentage / 100);

        const updateData: Partial<Product> = {
          salePrice: parseFloat(salePrice.toFixed(2)),
          onSale: !scheduledSale, // Set true only for immediate sales, false for scheduled
          updatedAt: Timestamp.now(),
        };

        // Add schedule dates if scheduled sale
        if (scheduledSale && saleStart && saleEnd) {
          updateData.saleStart = saleStart;
          updateData.saleEnd = saleEnd;
        }

        // Update in Firestore
        await updateDoc(doc(db, 'products', productId), updateData);

        // Update local state
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === productId
              ? { ...p, ...updateData }
              : p
          )
        );
      }

      // Reset bulk sale mode and scheduled sale state
      setBulkSaleMode(false);
      setSelectedProducts(new Set());
      setSalePercentage('');
      setScheduledSale(false);
      setSaleStartDate('');
      setSaleEndDate('');
    } catch (error) {
      console.error('Error applying bulk sale:', error);
      alert('Failed to apply sale. Please try again.');
    } finally {
      setApplyingSale(false);
    }
  };

  const openRemoveSaleDialog = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }
    setShowRemoveSaleDialog(true);
  };

  const closeRemoveSaleDialog = () => {
    setShowRemoveSaleDialog(false);
  };

  const confirmRemoveSale = async () => {
    setShowRemoveSaleDialog(false);
    setRemovingSale(true);

    try {
      const selectedProductsArray = Array.from(selectedProducts);

      // Update each selected product
      for (const productId of selectedProductsArray) {
        // Update in Firestore
        await updateDoc(doc(db, 'products', productId), {
          onSale: false,
          updatedAt: Timestamp.now(),
        });

        // Update local state
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === productId
              ? { ...p, onSale: false, updatedAt: Timestamp.now() }
              : p
          )
        );
      }

      // Reset bulk sale mode
      setBulkSaleMode(false);
      setSelectedProducts(new Set());
      setSalePercentage('');
    } catch (error) {
      console.error('Error removing sale:', error);
      alert('Failed to remove sale. Please try again.');
    } finally {
      setRemovingSale(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={bulkSaleMode ? 'danger' : 'outline'}
            onClick={toggleBulkSaleMode}
            leftIcon={<TagIcon className="h-4 w-4" />}
          >
            {bulkSaleMode ? 'Cancel Bulk Sale' : 'Bulk Sale'}
          </Button>
          <Link href="/admin/products/new">
            <Button variant="primary">+ Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search Products"
              placeholder="Search by name, description, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Products</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sale Status</label>
              <select
                value={filterSale}
                onChange={(e) => setFilterSale(e.target.value as 'all' | 'on-sale' | 'not-on-sale')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Products</option>
                <option value="on-sale">On Sale</option>
                <option value="not-on-sale">Not On Sale</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Sale Controls */}
      {bulkSaleMode && (
        <Card>
          <div className="p-6 bg-orange-50 border-l-4 border-orange-500">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Bulk Sale Mode</h3>
                <p className="text-sm text-gray-600">
                  Select products below, enter a sale percentage, and click &quot;Apply Sale&quot; to set sale prices. You can also remove sales from selected products.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                    Select All ({filteredProducts.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="% Off"
                    value={salePercentage}
                    onChange={(e) => setSalePercentage(e.target.value)}
                    className="w-24"
                  />
                  <Button
                    variant="primary"
                    onClick={openBulkSaleDialog}
                    disabled={selectedProducts.size === 0 || !salePercentage}
                  >
                    Apply Sale ({selectedProducts.size})
                  </Button>
                  <Button
                    variant="danger"
                    onClick={openRemoveSaleDialog}
                    disabled={selectedProducts.size === 0}
                  >
                    Remove Sale ({selectedProducts.size})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <Card>
            <div className="p-12 text-center text-gray-500">
              No products found
            </div>
          </Card>
        ) : (
          filteredProducts.map(product => (
            <Card key={product.id}>
              <div className="p-4">
                {/* Mobile & Desktop Layout */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Checkbox for bulk sale */}
                  {bulkSaleMode && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product.images?.[0] && (
                      <Image
                        width={64}
                        height={64}
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku || 'No SKU'}</p>
                      {/* Mobile-only info */}
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <Badge variant={product.isActive ? 'success' : 'default'} size="sm">
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {product.stock <= (product.lowStockThreshold || 0) && (
                          <Badge variant="warning" size="sm">Low Stock</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop-only columns */}
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">${product.price.toFixed(2)}</p>
                      {isCurrentlyOnSale(product) && (
                        <p className="text-xs text-green-600">
                          Sale: ${product.salePrice?.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-900">{product.stock} {product.unit}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={product.isActive ? 'success' : 'default'} size="sm">
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {product.stock <= (product.lowStockThreshold || 0) && (
                        <Badge variant="warning" size="sm">Low</Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Desktop */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Button 
                      variant="outline" 
                      size="sm"
                      title="Edit product">
                        <PencilIcon className="w-4 h-4"/>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDuplicateDialog(product.id)}
                      title="Duplicate product"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openDeleteDialog(product.id)}
                      title="Delete product"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons - Mobile (Second Line) */}
                <div className="flex sm:hidden  gap-2 mt-3 pt-3 border-t border-gray-200">
                  <Link href={`/admin/products/${product.id}/edit`} >
                    <Button 
                      variant="outline" 
                      size="sm"
                      title="Edit product">
                        <PencilIcon className="w-4 h-4"/>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDuplicateDialog(product.id)}
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(product.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {/* Duplicate Confirmation Dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DocumentDuplicateIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Duplicate Product</h3>
                <p className="text-sm text-gray-600">Create a copy of this product</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                This will create a duplicate of the selected product with the following changes:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">•</span>
                  <span>Name will be appended with &quot;(Copy)&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">•</span>
                  <span>SKU will be blank (you&apos;ll need to add a new one)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">•</span>
                  <span>All other details will be copied</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                You&apos;ll be redirected to the edit page to make any additional changes.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Button
                variant="outline"
                onClick={closeDuplicateDialog}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDuplicate}
              >
                Duplicate Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this product? This will:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Permanently remove the product from your catalog</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Update category product counts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Remove all product data and images</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ This action cannot be undone
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Button
                variant="outline"
                onClick={closeDeleteDialog}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Delete Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Sale Confirmation Dialog */}
      {showBulkSaleDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TagIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Apply Bulk Sale</h3>
                <p className="text-sm text-gray-600">Confirm sale details</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                You are about to apply a <strong>{salePercentage}% discount</strong> to <strong>{selectedProducts.size} product(s)</strong>.
              </p>

              {/* Schedule Sale Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduledSale}
                    onChange={(e) => setScheduledSale(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Schedule this sale</span>
                </label>
              </div>

              {/* Date Inputs (shown when scheduled) */}
              {scheduledSale && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
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
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={saleEndDate}
                      onChange={(e) => setSaleEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium mb-2">This will:</p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Calculate sale price as {100 - parseFloat(salePercentage || '0')}% of the regular price</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{scheduledSale ? 'Schedule the sale to activate automatically' : 'Set onSale to true for all selected products'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Update the salePrice field in each product</span>
                  </li>
                  {scheduledSale && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Sale will automatically end after the end date</span>
                    </li>
                  )}
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Example: A product priced at $10.00 will have a sale price of ${(10 * (1 - parseFloat(salePercentage || '0') / 100)).toFixed(2)}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Button
                variant="outline"
                onClick={closeBulkSaleDialog}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmBulkSale}
              >
                Apply Sale
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Sale Confirmation Dialog */}
      {showRemoveSaleDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TagIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Remove Sale</h3>
                <p className="text-sm text-gray-600">Confirm sale removal</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                You are about to remove the sale from <strong>{selectedProducts.size} product(s)</strong>.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-900 font-medium mb-2">This will:</p>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Set onSale to false for all selected products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Products will return to their regular price</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>The salePrice field will remain unchanged (but won&apos;t be used)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Button
                variant="outline"
                onClick={closeRemoveSaleDialog}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmRemoveSale}
              >
                Remove Sale
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicating Overlay */}
      {duplicating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <LoadingSpinner size="lg" />
            <p className="text-lg font-medium text-gray-900">Duplicating product...</p>
            <p className="text-sm text-gray-600">Redirecting to edit page</p>
          </div>
        </div>
      )}

      {/* Deleting Overlay */}
      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <LoadingSpinner size="lg" />
            <p className="text-lg font-medium text-gray-900">Deleting product...</p>
            <p className="text-sm text-gray-600">Please wait</p>
          </div>
        </div>
      )}

      {/* Applying Sale Overlay */}
      {applyingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <LoadingSpinner size="lg" />
            <p className="text-lg font-medium text-gray-900">Applying sale to products...</p>
            <p className="text-sm text-gray-600">Updating {selectedProducts.size} product(s)</p>
          </div>
        </div>
      )}

      {/* Removing Sale Overlay */}
      {removingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <LoadingSpinner size="lg" />
            <p className="text-lg font-medium text-gray-900">Removing sale from products...</p>
            <p className="text-sm text-gray-600">Updating {selectedProducts.size} product(s)</p>
          </div>
        </div>
      )}
    </div>
  );
}
