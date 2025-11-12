'use client';

import React, { useState, useEffect } from 'react';
import { ContentCategory } from '@/types/content';
import {
  getContentCategories,
  createContentCategory,
  updateContentCategory,
  deleteContentCategory,
  generateCategorySlug,
  isCategorySlugUnique,
} from '@/services/content-category-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ContentCategoriesPage() {
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ContentCategory | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getContentCategories(false);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingCategory) {
      setSlug(generateCategorySlug(value));
    }
  };

  const handleEdit = (category: ContentCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || '');
    setColor(category.color || '#6B7280');
    setIsActive(category.isActive);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('#6B7280');
    setIsActive(true);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      alert('Please enter a category name');
      return;
    }

    // Check slug uniqueness
    const slugUnique = await isCategorySlugUnique(slug, editingCategory?.id);
    if (!slugUnique) {
      alert('This slug is already in use. Please choose a different one.');
      return;
    }

    try {
      setSaving(true);

      const categoryData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        color,
        isActive,
      };

      if (editingCategory) {
        await updateContentCategory(editingCategory.id, categoryData);
        alert('Category updated successfully!');
      } else {
        await createContentCategory(categoryData);
        alert('Category created successfully!');
      }

      await loadCategories();
      handleCancelEdit();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: ContentCategory) => {
    if (category.slug === 'general') {
      alert('Cannot delete the General category');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteContentCategory(category.id);
      alert('Category deleted successfully!');
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Categories</h1>
          <p className="text-gray-600 mt-1">Organize your content into categories</p>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            <PlusIcon className="w-5 h-5" /> Add Category
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Category Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Desserts, Main Courses"
                required
              />

              <Input
                label="URL Slug"
                value={slug}
                onChange={(e) => setSlug(generateCategorySlug(e.target.value))}
                placeholder="desserts, main-courses"
                helperText="Used in URLs"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of this category..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6B7280"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={saving}>
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h2>

          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No categories yet. Create your first category to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <span className="text-sm text-gray-500">({category.slug})</span>
                        {!category.isActive && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <PencilIcon className="w-4 h-4" /> Edit
                    </Button>
                    {category.slug !== 'general' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category)}
                      >
                       <TrashIcon className="w-4 h-4" />Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
