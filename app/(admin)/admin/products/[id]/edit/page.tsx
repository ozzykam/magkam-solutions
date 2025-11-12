'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types/product';
import ProductForm from '@/components/admin/ProductForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { incrementCategoryProductCount, decrementCategoryProductCount } from '@/services/category-service';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProduct = useCallback(async () => {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        setProduct({ ...productDoc.data(), id: productDoc.id } as Product);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleSubmit = async (data: Partial<Product>) => {
    const updatedProduct = {
      ...data,
      slug: data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || product?.slug || '',
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, 'products', productId), updatedProduct);

    // Handle category changes
    const oldCategoryId = product?.categoryId;
    const newCategoryId = data.categoryId;

    if (oldCategoryId !== newCategoryId) {
      // Decrement old category count
      if (oldCategoryId) {
        await decrementCategoryProductCount(oldCategoryId);
      }

      // Increment new category count
      if (newCategoryId) {
        await incrementCategoryProductCount(newCategoryId);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product information</p>
      </div>

      <ProductForm product={product} onSubmit={handleSubmit} submitLabel="Update Product" />
    </div>
  );
}
