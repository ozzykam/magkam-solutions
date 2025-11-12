'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui';
import SingleImageUploader from '@/components/admin/SingleImageUploader';
import {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from '@/services/vendor-service';
import { Vendor } from '@/types/vendor';
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function VendorsPage() {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    coverImage: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
    website: '',
    story: '',
    isActive: true,
    isFeatured: false,
  });


  const loadVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllVendors();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
      showToast('Failed to load vendors', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

    useEffect(() => {
    loadVendors();
  }, [loadVendors]);



  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        slug: vendor.slug,
        description: vendor.description,
        logo: vendor.logo || '',
        coverImage: vendor.coverImage || '',
        address: vendor.location.address,
        city: vendor.location.city,
        state: vendor.location.state,
        zipCode: vendor.location.zipCode,
        email: vendor.contact.email,
        phone: vendor.contact.phone,
        website: vendor.contact.website || '',
        story: vendor.story || '',
        isActive: vendor.isActive,
        isFeatured: vendor.isFeatured || false,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        logo: '',
        coverImage: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        email: '',
        phone: '',
        website: '',
        story: '',
        isActive: true,
        isFeatured: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      showToast('Name and slug are required', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const vendorData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        logo: formData.logo.trim() || undefined,
        coverImage: formData.coverImage.trim() || undefined,
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        },
        contact: {
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          website: formData.website.trim() || undefined,
        },
        story: formData.story.trim() || undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      if (editingVendor) {
        await updateVendor(editingVendor.id, vendorData);
        showToast('Vendor updated successfully', 'success');
      } else {
        await createVendor(vendorData);
        showToast('Vendor created successfully', 'success');
      }

      handleCloseModal();
      loadVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      showToast('Failed to save vendor', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (vendorId: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to delete "${vendorName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteVendor(vendorId);
      showToast('Vendor deleted successfully', 'success');
      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vendor';
      showToast(errorMessage, 'error');
    }
  };

  // Filter vendors by search query
  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">Manage your vendor partners</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="h-5 w-5" />}>
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <Input
            placeholder="Search vendors by name, city, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Vendors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.length === 0 ? (
          <Card className="col-span-full">
            <div className="p-12 text-center text-gray-500">
              {searchQuery ? 'No vendors found matching your search' : 'No vendors yet. Create your first vendor to get started.'}
            </div>
          </Card>
        ) : (
          filteredVendors.map((vendor) => (
            <Card key={vendor.id}>
              <div className="p-4 space-y-3">
                {/* Header with logo */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {vendor.logo && (
                      <Image
                        width={48}
                        height={48}
                        src={vendor.logo}
                        alt={vendor.name}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{vendor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={vendor.isActive ? 'success' : 'default'} size="sm">
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {vendor.isFeatured && (
                          <Badge variant="warning" size="sm">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">{vendor.description}</p>

                {/* Location */}
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{vendor.location.city}, {vendor.location.state}</span>
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{vendor.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{vendor.contact.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(vendor)}
                    leftIcon={<PencilIcon className="h-4 w-4" />}
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(vendor.id, vendor.name)}
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                    fullWidth
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredVendors.length} of {vendors.length} vendors
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>

            <Input
              label="Vendor Name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Green Valley Farms"
              required
            />

            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., green-valley-farms"
              helperText="URL-friendly version of the name (auto-generated)"
              required
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the vendor..."
              rows={3}
              required
            />

            <SingleImageUploader
              image={formData.logo}
              onChange={(imageUrl) => setFormData({ ...formData, logo: imageUrl })}
              folder="vendors"
              label="Vendor Logo (optional)"
            />

            <SingleImageUploader
              image={formData.coverImage}
              onChange={(imageUrl) => setFormData({ ...formData, coverImage: imageUrl })}
              folder="vendors"
              label="Cover Image (optional)"
            />
          </div>

          {/* Location */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Location</h3>

            <Input
              label="Street Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Farm Road"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Springfield"
                required
              />

              <Input
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
                required
              />
            </div>

            <Input
              label="ZIP Code"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="94102"
              required
            />
          </div>

          {/* Contact */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@vendor.com"
              required
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              required
            />

            <Input
              label="Website (optional)"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://vendor.com"
            />
          </div>

          {/* Story */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <Textarea
              label="Vendor Story (optional)"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="Tell us about this vendor..."
              rows={4}
            />
          </div>

          {/* Status Options */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (visible to customers)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                Featured (show on homepage/marketing pages)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingVendor ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
