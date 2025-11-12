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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContentCategory } from '@/types/content';

/**
 * Get all content categories
 */
export async function getContentCategories(activeOnly: boolean = false): Promise<ContentCategory[]> {
  try {
    const categoriesRef = collection(db, 'contentCategories');
    let q;

    if (activeOnly) {
      q = query(
        categoriesRef,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
    } else {
      q = query(categoriesRef, orderBy('name', 'asc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ContentCategory[];
  } catch (error) {
    console.error('Error fetching content categories:', error);
    return [];
  }
}

/**
 * Get a single content category by ID
 */
export async function getContentCategoryById(id: string): Promise<ContentCategory | null> {
  try {
    const categoryDoc = await getDoc(doc(db, 'contentCategories', id));
    if (!categoryDoc.exists()) return null;

    return {
      id: categoryDoc.id,
      ...categoryDoc.data(),
    } as ContentCategory;
  } catch (error) {
    console.error('Error fetching content category:', error);
    return null;
  }
}

/**
 * Create a new content category
 */
export async function createContentCategory(
  categoryData: Omit<ContentCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const categoriesRef = collection(db, 'contentCategories');
    const newCategoryRef = doc(categoriesRef);

    const category: Omit<ContentCategory, 'id'> = {
      ...categoryData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(newCategoryRef, category);
    return newCategoryRef.id;
  } catch (error) {
    console.error('Error creating content category:', error);
    throw error;
  }
}

/**
 * Update an existing content category
 */
export async function updateContentCategory(
  id: string,
  updates: Partial<ContentCategory>
): Promise<void> {
  try {
    const categoryRef = doc(db, 'contentCategories', id);

    await updateDoc(categoryRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating content category:', error);
    throw error;
  }
}

/**
 * Delete a content category
 */
export async function deleteContentCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'contentCategories', id));
  } catch (error) {
    console.error('Error deleting content category:', error);
    throw error;
  }
}

/**
 * Generate a URL-friendly slug from category name
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a category slug is unique
 */
export async function isCategorySlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  try {
    const categoriesRef = collection(db, 'contentCategories');
    const q = query(categoriesRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return true;

    // If updating, allow the same slug for the same category
    if (excludeId) {
      return snapshot.docs.every((doc) => doc.id === excludeId);
    }

    return false;
  } catch (error) {
    console.error('Error checking category slug uniqueness:', error);
    return false;
  }
}

/**
 * Ensure "General" category exists (create if not)
 */
export async function ensureGeneralCategory(): Promise<string> {
  try {
    const categoriesRef = collection(db, 'contentCategories');
    const q = query(categoriesRef, where('slug', '==', 'general'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create general category
    return await createContentCategory({
      name: 'General',
      slug: 'general',
      description: 'General posts and articles',
      color: '#6B7280', // gray
      isActive: true,
    });
  } catch (error) {
    console.error('Error ensuring general category:', error);
    throw error;
  }
}
