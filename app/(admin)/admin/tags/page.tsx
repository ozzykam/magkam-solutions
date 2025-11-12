'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Tag } from '@/types/tag';
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  toggleTagStatus,
  checkSlugExists,
} from '@/services/tag-service';
import { uploadImage } from '@/lib/firebase/storage';
import { PencilIcon, TrashIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function TagsManagementPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    imageUrl: '',
    description: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const allTags = await getAllTags();
      setTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        slug: tag.slug,
        imageUrl: tag.imageUrl,
        description: tag.description || '',
        isActive: tag.isActive,
      });
      setImagePreview(tag.imageUrl);
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        slug: '',
        imageUrl: '',
        description: '',
        isActive: true,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setImageFile(null);
    setImagePreview('');
    setErrors({});
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else {
      const slugExists = await checkSlugExists(formData.slug, editingTag?.id);
      if (slugExists) {
        newErrors.slug = 'This slug is already in use';
      }
    }

    if (!imageFile && !formData.imageUrl) {
      newErrors.image = 'Tag image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    try {
      setUploading(true);

      let imageUrl = formData.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'tags');
      }

      if (editingTag) {
        // Update existing tag
        await updateTag(editingTag.id, {
          ...formData,
          imageUrl,
        });
      } else {
        // Create new tag
        await createTag({
          ...formData,
          imageUrl,
        });
      }

      await loadTags();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving tag:', error);
      setErrors({ submit: 'Failed to save tag. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTag(tagId);
      await loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag. It may be in use by products.');
    }
  };

  const handleToggleStatus = async (tagId: string, currentStatus: boolean) => {
    try {
      await toggleTagStatus(tagId, !currentStatus);
      await loadTags();
    } catch (error) {
      console.error('Error toggling tag status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-gray-600 mt-1">Create and manage product tags</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="h-3 w-3" />Create Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No tags yet</p>
            <Button onClick={() => handleOpenModal()} variant="primary">
              Create Your First Tag
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tags.map(tag => (
            <Card key={tag.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={tag.imageUrl}
                        alt={tag.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                      <p className="text-sm text-gray-500">/{tag.slug}</p>
                    </div>
                  </div>
                  <Badge variant={tag.isActive ? 'success' : 'error'}>
                    {tag.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {tag.description && (
                  <p className="text-sm text-gray-600 mb-4">{tag.description}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(tag)}
                    fullWidth
                  >
                    <PencilIcon className="h-3 w-3" />Edit
                  </Button>
                  <Button
                    variant={tag.isActive ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleStatus(tag.id, tag.isActive)}
                    fullWidth
                  >
                    {tag.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                  ><TrashIcon className="w-6 h-6" />
                </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag Name */}
          <Input
            label="Tag Name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={errors.name}
            required
          />

          {/* Slug */}
          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            error={errors.slug}
            helperText="URL-friendly version of the name"
            required
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag Image *
            </label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {errors.image && (
                  <p className="text-sm text-red-600 mt-1">{errors.image}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active (visible to users)
            </label>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600">{errors.submit}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              fullWidth
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={uploading}
            >
              {uploading ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
