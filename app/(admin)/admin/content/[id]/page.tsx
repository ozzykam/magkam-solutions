'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/contexts/AuthContext';
import { StoreSettings } from '@/types/business-info';
import { FeaturedItem } from '@/types/content';
import {
  createContentPost,
  updateContentPost,
  getContentPostById,
  generateSlug,
  isSlugUnique,
} from '@/services/content-service';
import { getServices } from '@/services/service-service';
import { Service } from '@/types/service';
import { ContentCategory } from '@/types/content';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SingleImageUploader from '@/components/admin/SingleImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { getContentCategories, ensureGeneralCategory } from '@/services/content-category-service';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ContentEditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContentEditorPage({ params }: ContentEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [contentSettings, setContentSettings] = useState({
    sectionName: 'Blog Post',
    itemsLabel: 'Featured Services',
    itemsLabelSingular: 'Featured Service',
  });

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const loadData = useCallback( async () => {
    try {
      setLoading(true);

      // Load content settings
      const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data() as StoreSettings;
        if (settings.contentSettings) {
          setContentSettings({
            sectionName: settings.contentSettings.sectionName,
            itemsLabel: settings.contentSettings.itemsLabel,
            itemsLabelSingular: settings.contentSettings.itemsLabelSingular,
          });
        }
      }

      // Load services for featured items selector
      const allServices = await getServices();
      setServices(allServices.filter((p) => p.isActive));

      // Load content categories
      const allCategories = await getContentCategories(true); // Only active categories
      setCategories(allCategories);

      // Ensure "General" category exists
      let generalCategoryId = '';
      if (allCategories.length === 0 || !allCategories.find(c => c.slug === 'general')) {
        generalCategoryId = await ensureGeneralCategory();
        // Reload categories
        const updatedCategories = await getContentCategories(true);
        setCategories(updatedCategories);
        generalCategoryId = updatedCategories.find(c => c.slug === 'general')?.id || '';
      } else {
        generalCategoryId = allCategories.find(c => c.slug === 'general')?.id || '';
      }

      // Load existing post if editing
      if (!isNew) {
        const post = await getContentPostById(id);
        if (post) {
          setTitle(post.title);
          setSlug(post.slug);
          setExcerpt(post.excerpt || '');
          setDescription(post.description);
          setCategoryId(post.categoryId || generalCategoryId);
          setCoverImage(post.coverImage || '');
          setImages(post.images);
          setFeaturedItems(post.featuredItems);
          setTags(post.tags);
          setIsPublished(post.isPublished);
          setMetaTitle(post.metaTitle || '');
          setMetaDescription(post.metaDescription || '');
        }
      } else {
        // Set default category for new posts
        setCategoryId(generalCategoryId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew || !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddFeaturedItem = () => {
    setFeaturedItems([
      ...featuredItems,
      {
        id: `temp-${Date.now()}`,
        name: '',
        quantity: '',
        notes: '',
      },
    ]);
  };

  const handleUpdateFeaturedItem = (
    index: number,
    field: keyof FeaturedItem,
    value: string
  ) => {
    const updated = [...featuredItems];
    updated[index] = { ...updated[index], [field]: value };

    // If service is selected, auto-fill details
    if (field === 'serviceId' && value) {
      const service = services.find((p) => p.id === value);
      if (service) {
        updated[index].serviceId = service.id;
        updated[index].serviceSlug = service.slug;
        updated[index].name = service.name;
        updated[index].image = service.images[0];
      }
    }

    setFeaturedItems(updated);
  };

  const handleRemoveFeaturedItem = (index: number) => {
    setFeaturedItems(featuredItems.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    // Add a placeholder for new image upload slot
    setImages([...images, '']);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleUpdateImage = (index: number, url: string) => {
    const updated = [...images];
    updated[index] = url;
    setImages(updated);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!slug.trim()) {
      alert('Please enter a slug');
      return;
    }

    if (!description.trim()) {
      alert('Please enter content');
      return;
    }

    if (!categoryId) {
      alert('Please select a category');
      return;
    }

    if (!user) {
      alert('You must be logged in');
      return;
    }

    // Validate slug uniqueness
    const slugUnique = await isSlugUnique(slug, isNew ? undefined : id);
    if (!slugUnique) {
      alert('This slug is already in use. Please choose a different one.');
      return;
    }

    try {
      setSaving(true);

      // Get category name for denormalization
      const selectedCategory = categories.find(c => c.id === categoryId);
      const categoryName = selectedCategory?.name || 'General';

      const postData = {
        title,
        slug,
        excerpt,
        description,
        categoryId,
        categoryName,
        ...(coverImage && { coverImage }), // Only include if not empty
        images: images.filter(img => img.trim() !== ''), // Remove empty image slots
        featuredItems,
        tags,
        ...(metaTitle && { metaTitle }), // Only include if not empty
        ...(metaDescription && { metaDescription }), // Only include if not empty
        isPublished: publish,
        authorId: user.uid,
        authorName: user.name || user.email || 'Admin',
        authorType: 'admin' as const,
      };

      if (isNew) {
        await createContentPost(postData);
        alert('Post created successfully!');
        router.push('/admin/content');
      } else {
        await updateContentPost(id, postData);
        alert('Post updated successfully!');
        router.push('/admin/content');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {isNew ? `New ${contentSettings.sectionName}` : `Edit ${contentSettings.sectionName}`}
        </h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/content')}
            disabled={saving}
          >
            Cancel
          </Button>
          {!isPublished && (
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              loading={saving}
            >
              Save Draft
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => handleSave(true)}
            loading={saving}
          >
            {isPublished ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <Input
            label="Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter a catchy title..."
            required
          />

          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(generateSlug(e.target.value))}
            placeholder="url-friendly-slug"
            helperText="This will be used in the URL"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt (optional)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Short summary for previews..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Write your content here... Use the toolbar to format your text."
            />
            <p className="text-sm text-gray-500 mt-2">
              Use the rich text editor above to create beautifully formatted content with headings, lists, images, and more.
            </p>
          </div>
        </div>
      </Card>

      {/* Images */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Images</h2>

          <SingleImageUploader
            image={coverImage}
            onChange={setCoverImage}
            folder="content"
            label="Cover Image"
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Additional Images
              </label>
              <Button variant="outline" size="sm" onClick={handleAddImage}>
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Image
              </Button>
            </div>
            {images.length > 0 ? (
              <div className="space-y-4">
                {images.map((img, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <SingleImageUploader
                        image={img}
                        onChange={(url) => handleUpdateImage(index, url)}
                        folder="content"
                        label={`Image ${index + 1}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="text-red-600 hover:text-red-700 mt-6"
                      title="Remove this image slot"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No additional images. Click &quot;Add Image&quot; to upload more.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Featured Items */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {contentSettings.itemsLabel}
            </h2>
            <Button variant="outline" size="sm" onClick={handleAddFeaturedItem}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add {contentSettings.itemsLabelSingular}
            </Button>
          </div>

          {featuredItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No items added yet. Click &quot;Add {contentSettings.itemsLabelSingular}&quot; to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {featuredItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link to Service (optional)
                        </label>
                        <select
                          value={item.serviceId || ''}
                          onChange={(e) =>
                            handleUpdateFeaturedItem(index, 'serviceId', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Custom item (not in store)</option>
                          {services.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleRemoveFeaturedItem(index)}
                        className="text-red-600 hover:text-red-700 mt-6"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <Input
                      label="Name"
                      value={item.name}
                      onChange={(e) =>
                        handleUpdateFeaturedItem(index, 'name', e.target.value)
                      }
                      placeholder="Item name"
                      disabled={!!item.serviceId}
                    />

                    <Input
                      label="Quantity/Amount"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        handleUpdateFeaturedItem(index, 'quantity', e.target.value)
                      }
                      placeholder="e.g., 2 cups, 1 pair"
                    />

                    {!item.serviceId && (
                      <SingleImageUploader
                        image={item.image || ''}
                        onChange={(url) => handleUpdateFeaturedItem(index, 'image', url)}
                        folder="content"
                        label="Custom Image (optional)"
                      />
                    )}

                    <Input
                      label="Notes"
                      value={item.notes || ''}
                      onChange={(e) =>
                        handleUpdateFeaturedItem(index, 'notes', e.target.value)
                      }
                      placeholder="Optional notes or substitutions"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Category & Tags */}
      <Card>
        <div className="p-6 space-y-6">
          {/* Category */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No categories found. <Link href="/admin/content-categories" className="text-primary-600 hover:underline">Create one</Link> to get started.
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>

            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
              />
              <Button variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* SEO */}
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">SEO (optional)</h2>

          <Input
            label="Meta Title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Leave empty to use post title"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder="Leave empty to use excerpt"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
