import { Timestamp } from 'firebase/firestore';

export enum RefundStatus {
  PENDING = 'pending',         // Refund requested
  APPROVED = 'approved',       // Refund approved by admin
  PROCESSING = 'processing',   // Refund being processed with Stripe
  COMPLETED = 'completed',     // Refund completed
  REJECTED = 'rejected',       // Refund rejected
  FAILED = 'failed',           // Refund failed (Stripe error)
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'customer_request',
  WRONG_ITEM = 'wrong_item',
  MISSING_ITEM = 'missing_item',
  QUALITY_ISSUE = 'quality_issue',
  LATE_DELIVERY = 'late_delivery',
  OTHER = 'other',
}

export interface RefundItem {
  serviceId: string;
  serviceName: string;
  price: number;              // Original price
  quantity: number;           // Quantity being refunded
  refundAmount: number;       // Total refund for this item
}

export interface Refund {
  id: string;
  refundNumber: string;       // Human-readable (e.g., "REF-2025-0001")

  // Order Reference
  orderId: string;
  orderNumber: string;

  // Customer Info
  userId: string;
  userEmail: string;
  userName: string;

  // Refund Details
  items: RefundItem[];        // Items being refunded
  refundAmount: number;       // Total amount to refund
  refundReason: RefundReason;
  customerExplanation?: string;  // Customer's explanation

  // Status
  status: RefundStatus;

  // Processing Info
  stripeRefundId?: string;    // Stripe refund ID
  processedBy?: string;       // Admin userId who processed
  processedByName?: string;
  adminNotes?: string;        // Internal notes
  rejectionReason?: string;   // Why refund was rejected

  // Timestamps
  createdAt: Timestamp;       // When refund was requested
  updatedAt: Timestamp;
  approvedAt?: Timestamp;
  completedAt?: Timestamp;
  rejectedAt?: Timestamp;
}

// Helper to generate refund number
export const generateRefundNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REF-${year}-${random}`;
};

// Helper to get refund status display info
export const getRefundStatusInfo = (status: RefundStatus): { label: string; color: string } => {
  const statusMap: Record<RefundStatus, { label: string; color: string }> = {
    [RefundStatus.PENDING]: { label: 'Pending Review', color: 'yellow' },
    [RefundStatus.APPROVED]: { label: 'Approved', color: 'blue' },
    [RefundStatus.PROCESSING]: { label: 'Processing', color: 'blue' },
    [RefundStatus.COMPLETED]: { label: 'Completed', color: 'green' },
    [RefundStatus.REJECTED]: { label: 'Rejected', color: 'red' },
    [RefundStatus.FAILED]: { label: 'Failed', color: 'red' },
  };

  return statusMap[status];
};

// Helper to get refund reason display text
export const getRefundReasonText = (reason: RefundReason): string => {
  const reasonMap: Record<RefundReason, string> = {
    [RefundReason.CUSTOMER_REQUEST]: 'Customer Request',
    [RefundReason.WRONG_ITEM]: 'Wrong Item Received',
    [RefundReason.MISSING_ITEM]: 'Missing Item',
    [RefundReason.QUALITY_ISSUE]: 'Quality Issue',
    [RefundReason.LATE_DELIVERY]: 'Late Delivery',
    [RefundReason.OTHER]: 'Other',
  };

  return reasonMap[reason];
};
