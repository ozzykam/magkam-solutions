/**
 * Business Info Service (Admin SDK)
 *
 * This version uses Firebase Admin SDK for server-side operations
 * Use this in API routes, webhooks, and other server-side code
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { StoreSettings } from '@/types/business-info';

const SETTINGS_COLLECTION = 'storeSettings';
const SETTINGS_DOC_ID = 'main';

/**
 * Get store settings (Admin SDK)
 */
export const getStoreSettings = async (): Promise<StoreSettings | null> => {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as StoreSettings;
  } catch (error) {
    console.error('[Admin Business Info Service] Error getting store settings:', error);
    throw error;
  }
};
