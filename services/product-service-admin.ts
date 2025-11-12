/**
 * Product Service (Admin SDK)
 *
 * This version uses Firebase Admin SDK for server-side operations
 * Use this in API routes, webhooks, and other server-side code
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const PRODUCTS_COLLECTION = 'products';

/**
 * Decrement product stock by a given quantity (Admin SDK)
 */
export const decrementProductStock = async (productId: string, quantity: number): Promise<void> => {
  try {
    const db = getAdminFirestore();
    const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);

    // Use Firestore's increment to atomically decrease stock
    await productRef.update({
      stock: FieldValue.increment(-quantity),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[Admin Product Service] Decremented stock for product ${productId} by ${quantity}`);
  } catch (error) {
    console.error(`[Admin Product Service] Error decrementing stock for product ${productId}:`, error);
    throw error;
  }
};
