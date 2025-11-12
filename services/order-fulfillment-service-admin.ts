/**
 * Order Fulfillment Service (Admin SDK)
 *
 * This version uses Firebase Admin SDK for server-side operations
 * Use this in API routes, webhooks, and other server-side code
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  OrderFulfillment,
  FulfillmentItem,
  FulfillmentStatus,
  ItemFulfillmentStatus,
  calculateTotalItemsOrdered,
} from '@/types/order-fulfillment';
import { Order } from '@/types/order';

const FULFILLMENTS_COLLECTION = 'orderFulfillments';

/**
 * Create a new order fulfillment document from an order (Admin SDK)
 */
export const createOrderFulfillment = async (
  order: Order
): Promise<OrderFulfillment> => {
  try {
    const db = getAdminFirestore();

    console.log('[Admin Fulfillment Service] Creating fulfillment for order:', order.id);

    // Map order items to fulfillment items
    const fulfillmentItems: FulfillmentItem[] = order.items.map(item => {
      const cleanItem: any = {
        productId: item.productId,
        productName: item.productName,
        quantityOrdered: item.quantity,
        quantityFulfilled: 0,
        unitPrice: item.price,
        status: ItemFulfillmentStatus.PENDING,
      };

      // Only add optional fields if they have values
      if (item.productImage) cleanItem.productImage = item.productImage;
      if (item.productSku) cleanItem.sku = item.productSku;

      return cleanItem as FulfillmentItem;
    });

    const totalItemsOrdered = calculateTotalItemsOrdered(fulfillmentItems);

    const fulfillmentData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.userId,
      customerName: order.userName,
      status: FulfillmentStatus.PENDING,
      items: fulfillmentItems,
      totalItemsOrdered,
      totalItemsFulfilled: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(FULFILLMENTS_COLLECTION).add(fulfillmentData);

    console.log('[Admin Fulfillment Service] Fulfillment created successfully:', docRef.id);

    return {
      id: docRef.id,
      ...fulfillmentData,
    } as any; // Type assertion needed due to FieldValue timestamp
  } catch (error) {
    console.error('[Admin Fulfillment Service] Error creating order fulfillment:', error);
    throw error;
  }
};
