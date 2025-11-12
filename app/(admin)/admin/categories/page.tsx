'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui';
import SingleImageUploader from '@/components/admin/SingleImageUploader';
import {
  getCategoryHierarchy,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/category-service';
import { Category } from '@/types/product';
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';

interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    parentId: '',
  });

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCategoryHierarchy();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        image: category.image || '',
        parentId: category.parentId || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        image: '',
        parentId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      image: '',
      parentId: '',
    });
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

      const categoryData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        image: formData.image.trim() || undefined,
        parentId: formData.parentId || undefined,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        showToast('Category updated successfully', 'success');
      } else {
        await createCategory(categoryData as Omit<Category, 'id' | 'productCount'>);
        showToast('Category created successfully', 'success');
      }

      handleCloseModal();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showToast('Failed to save category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (categoryId: string, categoryName: string) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setShowDeleteDialog(false);

    try {
      setDeleting(true);
      await deleteCategory(categoryToDelete.id);
      showToast('Category deleted successfully', 'success');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filter categories by search query
  const filteredCategories = categories.filter((category) => {
    const matchesParent = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChild = category.subcategories.some((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesParent || matchesChild;
  });

  // Get all categories for parent selection (flattened)
  const allCategoriesFlat = categories.flatMap((cat) => [
    cat,
    ...cat.subcategories,
  ]);

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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="h-5 w-5" />}>
          Add Category
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Categories List */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No categories found matching your search' : 'No categories yet. Create your first category to get started.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <Card key={category.id}>
              <div className="p-4">
                {/* Parent Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {category.image ? (
                      <div className="relative h-12 w-12">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover rounded-lg border border-gray-200"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-primary-50 rounded-lg border border-primary-200">
                        <FolderIcon className="h-6 w-6 text-primary-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {category.slug} • {category.productCount} products
                      </p>
                    </div>
                    {category.subcategories.length > 0 && (
                      <Badge variant="default" size="sm">
                        {category.subcategories.length} subcategories
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(category)}
                      leftIcon={<PencilIcon className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openDeleteDialog(category.id, category.name)}
                    >
                     <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subcategories */}
                {category.subcategories.length > 0 && (
                  <div className="mt-4 pl-9 space-y-2">
                    {category.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center justify-between py-2 border-l-2 border-gray-200 pl-4"
                      >
                      <div className="flex items-center space-x-3">
                          {subcategory.image ? (
                          <div className="relative h-12 w-12">
                            <Image
                              src={subcategory.image}
                              alt={subcategory.name}
                              fill
                              className="object-cover rounded-lg border border-gray-200"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center bg-primary-50 rounded-lg border border-primary-200">
                            <FolderIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-800">{subcategory.name}</h4>
                          <p className="text-sm text-gray-500">
                            {subcategory.slug} • {subcategory.productCount} products
                          </p>
                        </div>
                      </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(subcategory)}
                            leftIcon={<PencilIcon className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openDeleteDialog(subcategory.id, subcategory.name)}
                            title="delete subcategory"
                            >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Fresh Produce"
            required
          />

          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., fresh-produce"
            helperText="URL-friendly version of the name (auto-generated)"
            required
          />

          <SingleImageUploader
            image={formData.image}
            onChange={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
            folder="categories"
            label="Category Image (optional)"
          />

          <div className="text-xs text-gray-500 -mt-2">
            Or enter an image URL manually:
          </div>

          <Input
            label=""
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category (optional)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">None (Top-level category)</option>
              {allCategoriesFlat
                .filter((cat) => cat.id !== editingCategory?.id && !cat.parentId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Select a parent to create a subcategory
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && categoryToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>&ldquo;{categoryToDelete.name}&rdquo;</strong>? This will:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Permanently remove the category from your catalog</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Remove all subcategories (if any)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Products in this category will become uncategorized</span>
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
                Delete Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deleting Overlay */}
      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
            <LoadingSpinner size="lg" />
            <p className="text-lg font-medium text-gray-900">Deleting category...</p>
            <p className="text-sm text-gray-600">Please wait</p>
          </div>
        </div>
      )}
    </div>
  );
}
