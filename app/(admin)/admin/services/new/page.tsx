'use client';

import React from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Service } from '@/types/services';
import ServiceForm from '@/components/admin/ServiceForm';

export default function NewServicePage() {
  const handleSubmit = async (data: Partial<Service>) => {
    const newService = {
      ...data,
      slug: data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
      averageRating: 0,
      reviewCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'services'), newService);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Service</h1>
        <p className="text-gray-600 mt-1">Create a new service in your catalog</p>
      </div>

      <ServiceForm onSubmit={handleSubmit} submitLabel="Create Service" />
    </div>
  );
}
