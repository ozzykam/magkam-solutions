'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Service } from '@/types/services';
import ServiceForm from '@/components/admin/ServiceForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';


export default function EditServicePage() {
  const params = useParams();
  const serviceId = params.id as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const loadService = useCallback(async () => {
    try {
      const serviceDoc = await getDoc(doc(db, 'services', serviceId));
      if (serviceDoc.exists()) {
        setService({ ...serviceDoc.data(), id: serviceDoc.id } as Service);
      }
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const handleSubmit = async (data: Partial<Service>) => {
    const updatedService = {
      ...data,
      slug: data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || service?.slug || '',
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, 'services', serviceId), updatedService);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Service not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
        <p className="text-gray-600 mt-1">Update service information</p>
      </div>

      <ServiceForm service={service} onSubmit={handleSubmit} submitLabel="Update Service" />
    </div>
  );
}
