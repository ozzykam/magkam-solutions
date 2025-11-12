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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Tag, CreateTagData, UpdateTagData } from '@/types/tag';

const TAGS_COLLECTION = 'tags';

// Helper to convert Firestore document to Tag
const docToTag = (doc: any): Tag => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    imageUrl: data.imageUrl,
    description: data.description,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Create a new tag
export const createTag = async (tagData: CreateTagData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, TAGS_COLLECTION), {
      ...tagData,
      isActive: tagData.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

// Get a single tag by ID
export const getTag = async (tagId: string): Promise<Tag | null> => {
  try {
    const docRef = doc(db, TAGS_COLLECTION, tagId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docToTag(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error getting tag:', error);
    throw error;
  }
};

// Get a tag by slug
export const getTagBySlug = async (slug: string): Promise<Tag | null> => {
  try {
    const q = query(
      collection(db, TAGS_COLLECTION),
      where('slug', '==', slug)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return docToTag(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error getting tag by slug:', error);
    throw error;
  }
};

// Get all tags
export const getAllTags = async (activeOnly: boolean = false): Promise<Tag[]> => {
  try {
    let q = query(collection(db, TAGS_COLLECTION), orderBy('name', 'asc'));

    if (activeOnly) {
      q = query(
        collection(db, TAGS_COLLECTION),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToTag);
  } catch (error) {
    console.error('Error getting tags:', error);
    throw error;
  }
};

// Update a tag
export const updateTag = async (
  tagId: string,
  updates: UpdateTagData
): Promise<void> => {
  try {
    const docRef = doc(db, TAGS_COLLECTION, tagId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
};

// Delete a tag
export const deleteTag = async (tagId: string): Promise<void> => {
  try {
    const docRef = doc(db, TAGS_COLLECTION, tagId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

// Toggle tag active status
export const toggleTagStatus = async (tagId: string, isActive: boolean): Promise<void> => {
  try {
    await updateTag(tagId, { isActive });
  } catch (error) {
    console.error('Error toggling tag status:', error);
    throw error;
  }
};

// Check if slug exists (useful for validation)
export const checkSlugExists = async (slug: string, excludeId?: string): Promise<boolean> => {
  try {
    const tag = await getTagBySlug(slug);
    if (!tag) return false;
    if (excludeId && tag.id === excludeId) return false;
    return true;
  } catch (error) {
    console.error('Error checking slug:', error);
    throw error;
  }
};
