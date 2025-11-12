import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContentPost, FeaturedItem } from '@/types/content';

/**
 * Get all content posts
 */
export async function getContentPosts(publishedOnly: boolean = true): Promise<ContentPost[]> {
  try {
    const postsRef = collection(db, 'contentPosts');
    let q;

    if (publishedOnly) {
      q = query(
        postsRef,
        where('isPublished', '==', true),
        orderBy('publishedAt', 'desc')
      );
    } else {
      q = query(postsRef, orderBy('updatedAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ContentPost[];
  } catch (error) {
    console.error('Error fetching content posts:', error);
    return [];
  }
}

/**
 * Get a single content post by ID
 */
export async function getContentPostById(id: string): Promise<ContentPost | null> {
  try {
    const postDoc = await getDoc(doc(db, 'contentPosts', id));
    if (!postDoc.exists()) return null;

    return {
      id: postDoc.id,
      ...postDoc.data(),
    } as ContentPost;
  } catch (error) {
    console.error('Error fetching content post:', error);
    return null;
  }
}

/**
 * Get a single content post by slug
 */
export async function getContentPostBySlug(slug: string): Promise<ContentPost | null> {
  try {
    const postsRef = collection(db, 'contentPosts');
    const q = query(postsRef, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as ContentPost;
  } catch (error) {
    console.error('Error fetching content post by slug:', error);
    return null;
  }
}

/**
 * Get content posts by tag
 */
export async function getContentPostsByTag(tag: string): Promise<ContentPost[]> {
  try {
    const postsRef = collection(db, 'contentPosts');
    const q = query(
      postsRef,
      where('isPublished', '==', true),
      where('tags', 'array-contains', tag),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ContentPost[];
  } catch (error) {
    console.error('Error fetching content posts by tag:', error);
    return [];
  }
}

/**
 * Get content posts by author
 */
export async function getContentPostsByAuthor(authorId: string): Promise<ContentPost[]> {
  try {
    const postsRef = collection(db, 'contentPosts');
    const q = query(
      postsRef,
      where('authorId', '==', authorId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ContentPost[];
  } catch (error) {
    console.error('Error fetching content posts by author:', error);
    return [];
  }
}

/**
 * Create a new content post
 */
export async function createContentPost(
  postData: Omit<ContentPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>
): Promise<string> {
  try {
    const postsRef = collection(db, 'contentPosts');
    const newPostRef = doc(postsRef);

    const post: Omit<ContentPost, 'id'> = {
      ...postData,
      viewCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...(postData.isPublished && { publishedAt: Timestamp.now() }),
    };

    await setDoc(newPostRef, post);
    return newPostRef.id;
  } catch (error) {
    console.error('Error creating content post:', error);
    throw error;
  }
}

/**
 * Update an existing content post
 */
export async function updateContentPost(
  id: string,
  updates: Partial<ContentPost>
): Promise<void> {
  try {
    const postRef = doc(db, 'contentPosts', id);

    // If publishing for the first time, set publishedAt
    if (updates.isPublished && !updates.publishedAt) {
      const existingPost = await getContentPostById(id);
      if (existingPost && !existingPost.publishedAt) {
        updates.publishedAt = Timestamp.now();
      }
    }

    await updateDoc(postRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating content post:', error);
    throw error;
  }
}

/**
 * Delete a content post
 */
export async function deleteContentPost(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'contentPosts', id));
  } catch (error) {
    console.error('Error deleting content post:', error);
    throw error;
  }
}

/**
 * Increment view count for a content post
 */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    const postRef = doc(db, 'contentPosts', id);
    await updateDoc(postRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    // Don't throw - view count is not critical
  }
}

/**
 * Check if slug is unique (for validation)
 */
export async function isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  try {
    const postsRef = collection(db, 'contentPosts');
    const q = query(postsRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return true;

    // If we're updating an existing post, exclude it from the check
    if (excludeId) {
      return snapshot.docs.every((doc) => doc.id === excludeId);
    }

    return false;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    return false;
  }
}

/**
 * Generate a URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get all unique tags from content posts
 */
export async function getContentTags(): Promise<string[]> {
  try {
    const posts = await getContentPosts(true);
    const tagsSet = new Set<string>();

    posts.forEach((post) => {
      post.tags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('Error fetching content tags:', error);
    return [];
  }
}
