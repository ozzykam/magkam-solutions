import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  StoreSettings,
  DEFAULT_STORE_SETTINGS,
} from '@/types/business-info';

const SETTINGS_COLLECTION = 'storeSettings';
const SETTINGS_DOC_ID = 'main';

/**
 * Get store settings (or create default if doesn't exist)
 */
export const getStoreSettings = async (): Promise<StoreSettings> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as StoreSettings;
    }

    // Create default settings if they don't exist (only at runtime, not during build)
    const defaultSettings: StoreSettings = {
      id: SETTINGS_DOC_ID,
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: Timestamp.now(),
    };

    // Try to create the document, but don't fail if offline
    try {
      await setDoc(docRef, defaultSettings);
    } catch (writeError) {
      console.warn('Could not create default settings (build time):', writeError);
    }

    return defaultSettings;
  } catch (error) {
    console.error('Error getting store settings, returning defaults:', error);
    // Return defaults during build when Firebase is unavailable
    return {
      id: SETTINGS_DOC_ID,
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: Timestamp.now(),
    };
  }
};

/**
 * Update store settings (admin only)
 */
export const updateStoreSettings = async (
  updates: Partial<Omit<StoreSettings, 'id' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating store settings:', error);
    throw error;
  }
};
