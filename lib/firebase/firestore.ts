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
  WhereFilterOp,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Generic function to get a document by ID
 */
export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }

    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to get all documents from a collection
 */
export const getDocuments = async <T>(
  collectionName: string,
  conditions?: { field: string; operator: WhereFilterOp; value: unknown }[],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc',
  limitCount?: number
): Promise<T[]> => {
  try {
    let q = query(collection(db, collectionName));

    // Add where conditions
    if (conditions) {
      conditions.forEach((condition) => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
    }

    // Add ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to create a document
 */
export const createDocument = async <T extends { id?: string }>(
  collectionName: string,
  data: T,
  docId?: string
): Promise<string> => {
  try {
    const id = docId || doc(collection(db, collectionName)).id;
    const docRef = doc(db, collectionName, id);

    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to update a document
 */
export const updateDocument = async <T extends Record<string, unknown>>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to delete a document
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};
