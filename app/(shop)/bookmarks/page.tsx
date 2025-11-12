'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getBookmarkedPosts, removeBookmark } from '@/services/content-bookmark-service';
import { ContentPost } from '@/types/content';
import { stripHtml } from '@/lib/utils/html';
import { StarIcon } from '@heroicons/react/24/solid';
import { BookmarkSlashIcon } from '@heroicons/react/24/outline';

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPostId, setProcessingPostId] = useState<string | null>(null);
  const [contentSettings, setContentSettings] = useState<StoreSettings['contentSettings'] | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/bookmarks');
    }
  }, [user, authLoading, router]);

  // Fetch content settings and bookmarked posts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch store settings for content configuration
        const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
        setContentSettings(storeSettings?.contentSettings || null);

        // Fetch bookmarked posts
        const posts = await getBookmarkedPosts(user.uid);
        setBookmarkedPosts(posts);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleRemoveBookmark = async (postId: string) => {
    if (!user) return;

    try {
      setProcessingPostId(postId);
      await removeBookmark(user.uid, postId);
      setBookmarkedPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      alert('Failed to remove bookmark');
    } finally {
      setProcessingPostId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading your bookmarks...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const contentSlug = contentSettings?.urlSlug || 'blog';
  const sectionNamePlural = contentSettings?.sectionNamePlural || 'Blog Posts';

  if (bookmarkedPosts.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookmarks</h1>

            {/* Empty State */}
            <div className="bg-white rounded-lg shadow-sm text-center py-16">
              <div className="text-6xl mb-4">🔖</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No bookmarks yet
              </h2>
              <p className="text-gray-600 mb-6">
                Save {sectionNamePlural.toLowerCase()} you want to read later!
              </p>
              <Link
                href={`/${contentSlug}`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Browse {sectionNamePlural}
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
            <p className="mt-2 text-gray-600">
              {bookmarkedPosts.length} {bookmarkedPosts.length === 1 ? 'post' : 'posts'} saved
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookmarkedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <Link href={`/${contentSlug}/${post.slug}`}>
                  {/* Cover Image */}
                  {post.coverImage && (
                    <div className="relative w-full h-48 bg-gray-100">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt || stripHtml(post.description).slice(0, 150)}...
                    </p>

                    <p className="text-primary-600 font-medium group-hover:underline mb-2">
                      Read More &rarr;
                    </p>

                    {/* Rating */}
                    {post.averageRating !== undefined && post.totalReviews !== undefined && post.totalReviews > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(post.averageRating || 0)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {post.averageRating.toFixed(1)} ({post.totalReviews})
                        </span>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        {contentSettings?.showAuthor && (
                          <>
                            <span>{post.authorName}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>
                          {post.publishedAt
                            ? post.publishedAt.toDate().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Draft'}
                        </span>
                      </div>
                      {contentSettings?.showViewCount && <span>{post.viewCount} views</span>}
                    </div>

                    {/* Category & Tags */}
                    <div className="flex flex-wrap gap-2">
                      {/* Category Badge */}
                      {post.categoryName && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded font-medium">
                          {post.categoryName}
                        </span>
                      )}

                      {/* Tags */}
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>

                {/* Remove Button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => handleRemoveBookmark(post.id)}
                    disabled={processingPostId === post.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700"
                  >
                    <BookmarkSlashIcon className="w-5 h-5" />
                    {processingPostId === post.id ? 'Removing...' : 'Remove Bookmark'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Browsing */}
          <div className="mt-8 text-center">
            <Link
              href={`/${contentSlug}`}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
