import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { SalesDocument, CreateSalesDocumentData } from '@/types/sales-document';

const COLLECTION = 'salesDocuments';

export const createSalesDocument = async (
  data: CreateSalesDocumentData,
  createdBy: string
): Promise<string> => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    tags: data.tags || [],
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getSalesDocuments = async (): Promise<SalesDocument[]> => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SalesDocument[];
};

export const updateSalesDocument = async (
  id: string,
  updates: Partial<Omit<SalesDocument, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteSalesDocument = async (document: SalesDocument): Promise<void> => {
  if (document.storagePath) {
    try {
      await deleteObject(ref(storage, document.storagePath));
    } catch {
      // File may already be deleted; continue
    }
  }
  await deleteDoc(doc(db, COLLECTION, document.id));
};
