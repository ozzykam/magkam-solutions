import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  OrderFulfillment,
  FulfillmentItem,
  FulfillmentStatus,
  ItemFulfillmentStatus,
  calculateTotalItemsOrdered,
  calculateTotalItemsFulfilled,
  isFullyFulfilled,
} from '@/types/order-fulfillment';
import { Order } from '@/types/order';

const FULFILLMENTS_COLLECTION = 'orderFulfillments';

/**
 * Clean item update data to remove undefined values for Firestore
 */
const cleanItemUpdate = (baseItem: FulfillmentItem, updates: {
  quantityFulfilled: number;
  status: ItemFulfillmentStatus;
  notes?: string;
  processedBy: string;
  processedByName: string;
}): FulfillmentItem => {
  const cleanedItem: any = {
    ...baseItem,
    quantityFulfilled: updates.quantityFulfilled,
    status: updates.status,
    processedBy: updates.processedBy,
    processedByName: updates.processedByName,
    processedAt: Timestamp.now(),
  };

  // Only add notes if they exist
  if (updates.notes) {
    cleanedItem.notes = updates.notes;
  }

  return cleanedItem as FulfillmentItem;
};

/**
 * Create a new order fulfillment document from an order
 */
export const createOrderFulfillment = async (
  order: Order
): Promise<OrderFulfillment> => {
  try {
    // Map order items to fulfillment items, cleaning undefined values
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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, FULFILLMENTS_COLLECTION),
      fulfillmentData
    );

    return {
      id: docRef.id,
      ...fulfillmentData,
    } as OrderFulfillment;
  } catch (error) {
    console.error('Error creating order fulfillment:', error);
    throw error;
  }
};

/**
 * Get fulfillment by ID
 */
export const getFulfillmentById = async (
  fulfillmentId: string
): Promise<OrderFulfillment | null> => {
  try {
    const docRef = doc(db, FULFILLMENTS_COLLECTION, fulfillmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as OrderFulfillment;
  } catch (error) {
    console.error('Error fetching fulfillment:', error);
    throw error;
  }
};

/**
 * Get fulfillment by order ID
 */
export const getFulfillmentByOrderId = async (
  orderId: string
): Promise<OrderFulfillment | null> => {
  try {
    const q = query(
      collection(db, FULFILLMENTS_COLLECTION),
      where('orderId', '==', orderId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as OrderFulfillment;
  } catch (error: any) {
    // Handle permission errors gracefully - return null if no access
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      console.warn(`No fulfillment access for order ${orderId} - this may be expected if fulfillment doesn't exist yet`);
      return null;
    }
    console.error('Error fetching fulfillment by order ID:', error);
    throw error;
  }
};

/**
 * Get all fulfillments (admin)
 */
export const getAllFulfillments = async (
  status?: FulfillmentStatus
): Promise<OrderFulfillment[]> => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, FULFILLMENTS_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, FULFILLMENTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as OrderFulfillment[];
  } catch (error) {
    console.error('Error fetching all fulfillments:', error);
    throw error;
  }
};

/**
 * Start fulfillment process
 */
export const startFulfillment = async (
  fulfillmentId: string,
  grocerId: string,
  grocerName: string
): Promise<void> => {
  try {
    const docRef = doc(db, FULFILLMENTS_COLLECTION, fulfillmentId);

    await updateDoc(docRef, {
      status: FulfillmentStatus.IN_PROGRESS,
      startedBy: grocerId,
      startedByName: grocerName,
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error starting fulfillment:', error);
    throw error;
  }
};

/**
 * Update a single item in fulfillment
 */
export const updateFulfillmentItem = async (
  fulfillmentId: string,
  itemIndex: number,
  updates: {
    quantityFulfilled: number;
    status: ItemFulfillmentStatus;
    notes?: string;
    processedBy: string;
    processedByName: string;
  }
): Promise<void> => {
  try {
    // Get current fulfillment
    const fulfillment = await getFulfillmentById(fulfillmentId);
    if (!fulfillment) {
      throw new Error('Fulfillment not found');
    }

    // Update the specific item
    const updatedItems = [...fulfillment.items];
    updatedItems[itemIndex] = cleanItemUpdate(updatedItems[itemIndex], updates);

    // Recalculate totals
    const totalItemsFulfilled = calculateTotalItemsFulfilled(updatedItems);

    // Check if all items are fulfilled
    const allFulfilled = isFullyFulfilled(updatedItems);

    const docRef = doc(db, FULFILLMENTS_COLLECTION, fulfillmentId);

    const updateData: any = {
      items: updatedItems,
      totalItemsFulfilled,
      updatedAt: Timestamp.now(),
    };

    // If all items are fulfilled, mark as completed
    if (allFulfilled) {
      updateData.status = FulfillmentStatus.COMPLETED;
      updateData.completedBy = updates.processedBy;
      updateData.completedByName = updates.processedByName;
      updateData.completedAt = Timestamp.now();
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating fulfillment item:', error);
    throw error;
  }
};

/**
 * Complete fulfillment manually
 */
export const completeFulfillment = async (
  fulfillmentId: string,
  grocerId: string,
  grocerName: string,
  notes?: string
): Promise<void> => {
  try {
    const docRef = doc(db, FULFILLMENTS_COLLECTION, fulfillmentId);

    const updateData: any = {
      status: FulfillmentStatus.COMPLETED,
      completedBy: grocerId,
      completedByName: grocerName,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error completing fulfillment:', error);
    throw error;
  }
};

/**
 * Cancel fulfillment
 */
export const cancelFulfillment = async (
  fulfillmentId: string,
  reason?: string
): Promise<void> => {
  try {
    const docRef = doc(db, FULFILLMENTS_COLLECTION, fulfillmentId);

    const updateData: any = {
      status: FulfillmentStatus.CANCELLED,
      updatedAt: Timestamp.now(),
    };

    if (reason) {
      updateData.notes = reason;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error cancelling fulfillment:', error);
    throw error;
  }
};

/**
 * Add notes to fulfillment
 */
export const addFulfillmentNotes = async (
  fulfillmentId: string,
  notes: string
): Promise<void> => {
  try {
    const docRef = doc(db, FULFILLMENTS_COLLECTION, fulfillmentId);

    await updateDoc(docRef, {
      notes,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding fulfillment notes:', error);
    throw error;
  }
};
