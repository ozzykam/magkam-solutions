/**
 * Order Service (Admin SDK)
 *
 * This version uses Firebase Admin SDK for server-side operations
 * Use this in API routes, webhooks, and other server-side code
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '@/types/order';
import { FieldValue } from 'firebase-admin/firestore';

const ORDERS_COLLECTION = 'orders';
const ORDER_STATUS_HISTORY_COLLECTION = 'orderStatusHistory';

/**
 * Get an order by ID (Admin SDK)
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(ORDERS_COLLECTION).doc(orderId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Order;
  } catch (error) {
    console.error('[Admin Order Service] Error fetching order:', error);
    throw error;
  }
};

/**
 * Update payment status (Admin SDK)
 */
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: PaymentStatus,
  stripePaymentIntentId?: string,
  stripeChargeId?: string,
  paymentMethod?: string,
  cardBrand?: string,
  cardLast4?: string,
  paymentMethodDetails?: any
): Promise<void> => {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(ORDERS_COLLECTION).doc(orderId);

    const updates: any = {
      paymentStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (stripePaymentIntentId) {
      updates.stripePaymentIntentId = stripePaymentIntentId;
    }

    if (stripeChargeId) {
      updates.stripeChargeId = stripeChargeId;
    }

    if (paymentMethod) {
      updates.paymentMethod = paymentMethod;
    }

    if (cardBrand) {
      updates.cardBrand = cardBrand;
    }

    if (cardLast4) {
      updates.cardLast4 = cardLast4;
    }

    if (paymentMethodDetails) {
      updates.paymentMethodDetails = paymentMethodDetails;
    }

    await docRef.update(updates);
    console.log('[Admin Order Service] Payment status updated successfully');
  } catch (error) {
    console.error('[Admin Order Service] Error updating payment status:', error);
    throw error;
  }
};

/**
 * Update order status (Admin SDK)
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  note: string,
  updatedBy: string,
  updatedByName: string
): Promise<void> => {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(ORDERS_COLLECTION).doc(orderId);

    const updates: any = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Add specific timestamp fields based on status
    if (status === OrderStatus.DELIVERED) {
      updates.actualDeliveryTime = FieldValue.serverTimestamp();
    } else if (status === OrderStatus.COMPLETED) {
      updates.completedAt = FieldValue.serverTimestamp();
    } else if (status === OrderStatus.CANCELLED) {
      updates.cancelledAt = FieldValue.serverTimestamp();
    }

    await docRef.update(updates);

    // Log status change
    await logOrderStatusChange(orderId, status, note, updatedBy, updatedByName);

    console.log('[Admin Order Service] Order status updated successfully');
  } catch (error) {
    console.error('[Admin Order Service] Error updating order status:', error);
    throw error;
  }
};

/**
 * Log order status change (internal helper)
 */
const logOrderStatusChange = async (
  orderId: string,
  status: OrderStatus,
  note: string,
  updatedBy: string,
  updatedByName: string
): Promise<void> => {
  try {
    const db = getAdminFirestore();
    await db.collection(ORDER_STATUS_HISTORY_COLLECTION).add({
      orderId,
      status,
      note,
      updatedBy,
      updatedByName,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('[Admin Order Service] Error logging status change:', error);
    // Don't throw - logging failure shouldn't break order operations
  }
};
