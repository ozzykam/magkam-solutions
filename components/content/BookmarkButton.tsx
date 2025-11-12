'use client';

import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toggleBookmark, isPostBookmarked } from '@/services/content-bookmark-service';

interface BookmarkButtonProps {
  postId: string;
  postTitle: string;
  variant?: 'default' | 'large';
}

export default function BookmarkButton({ postId, postTitle, variant = 'default' }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkBookmarkStatus = useCallback(async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      setChecking(true);
      const bookmarked = await isPostBookmarked(user.uid, postId);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    } finally {
      setChecking(false);
    }
  }, [user, postId]);

  useEffect(() => {
    checkBookmarkStatus();
  }, [checkBookmarkStatus]);

  const handleToggle = async () => {
    if (!user) {
      alert('Please sign in to bookmark posts');
      return;
    }

    try {
      setLoading(true);
      const newStatus = await toggleBookmark(user.uid, postId);
      setIsBookmarked(newStatus);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return null; // Or a loading skeleton
  }

  if (variant === 'large') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        title={isBookmarked ? `Remove "${postTitle}" from bookmarks` : `Bookmark "${postTitle}"`}
      >
        {isBookmarked ? (
          <BookmarkIconSolid className="w-5 h-5 text-primary-600" />
        ) : (
          <BookmarkIcon className="w-5 h-5 text-gray-600" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all disabled:opacity-50"
      title={isBookmarked ? `Remove "${postTitle}" from bookmarks` : `Bookmark "${postTitle}"`}
    >
      {isBookmarked ? (
        <BookmarkIconSolid className="w-6 h-6 text-primary-600" />
      ) : (
        <BookmarkIcon className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );
}
