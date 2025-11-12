'use client';

import React from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types/product';
import ProductForm from '@/components/admin/ProductForm';
import { incrementCategoryProductCount } from '@/services/category-service';

export default function NewProductPage() {
  const handleSubmit = async (data: Partial<Product>) => {
    const newProduct = {
      ...data,
      slug: data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
      averageRating: 0,
      reviewCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'products'), newProduct);

    // Increment category product count
    if (newProduct.categoryId) {
      await incrementCategoryProductCount(newProduct.categoryId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 mt-1">Create a new product in your catalog</p>
      </div>

      <ProductForm onSubmit={handleSubmit} submitLabel="Create Product" />
    </div>
  );
}
