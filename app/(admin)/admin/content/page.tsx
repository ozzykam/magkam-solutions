'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { stripHtml } from '@/lib/utils/html';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { ContentPost } from '@/types/content';
import { getContentPosts, deleteContentPost } from '@/services/content-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function AdminContentPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentSettings, setContentSettings] = useState({
    enabled: true,
    sectionName: 'Blog',
    sectionNamePlural: 'Blog Posts',
    urlSlug: 'blog',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load content settings
      const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data() as StoreSettings;
        if (settings.contentSettings) {
          setContentSettings({
            enabled: settings.contentSettings.enabled,
            sectionName: settings.contentSettings.sectionName,
            sectionNamePlural: settings.contentSettings.sectionNamePlural,
            urlSlug: settings.contentSettings.urlSlug,
          });
        }
      }

      // Load all posts (including drafts)
      const allPosts = await getContentPosts(false);
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await deleteContentPost(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | undefined) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as Date | string);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!contentSettings.enabled) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Feature Disabled</h1>
        <p className="text-gray-600 mb-6">
          The content feature is currently disabled. Enable it in Store Settings to start creating {contentSettings.sectionNamePlural.toLowerCase()}.
        </p>
        <Link href="/admin/settings">
          <Button variant="primary">Go to Settings</Button>
        </Link>
      </div>
    );
  }

  const publishedPosts = posts.filter((p) => p.isPublished);
  const draftPosts = posts.filter((p) => !p.isPublished);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{contentSettings.sectionNamePlural}</h1>
          <p className="text-gray-600 mt-1">
            Manage your {contentSettings.sectionNamePlural.toLowerCase()}
          </p>
        </div>
        <Link href="/admin/content/new">
          <Button variant="primary" size="lg">
            <PlusIcon className="w-5 h-5 mr-2" />
            New {contentSettings.sectionName}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{posts.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{publishedPosts.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-3xl font-bold text-gray-500 mt-2">{draftPosts.length}</p>
          </div>
        </Card>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No {contentSettings.sectionNamePlural.toLowerCase()} yet</p>
            <Link href="/admin/content/new">
              <Button variant="primary">
                Create Your First {contentSettings.sectionName}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Published Posts */}
          {publishedPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Published</h2>
              <div className="grid grid-cols-1 gap-4">
                {publishedPosts.map((post) => (
                  <Card key={post.id}>
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Cover Image */}
                        {post.coverImage && (
                          <div className="flex-shrink-0 w-full sm:w-48 h-48 sm:h-32 relative rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {post.excerpt || stripHtml(post.description).slice(0, 150)}...
                              </p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                <span>By {post.authorName}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{formatDate(post.publishedAt)}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{post.viewCount} views</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{post.featuredItems.length} items</span>
                              </div>
                              {post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {post.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0">
                              <Link href={`/${contentSettings.urlSlug}/${post.slug}`} target="_blank">
                                <Button variant="outline" size="sm">
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/content/${post.id}`}>
                                <Button variant="outline" size="sm">
                                  <PencilIcon className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(post.id, post.title)}
                              >
                                <TrashIcon className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Draft Posts */}
          {draftPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Drafts</h2>
              <div className="grid grid-cols-1 gap-4">
                {draftPosts.map((post) => (
                  <Card key={post.id}>
                    <div className="p-4 sm:p-6 bg-gray-50">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Cover Image */}
                        {post.coverImage && (
                          <div className="flex-shrink-0 w-full sm:w-48 h-48 sm:h-32 relative rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover opacity-75"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                  {post.title}
                                </h3>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                                  DRAFT
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {post.excerpt || post.description.slice(0, 150)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                <span>By {post.authorName}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>Updated {formatDate(post.updatedAt)}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0">
                              <Link href={`/admin/content/${post.id}`}>
                                <Button variant="outline" size="sm">
                                  <PencilIcon className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(post.id, post.title)}
                              >
                                <TrashIcon className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
