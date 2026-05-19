import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Prospect,
  ProspectNote,
  ProspectStatus,
  ProspectSource,
  CreateProspectData,
} from '@/types/prospect';
import { ContactMessage } from '@/types/contact-message';

const COLLECTION = 'prospects';

export const getProspects = async (): Promise<Prospect[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Prospect[];
  } catch (error) {
    console.error('Error fetching prospects:', error);
    throw error;
  }
};

export const getProspectById = async (id: string): Promise<Prospect | null> => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Prospect;
  } catch (error) {
    console.error('Error fetching prospect:', error);
    throw error;
  }
};

export const createProspect = async (
  data: CreateProspectData,
  createdBy: string
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      name: data.name,
      email: data.email,
      ...(data.phone && { phone: data.phone }),
      ...(data.company && { company: data.company }),
      ...(data.website && { website: data.website }),
      source: data.source,
      status: data.status || ProspectStatus.NEW,
      notes: [],
      estimatedValue: data.estimatedValue || null,
      tags: data.tags || [],
      ...(data.linkedContactMessageId && { linkedContactMessageId: data.linkedContactMessageId }),
      ...(data.nextFollowUpAt && { nextFollowUpAt: data.nextFollowUpAt }),
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating prospect:', error);
    throw error;
  }
};

export const updateProspect = async (
  id: string,
  updates: Partial<Omit<Prospect, 'id' | 'createdAt' | 'createdBy' | 'notes'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating prospect:', error);
    throw error;
  }
};

export const updateProspectStatus = async (
  id: string,
  status: ProspectStatus
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating prospect status:', error);
    throw error;
  }
};

export const deleteProspect = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting prospect:', error);
    throw error;
  }
};

export const addProspectNote = async (
  prospectId: string,
  content: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const note: ProspectNote = {
      id: doc(collection(db, 'temp')).id,
      content,
      createdBy: userId,
      createdByName: userName,
      createdAt: Timestamp.now(),
    };
    await updateDoc(doc(db, COLLECTION, prospectId), {
      notes: arrayUnion(note),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding prospect note:', error);
    throw error;
  }
};

export const convertFromContactMessage = async (
  message: ContactMessage,
  createdBy: string
): Promise<string> => {
  return createProspect(
    {
      name: message.name,
      email: message.email,
      source: ProspectSource.CONTACT_FORM,
      status: ProspectStatus.NEW,
      linkedContactMessageId: message.id,
    },
    createdBy
  );
};
