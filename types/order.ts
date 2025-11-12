import { Timestamp } from 'firebase/firestore';
import { Address } from './user';

export enum OrderStatus {
  PENDING = 'pending',                // Order placed, awaiting payment
  PAID = 'paid',                      // Payment confirmed
  PROCESSING = 'processing',          // Order being prepared
  READY_FOR_PICKUP = 'ready for pickup',  // Ready for customer pickup
  OUT_FOR_DELIVERY = 'out for delivery',  // Driver is delivering
  DELIVERED = 'delivered',            // Order delivered/picked up
  COMPLETED = 'completed',            // Order completed and closed
  CANCELLED = 'cancelled',            // Order cancelled
  REFUNDED = 'refunded',              // Order refunded
}

export enum FulfillmentType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSku?: string;
  productSlug: string;
  productImage: string;
  vendorId: string;
  vendorName: string;
  price: number;              // Price at time of purchase
  quantity: number;
  unit?: string;              // 'lb', 'oz', 'each', etc.
  subtotal: number;           // price * quantity
  refunded?: boolean;         // If this specific item was refunded
  refundedAmount?: number;    // Amount refunded for this item
  refundedQuantity?: number;  // Quantity refunded (for partial refunds)
}

export interface Order {
  id: string;
  orderNumber: string;        // Human-readable order number (e.g., "ORD-2025-0001")

  // Customer Info
  userId: string;
  userEmail: string;
  userName: string;

  // Items
  items: OrderItem[];

  // Pricing
  subtotal: number;           // Sum of all items
  tax: number;                // Calculated tax
  deliveryFee: number;        // Delivery fee (0 for pickup)
  discount: number;           // Any discounts applied
  total: number;              // Final amount

  // Fulfillment
  fulfillmentType: FulfillmentType;
  deliveryAddress?: Address;  // For delivery orders
  pickupLocation?: string;    // For pickup orders

  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Payment Info
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paymentMethod?: string;         // 'card', 'cash', 'check', etc.
  cardBrand?: string;              // 'visa', 'mastercard', 'amex', 'discover', etc.
  cardLast4?: string;              // Last 4 digits of card
  paymentMethodDetails?: {         // Additional payment details from Stripe
    type: string;                  // Payment method type
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
      funding?: string;            // 'credit', 'debit', 'prepaid'
    };
  };

  // Notes
  customerNotes?: string;     // Notes from customer
  internalNotes?: string;     // Notes from staff (not visible to customer)

  // Tracking
  estimatedPickupTime?: Timestamp;
  estimatedDeliveryTime?: Timestamp;
  actualPickupDate?: Timestamp;
  actualPickupTime?: Timestamp;
  actualDeliveryDate?: Timestamp;
  actualDeliveryTime?: Timestamp;

  // Time Slot
  timeSlotDate?: string;      // Selected time slot date (YYYY-MM-DD)
  timeSlotStartTime?: string; // Selected time slot start time (HH:MM)
  timeSlotEndTime?: string;   // Selected time slot end time (HH:MM)

  // Refund tracking
  refundedAmount?: number;    // Total amount refunded
  refundIds?: string[];       // References to refund documents

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  updatedBy: string;          // userId or 'system'
  updatedByName: string;
  timestamp: Timestamp;
}

// Helper to generate order number
export const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}-${random}`;
};

// Helper to calculate order totals
export const calculateOrderTotals = (
  items: OrderItem[],
  deliveryFee: number = 0,
  taxRate: number = 0.08, // 8% default
  discount: number = 0
): { subtotal: number; tax: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxableAmount = subtotal + deliveryFee - discount;
  const tax = Math.round(taxableAmount * taxRate * 100) / 100;
  const total = subtotal + deliveryFee + tax - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// Helper to get order status display info
export const getOrderStatusInfo = (status: OrderStatus): { label: string; color: string } => {
  const statusMap: Record<OrderStatus, { label: string; color: string }> = {
    [OrderStatus.PENDING]: { label: 'Pending Payment', color: 'gray' },
    [OrderStatus.PAID]: { label: 'Paid', color: 'blue' },
    [OrderStatus.PROCESSING]: { label: 'Processing', color: 'yellow' },
    [OrderStatus.READY_FOR_PICKUP]: { label: 'Ready for Pickup', color: 'green' },
    [OrderStatus.OUT_FOR_DELIVERY]: { label: 'Out for Delivery', color: 'blue' },
    [OrderStatus.DELIVERED]: { label: 'Delivered', color: 'green' },
    [OrderStatus.COMPLETED]: { label: 'Completed', color: 'green' },
    [OrderStatus.CANCELLED]: { label: 'Cancelled', color: 'red' },
    [OrderStatus.REFUNDED]: { label: 'Refunded', color: 'orange' },
  };

  return statusMap[status];
};
