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
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Client, ClientNote, ClientStatus, CreateClientData } from '@/types/client';
import { Prospect, ProspectStatus } from '@/types/prospect';

const COLLECTION = 'clients';

export const getClients = async (): Promise<Client[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Client;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

export const createClient = async (
  data: CreateClientData,
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
      status: data.status || ClientStatus.ACTIVE,
      notes: [],
      ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
      tags: data.tags || [],
      ...(data.sourceProspectId && { sourceProspectId: data.sourceProspectId }),
      ...(data.linkedUserId && { linkedUserId: data.linkedUserId }),
      ...(data.originalSource && { originalSource: data.originalSource }),
      ...(data.prospectCreatedAt && { prospectCreatedAt: data.prospectCreatedAt }),
      ...(data.convertedAt && { convertedAt: data.convertedAt }),
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (
  id: string,
  updates: Partial<Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'notes' | 'sourceProspectId'>>
): Promise<void> => {
  try {
    // Firestore's updateDoc() rejects explicit `undefined` values (e.g. a cleared
    // optional field like estimatedValue) — convert those to deleteField() instead.
    const sanitized = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [key, value === undefined ? deleteField() : value])
    );
    await updateDoc(doc(db, COLLECTION, id), {
      ...sanitized,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

export const addClientNote = async (
  clientId: string,
  content: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const note: ClientNote = {
      id: doc(collection(db, 'temp')).id,
      content,
      createdBy: userId,
      createdByName: userName,
      createdAt: Timestamp.now(),
    };
    await updateDoc(doc(db, COLLECTION, clientId), {
      notes: arrayUnion(note),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding client note:', error);
    throw error;
  }
};

/**
 * Convert a Prospect into a permanent Client record.
 *
 * Batched write: both documents must succeed or fail together to keep the permanent
 * Client record and the archived-Prospect back-reference in sync — this is the one
 * place in the codebase that uses a Firestore transaction/batch instead of sequential
 * awaited calls, because a partial failure here would corrupt the audit trail this
 * feature exists to protect.
 */
export const convertProspectToClient = async (
  prospectId: string,
  additionalData: Partial<Pick<CreateClientData, 'status' | 'estimatedValue' | 'tags'>>,
  userId: string
): Promise<string> => {
  try {
    const prospectSnap = await getDoc(doc(db, 'prospects', prospectId));
    if (!prospectSnap.exists()) {
      throw new Error('Prospect not found');
    }
    const prospect = { id: prospectSnap.id, ...prospectSnap.data() } as Prospect;
    if (prospect.archived) {
      throw new Error('Prospect has already been converted to a client');
    }

    const now = Timestamp.now();
    const clientRef = doc(collection(db, COLLECTION));

    const estimatedValue = additionalData.estimatedValue ?? prospect.estimatedValue;

    const newClient = {
      id: clientRef.id,
      name: prospect.name,
      email: prospect.email,
      ...(prospect.phone && { phone: prospect.phone }),
      ...(prospect.company && { company: prospect.company }),
      ...(prospect.website && { website: prospect.website }),
      status: additionalData.status ?? ClientStatus.ACTIVE,
      notes: prospect.notes as unknown as ClientNote[],
      ...(estimatedValue !== undefined && { estimatedValue }),
      tags: additionalData.tags ?? prospect.tags,
      sourceProspectId: prospect.id,
      originalSource: prospect.source,
      prospectCreatedAt: prospect.createdAt,
      convertedAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    const batch = writeBatch(db);
    batch.set(clientRef, newClient);
    batch.update(doc(db, 'prospects', prospectId), {
      status: ProspectStatus.WON,
      archived: true,
      archivedAt: now,
      convertedClientId: clientRef.id,
      updatedAt: now,
    });
    await batch.commit();

    return clientRef.id;
  } catch (error) {
    console.error('Error converting prospect to client:', error);
    throw error;
  }
};
