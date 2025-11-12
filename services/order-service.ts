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
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Order,
  OrderStatus,
  OrderStatusHistory,
  PaymentStatus,
  generateOrderNumber,
} from '@/types/order';
import { sendOrderStatusEmail } from '@/lib/email/email-service';

const ORDERS_COLLECTION = 'orders';
const ORDER_STATUS_HISTORY_COLLECTION = 'orderStatusHistory';

/**
 * Create a new order
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  try {
    const now = Timestamp.now();
    const orderNumber = generateOrderNumber();

    const order = {
      ...orderData,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), order);

    // Log initial status
    await logOrderStatusChange(
      docRef.id,
      orderData.status,
      'Order created',
      orderData.userId,
      orderData.userName
    );

    return {
      id: docRef.id,
      ...order,
    } as Order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Get an order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

/**
 * Get an order by order number
 */
export const getOrderByOrderNumber = async (orderNumber: string): Promise<Order | null> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('orderNumber', '==', orderNumber)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Order;
  } catch (error) {
    console.error('Error fetching order by order number:', error);
    throw error;
  }
};

/**
 * Get orders for a user
 */
export const getUserOrders = async (userId: string, limitCount?: number): Promise<Order[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, ORDERS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

/**
 * Get all orders (admin)
 */
export const getAllOrders = async (status?: OrderStatus, limitCount?: number): Promise<Order[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, ORDERS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  note: string,
  updatedBy: string,
  updatedByName: string
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const updates: Partial<Order> = {
      status,
      updatedAt: Timestamp.now(),
    };

    // Add specific timestamp fields based on status
    if (status === OrderStatus.DELIVERED) {
      updates.actualDeliveryTime = Timestamp.now();
    } else if (status === OrderStatus.COMPLETED) {
      updates.completedAt = Timestamp.now();
    } else if (status === OrderStatus.CANCELLED) {
      updates.cancelledAt = Timestamp.now();
    }

    await updateDoc(docRef, updates);

    // Log status change
    await logOrderStatusChange(orderId, status, note, updatedBy, updatedByName);

    // Send status update email to customer
    await sendOrderStatusUpdateEmail(orderId, status, note);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Update payment status
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
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const updates: Partial<Order> = {
      paymentStatus,
      updatedAt: Timestamp.now(),
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

    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

/**
 * Update payment method manually (for cash/check payments)
 */
export const updateManualPaymentMethod = async (
  orderId: string,
  paymentMethod: 'cash' | 'check' | 'other',
  checkNumber?: string,
  notes?: string
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const updates: Partial<Order> = {
      paymentMethod,
      paymentStatus: PaymentStatus.PAID,
      updatedAt: Timestamp.now(),
    };

    // If it's a check payment, store check number in internal notes
    if (paymentMethod === 'check' && checkNumber) {
      updates.internalNotes = `Check #${checkNumber}${notes ? ` - ${notes}` : ''}`;
    } else if (notes) {
      updates.internalNotes = notes;
    }

    await updateDoc(docRef, updates);

    // Log status change
    await logOrderStatusChange(
      orderId,
      OrderStatus.PAID,
      `Payment confirmed via ${paymentMethod}${checkNumber ? ` (Check #${checkNumber})` : ''}`,
      'admin',
      'Admin'
    );
  } catch (error) {
    console.error('Error updating manual payment method:', error);
    throw error;
  }
};

/**
 * Add internal notes to order
 */
export const addOrderNotes = async (orderId: string, notes: string): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);

    await updateDoc(docRef, {
      internalNotes: notes,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding order notes:', error);
    throw error;
  }
};

/**
 * Update order with refund information
 */
export const addRefundToOrder = async (
  orderId: string,
  refundId: string,
  refundAmount: number
): Promise<void> => {
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const currentRefundAmount = order.refundedAmount || 0;
    const currentRefundIds = order.refundIds || [];

    const updates: Partial<Order> = {
      refundedAmount: currentRefundAmount + refundAmount,
      refundIds: [...currentRefundIds, refundId],
      updatedAt: Timestamp.now(),
    };

    // Check if fully refunded
    if (currentRefundAmount + refundAmount >= order.total) {
      updates.status = OrderStatus.REFUNDED;
      updates.paymentStatus = PaymentStatus.REFUNDED;
    } else {
      updates.paymentStatus = PaymentStatus.PARTIALLY_REFUNDED;
    }

    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error adding refund to order:', error);
    throw error;
  }
};

/**
 * Get order status history
 */
export const getOrderStatusHistory = async (orderId: string): Promise<OrderStatusHistory[]> => {
  try {
    const q = query(
      collection(db, ORDER_STATUS_HISTORY_COLLECTION),
      where('orderId', '==', orderId),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as OrderStatusHistory[];
  } catch (error) {
    console.error('Error fetching order status history:', error);
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
    await addDoc(collection(db, ORDER_STATUS_HISTORY_COLLECTION), {
      orderId,
      status,
      note,
      updatedBy,
      updatedByName,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging status change:', error);
    // Don't throw - logging failure shouldn't break order operations
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  orderId: string,
  reason: string,
  cancelledBy: string,
  cancelledByName: string
): Promise<void> => {
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Only allow cancellation of certain statuses
    if (![OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status)) {
      throw new Error('Order cannot be cancelled at this stage');
    }

    await updateOrderStatus(orderId, OrderStatus.CANCELLED, reason, cancelledBy, cancelledByName);
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * Get orders by date range (admin)
 */
export const getOrdersByDateRange = async (
  startDate: Timestamp,
  endDate: Timestamp
): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
  } catch (error) {
    console.error('Error fetching orders by date range:', error);
    throw error;
  }
};

/**
 * Send order status update email (internal helper)
 * Automatically sends email when order status changes
 */
const sendOrderStatusUpdateEmail = async (
  orderId: string,
  status: OrderStatus,
  note: string
): Promise<void> => {
  try {
    console.log('💌 [Order Service] Attempting to send status update email for order:', orderId);
    // Get order details
    const order = await getOrderById(orderId);
    if (!order || !order.userEmail) {
      console.log('❌ [Order Service] Order or email not found, skipping status email');
      return;
    }
    console.log('💌 [Order Service] Order found, recipient:', order.userEmail);

    // Only send emails for certain status changes
    const emailableStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ];

    if (!emailableStatuses.includes(status)) {
      console.log(`ℹ️ [Order Service] Status ${status} does not trigger email`);
      return;
    }

    console.log(`💌 [Order Service] Status ${status} should trigger email, preparing to send...`);

    // Generate status-specific message
    const statusMessages: Record<OrderStatus, { message: string; trackingInfo?: string }> = {
      [OrderStatus.PAID]: {
        message: 'Your order has been confirmed and is being prepared!',
        trackingInfo: 'We\'ll notify you when your order is ready.',
      },
      [OrderStatus.PROCESSING]: {
        message: 'Your order is currently being prepared by our team.',
        trackingInfo: 'We\'ll let you know as soon as it\'s ready.',
      },
      [OrderStatus.READY_FOR_PICKUP]: {
        message: 'Your order is ready for pickup!',
        trackingInfo: order.fulfillmentType === 'pickup'
          ? `Please pick up your order at ${order.timeSlotDate || 'your scheduled time'}.`
          : undefined,
      },
      [OrderStatus.OUT_FOR_DELIVERY]: {
        message: 'Your order is out for delivery!',
        trackingInfo: order.fulfillmentType === 'delivery'
          ? `Expected delivery: ${order.timeSlotDate || 'Today'}`
          : undefined,
      },
      [OrderStatus.DELIVERED]: {
        message: 'Your order has been delivered!',
        trackingInfo: 'Thank you for shopping with us!',
      },
      [OrderStatus.COMPLETED]: {
        message: 'Your order is complete!',
        trackingInfo: 'We hope you enjoyed your purchase. Please leave a review!',
      },
      [OrderStatus.CANCELLED]: {
        message: 'Your order has been cancelled.',
        trackingInfo: note || 'If you have questions, please contact support.',
      },
      // Default messages for other statuses
      [OrderStatus.PENDING]: { message: '' },
      [OrderStatus.REFUNDED]: { message: '' },
    };

    const statusInfo = statusMessages[status];

    // Send the email
    console.log(`💌 [Order Service] Calling sendOrderStatusEmail...`);
    const emailSent = await sendOrderStatusEmail(order.userEmail, {
      orderNumber: order.orderNumber,
      customerName: order.userName,
      status: status.toLowerCase().replace(/_/g, ' '),
      statusMessage: statusInfo.message,
      trackingInfo: statusInfo.trackingInfo,
    });

    if (emailSent) {
      console.log(`✅ [Order Service] Order status email sent to ${order.userEmail} for order ${order.orderNumber}`);
    } else {
      console.error(`❌ [Order Service] Failed to send order status email to ${order.userEmail}`);
    }
  } catch (error) {
    console.error('Error sending order status email:', error);
    // Don't throw - email failure shouldn't break order operations
  }
};
