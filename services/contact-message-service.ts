import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContactMessage, CreateContactMessageData } from '@/types/contact-message';

const MESSAGES_COLLECTION = 'contactMessages';

// Helper to convert Firestore document to ContactMessage
const docToMessage = (doc: any): ContactMessage => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    isRead: data.isRead ?? false,
    isArchived: data.isArchived ?? false,
    createdAt: data.createdAt,
    readAt: data.readAt,
    readBy: data.readBy,
  };
};

/**
 * Create a new contact message
 */
export const createContactMessage = async (
  messageData: CreateContactMessageData
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...messageData,
      isRead: false,
      isArchived: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating contact message:', error);
    throw error;
  }
};

/**
 * Get a single message by ID
 */
export const getContactMessage = async (
  messageId: string
): Promise<ContactMessage | null> => {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docToMessage(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error getting contact message:', error);
    throw error;
  }
};

/**
 * Get all contact messages (optionally filter by read/archived status)
 */
export const getAllContactMessages = async (options?: {
  unreadOnly?: boolean;
  excludeArchived?: boolean;
}): Promise<ContactMessage[]> => {
  try {
    let q = query(
      collection(db, MESSAGES_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    let messages = querySnapshot.docs.map(docToMessage);

    // Apply filters in memory since we can't use multiple inequality filters
    if (options?.unreadOnly) {
      messages = messages.filter(m => !m.isRead);
    }

    if (options?.excludeArchived) {
      messages = messages.filter(m => !m.isArchived);
    }

    return messages;
  } catch (error) {
    console.error('Error getting contact messages:', error);
    throw error;
  }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(docRef, {
      isRead: true,
      readAt: serverTimestamp(),
      readBy: userId,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

/**
 * Mark a message as unread
 */
export const markMessageAsUnread = async (messageId: string): Promise<void> => {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(docRef, {
      isRead: false,
      readAt: null,
      readBy: null,
    });
  } catch (error) {
    console.error('Error marking message as unread:', error);
    throw error;
  }
};

/**
 * Archive a message
 */
export const archiveMessage = async (messageId: string): Promise<void> => {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(docRef, {
      isArchived: true,
    });
  } catch (error) {
    console.error('Error archiving message:', error);
    throw error;
  }
};

/**
 * Unarchive a message
 */
export const unarchiveMessage = async (messageId: string): Promise<void> => {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(docRef, {
      isArchived: false,
    });
  } catch (error) {
    console.error('Error unarchiving message:', error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteContactMessage = async (messageId: string): Promise<void> => {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting contact message:', error);
    throw error;
  }
};

/**
 * Get count of unread messages
 */
export const getUnreadMessageCount = async (): Promise<number> => {
  try {
    const messages = await getAllContactMessages({ unreadOnly: true, excludeArchived: true });
    return messages.length;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    throw error;
  }
};
