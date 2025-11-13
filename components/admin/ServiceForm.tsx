'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { Service } from '@/types/service';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImageUploader from '@/components/admin/ImageUploader';

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: Partial<Service>) => Promise<void>;
  submitLabel?: string;
}

export default function ServiceForm({ service, onSubmit, submitLabel = 'Save Service' }: ServiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.basePrice || 0,
    salePrice: service?.salePrice || 0,
    isActive: service?.isActive ?? true,
    isFeatured: service?.isFeatured ?? false,
    onSale: service?.onSale ?? false,
    canDiscount: service?.canDiscount ?? true,
  });

  const [images, setImages] = useState<string[]>(service?.images || []);
  const [scheduledSale, setScheduledSale] = useState(Boolean(service?.saleStart && service?.saleEnd));
  const [saleStartDate, setSaleStartDate] = useState(
    service?.saleStart
      ? new Date(service.saleStart.toMillis()).toISOString().slice(0, 16)
      : ''
  );
  const [saleEndDate, setSaleEndDate] = useState(
    service?.saleEnd
      ? new Date(service.saleEnd.toMillis()).toISOString().slice(0, 16)
      : ''
  );


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

  const cleanServiceData = (data: Record<string, unknown>): Partial<Service> => {
    const cleaned: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        cleaned[key] = data[key];
      }
    });
    return cleaned as Partial<Service>;
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

      const rawServiceData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        salePrice: formData.salePrice > 0 ? formData.salePrice : undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        onSale: scheduledSale ? false : formData.onSale, // False for scheduled sales
        canDiscount: formData.canDiscount,
        images: images,
        saleStart,
        saleEnd,
      };

      // Clean undefined values before submitting
      const serviceData = cleanServiceData(rawServiceData);

      await onSubmit(serviceData);
      router.push('/admin/services');
    } catch (error) {
      console.error('Error submitting service:', error);
      alert('Failed to save service');
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
            label="Service Name"
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

        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Service Images</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload up to 5 images. The first image will be the featured image shown on service listings.
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
              Featured service
            </label>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/services')}
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
