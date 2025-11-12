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
import { Refund, RefundStatus, generateRefundNumber } from '@/types/refund';
import { addRefundToOrder } from './order-service';

const REFUNDS_COLLECTION = 'refunds';

/**
 * Create a refund request
 */
export const createRefund = async (
  refundData: Omit<Refund, 'id' | 'refundNumber' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<Refund> => {
  try {
    const now = Timestamp.now();
    const refundNumber = generateRefundNumber();

    const refund = {
      ...refundData,
      refundNumber,
      status: RefundStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, REFUNDS_COLLECTION), refund);

    return {
      id: docRef.id,
      ...refund,
    } as Refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
};

/**
 * Get a refund by ID
 */
export const getRefundById = async (refundId: string): Promise<Refund | null> => {
  try {
    const docRef = doc(db, REFUNDS_COLLECTION, refundId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Refund;
  } catch (error) {
    console.error('Error fetching refund:', error);
    throw error;
  }
};

/**
 * Get refunds for an order
 */
export const getOrderRefunds = async (orderId: string): Promise<Refund[]> => {
  try {
    const q = query(
      collection(db, REFUNDS_COLLECTION),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Refund[];
  } catch (error) {
    console.error('Error fetching order refunds:', error);
    throw error;
  }
};

/**
 * Get refunds for a user
 */
export const getUserRefunds = async (userId: string): Promise<Refund[]> => {
  try {
    const q = query(
      collection(db, REFUNDS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Refund[];
  } catch (error) {
    console.error('Error fetching user refunds:', error);
    throw error;
  }
};

/**
 * Get all refunds by status (admin)
 */
export const getRefundsByStatus = async (status: RefundStatus): Promise<Refund[]> => {
  try {
    const q = query(
      collection(db, REFUNDS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Refund[];
  } catch (error) {
    console.error('Error fetching refunds by status:', error);
    throw error;
  }
};

/**
 * Get all pending refunds (admin)
 */
export const getPendingRefunds = async (): Promise<Refund[]> => {
  return getRefundsByStatus(RefundStatus.PENDING);
};

/**
 * Approve a refund (admin)
 */
export const approveRefund = async (
  refundId: string,
  processedBy: string,
  processedByName: string,
  adminNotes?: string
): Promise<void> => {
  try {
    const docRef = doc(db, REFUNDS_COLLECTION, refundId);

    await updateDoc(docRef, {
      status: RefundStatus.APPROVED,
      approvedAt: Timestamp.now(),
      processedBy,
      processedByName,
      adminNotes,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error approving refund:', error);
    throw error;
  }
};

/**
 * Reject a refund (admin)
 */
export const rejectRefund = async (
  refundId: string,
  rejectionReason: string,
  processedBy: string,
  processedByName: string,
  adminNotes?: string
): Promise<void> => {
  try {
    const docRef = doc(db, REFUNDS_COLLECTION, refundId);

    await updateDoc(docRef, {
      status: RefundStatus.REJECTED,
      rejectedAt: Timestamp.now(),
      rejectionReason,
      processedBy,
      processedByName,
      adminNotes,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error rejecting refund:', error);
    throw error;
  }
};

/**
 * Process refund with Stripe
 * This should be called after approving a refund
 */
export const processStripeRefund = async (
  refundId: string,
  stripeRefundId: string
): Promise<void> => {
  try {
    const docRef = doc(db, REFUNDS_COLLECTION, refundId);

    await updateDoc(docRef, {
      status: RefundStatus.PROCESSING,
      stripeRefundId,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error processing Stripe refund:', error);
    throw error;
  }
};

/**
 * Complete a refund
 * Called after Stripe confirms the refund
 */
export const completeRefund = async (refundId: string): Promise<void> => {
  try {
    const refund = await getRefundById(refundId);
    if (!refund) {
      throw new Error('Refund not found');
    }

    const docRef = doc(db, REFUNDS_COLLECTION, refundId);

    await updateDoc(docRef, {
      status: RefundStatus.COMPLETED,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update the order with refund information
    await addRefundToOrder(refund.orderId, refundId, refund.refundAmount);
  } catch (error) {
    console.error('Error completing refund:', error);
    throw error;
  }
};

/**
 * Mark refund as failed
 */
export const failRefund = async (refundId: string, errorMessage: string): Promise<void> => {
  try {
    const docRef = doc(db, REFUNDS_COLLECTION, refundId);

    await updateDoc(docRef, {
      status: RefundStatus.FAILED,
      adminNotes: `Failed: ${errorMessage}`,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error failing refund:', error);
    throw error;
  }
};

/**
 * Get refund statistics (admin)
 */
export const getRefundStats = async (): Promise<{
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  totalAmount: number;
}> => {
  try {
    const snapshot = await getDocs(collection(db, REFUNDS_COLLECTION));
    const refunds = snapshot.docs.map(doc => doc.data() as Refund);

    const stats = {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      totalAmount: 0,
    };

    refunds.forEach(refund => {
      switch (refund.status) {
        case RefundStatus.PENDING:
          stats.pending++;
          break;
        case RefundStatus.APPROVED:
        case RefundStatus.PROCESSING:
          stats.approved++;
          break;
        case RefundStatus.COMPLETED:
          stats.completed++;
          stats.totalAmount += refund.refundAmount;
          break;
        case RefundStatus.REJECTED:
          stats.rejected++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting refund stats:', error);
    throw error;
  }
};

/**
 * Check if an order has any pending refunds
 */
export const hasOrderPendingRefund = async (orderId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, REFUNDS_COLLECTION),
      where('orderId', '==', orderId),
      where('status', 'in', [RefundStatus.PENDING, RefundStatus.APPROVED, RefundStatus.PROCESSING])
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking order pending refund:', error);
    throw error;
  }
};
