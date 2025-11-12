import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Category } from '@/types/product';

const CATEGORIES_COLLECTION = 'categories';

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get a category by ID
 */
export const getCategoryById = async (categoryId: string): Promise<Category | null> => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Category;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

/**
 * Get a category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('slug', '==', slug)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    throw error;
  }
};

/**
 * Get top-level categories (no parent)
 */
export const getTopLevelCategories = async (): Promise<Category[]> => {
  try {
    // Get all categories and filter client-side for those without parentId
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    const allCategories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];

    // Filter for categories without a parentId
    return allCategories.filter(cat => !cat.parentId);
  } catch (error) {
    console.error('Error fetching top-level categories:', error);
    throw error;
  }
};

/**
 * Get subcategories of a parent category
 */
export const getSubcategories = async (parentId: string): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('parentId', '==', parentId),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
};

/**
 * Create a new category
 */
export const createCategory = async (
  categoryData: Omit<Category, 'id' | 'productCount'>
): Promise<Category> => {
  try {
    let slug = categoryData.slug;

    // If this is a subcategory, prepend parent slug
    if (categoryData.parentId) {
      const parent = await getCategoryById(categoryData.parentId);
      if (parent) {
        slug = `${parent.slug}/${categoryData.slug}`;
      }
    }

    // Clean the data to remove undefined values
    const cleanedData: any = {
      name: categoryData.name,
      slug: slug,
      productCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (categoryData.image) {
      cleanedData.image = categoryData.image;
    }
    if (categoryData.parentId) {
      cleanedData.parentId = categoryData.parentId;
    }

    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), cleanedData);

    return {
      id: docRef.id,
      ...cleanedData,
    } as Category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update a category
 */
export const updateCategory = async (
  categoryId: string,
  updates: Partial<Omit<Category, 'id' | 'productCount'>>
): Promise<void> => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);

    // Clean the updates to remove undefined values
    const cleanedUpdates: any = {
      updatedAt: Timestamp.now(),
    };

    if (updates.name !== undefined) cleanedUpdates.name = updates.name;
    if (updates.slug !== undefined) cleanedUpdates.slug = updates.slug;
    if (updates.image !== undefined && updates.image !== '') {
      cleanedUpdates.image = updates.image;
    }
    if (updates.parentId !== undefined && updates.parentId !== '') {
      cleanedUpdates.parentId = updates.parentId;
    }

    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete a category
 * Note: This will fail if there are products assigned to this category
 */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    // Check if category has subcategories
    const subcategories = await getSubcategories(categoryId);
    if (subcategories.length > 0) {
      throw new Error('Cannot delete category with subcategories. Delete or reassign subcategories first.');
    }

    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

/**
 * Get category hierarchy (categories with their subcategories)
 */
export const getCategoryHierarchy = async (): Promise<(Category & { subcategories: Category[] })[]> => {
  try {
    const topLevel = await getTopLevelCategories();

    const hierarchyPromises = topLevel.map(async (category) => {
      const subcategories = await getSubcategories(category.id);
      return {
        ...category,
        subcategories,
      };
    });

    return await Promise.all(hierarchyPromises);
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
    throw error;
  }
};

/**
 * Increment product count for a category and all parent categories
 */
export const incrementCategoryProductCount = async (categoryId: string): Promise<void> => {
  try {
    const category = await getCategoryById(categoryId);
    if (!category) return;

    // Increment this category
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(docRef, {
      productCount: increment(1),
      updatedAt: Timestamp.now(),
    });

    // If this category has a parent, increment the parent too (recursively)
    if (category.parentId) {
      await incrementCategoryProductCount(category.parentId);
    }
  } catch (error) {
    console.error('Error incrementing category product count:', error);
    throw error;
  }
};

/**
 * Decrement product count for a category and all parent categories
 */
export const decrementCategoryProductCount = async (categoryId: string): Promise<void> => {
  try {
    const category = await getCategoryById(categoryId);
    if (!category) return;

    // Decrement this category
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    if (category.productCount > 0) {
      await updateDoc(docRef, {
          productCount: increment(-1),
          updatedAt: Timestamp.now(),
      });
    }

    // If this category has a parent, decrement the parent too (recursively)
    if (category.parentId) {
      await decrementCategoryProductCount(category.parentId);
    }
  } catch (error) {
    console.error('Error decrementing category product count:', error);
    throw error;
  }
};

/**
 * Get breadcrumb trail for a category (from root to current)
 */
export const getCategoryBreadcrumbs = async (categoryId: string): Promise<Category[]> => {
  try {
    const breadcrumbs: Category[] = [];
    let currentCategory = await getCategoryById(categoryId);

    while (currentCategory) {
      breadcrumbs.unshift(currentCategory); // Add to beginning of array

      if (currentCategory.parentId) {
        currentCategory = await getCategoryById(currentCategory.parentId);
      } else {
        currentCategory = null;
      }
    }

    return breadcrumbs;
  } catch (error) {
    console.error('Error getting category breadcrumbs:', error);
    throw error;
  }
};

/**
 * Get all descendant category IDs (including the category itself and all subcategories recursively)
 */
export const getAllDescendantCategoryIds = async (categoryId: string): Promise<string[]> => {
  try {
    const categoryIds: string[] = [categoryId]; // Include the category itself
    const subcategories = await getSubcategories(categoryId);

    // Recursively get all descendant IDs
    for (const subcat of subcategories) {
      const descendantIds = await getAllDescendantCategoryIds(subcat.id);
      categoryIds.push(...descendantIds);
    }

    return categoryIds;
  } catch (error) {
    console.error('Error getting descendant category IDs:', error);
    throw error;
  }
};
