import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContentBookmark } from '@/types/content';
import { getContentPostById } from './content-service';
import { ContentPost } from '@/types/content';

/**
 * Get user's bookmarks
 */
export async function getUserBookmarks(userId: string): Promise<string[]> {
  try {
    const bookmarkDoc = await getDoc(doc(db, 'contentBookmarks', userId));

    if (!bookmarkDoc.exists()) {
      return [];
    }

    const data = bookmarkDoc.data() as ContentBookmark;
    return data.postIds || [];
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }
}

/**
 * Check if a post is bookmarked by user
 */
export async function isPostBookmarked(userId: string, postId: string): Promise<boolean> {
  try {
    const postIds = await getUserBookmarks(userId);
    return postIds.includes(postId);
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
}

/**
 * Add a post to bookmarks
 */
export async function addBookmark(userId: string, postId: string): Promise<void> {
  try {
    const bookmarkRef = doc(db, 'contentBookmarks', userId);
    const bookmarkDoc = await getDoc(bookmarkRef);

    if (bookmarkDoc.exists()) {
      // Update existing bookmarks
      await updateDoc(bookmarkRef, {
        postIds: arrayUnion(postId),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new bookmark document
      const bookmark: ContentBookmark = {
        userId,
        postIds: [postId],
        updatedAt: Timestamp.now(),
      };
      await setDoc(bookmarkRef, bookmark);
    }
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

/**
 * Remove a post from bookmarks
 */
export async function removeBookmark(userId: string, postId: string): Promise<void> {
  try {
    const bookmarkRef = doc(db, 'contentBookmarks', userId);

    await updateDoc(bookmarkRef, {
      postIds: arrayRemove(postId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

/**
 * Toggle bookmark (add if not bookmarked, remove if bookmarked)
 */
export async function toggleBookmark(userId: string, postId: string): Promise<boolean> {
  try {
    const isBookmarked = await isPostBookmarked(userId, postId);

    if (isBookmarked) {
      await removeBookmark(userId, postId);
      return false; // Now not bookmarked
    } else {
      await addBookmark(userId, postId);
      return true; // Now bookmarked
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

/**
 * Get all bookmarked posts with full details
 */
export async function getBookmarkedPosts(userId: string): Promise<ContentPost[]> {
  try {
    const postIds = await getUserBookmarks(userId);

    if (postIds.length === 0) {
      return [];
    }

    // Fetch all bookmarked posts
    const posts = await Promise.all(
      postIds.map(async (postId) => {
        const post = await getContentPostById(postId);
        return post;
      })
    );

    // Filter out null values (deleted posts) and return only published posts
    return posts.filter((post): post is ContentPost => post !== null && post.isPublished);
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error);
    return [];
  }
}
