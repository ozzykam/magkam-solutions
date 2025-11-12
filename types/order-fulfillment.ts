import { Timestamp } from 'firebase/firestore';

export enum FulfillmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ItemFulfillmentStatus {
  PENDING = 'pending',
  ADDED = 'added',
  OUT_OF_STOCK = 'out_of_stock',
  PARTIAL = 'partial',
}

export interface FulfillmentItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku?: string;
  quantityOrdered: number;
  quantityFulfilled: number;
  unitPrice: number;
  status: ItemFulfillmentStatus;
  notes?: string; // For out of stock or partial fulfillment notes
  processedBy?: string; // User ID of grocer who processed this item
  processedByName?: string; // Name of grocer who processed this item
  processedAt?: Timestamp;
}

export interface OrderFulfillment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: FulfillmentStatus;
  items: FulfillmentItem[];
  totalItemsOrdered: number;
  totalItemsFulfilled: number;
  startedBy?: string; // User ID of grocer who started fulfillment
  startedByName?: string; // Name of grocer
  startedAt?: Timestamp;
  completedBy?: string; // User ID of grocer who completed fulfillment
  completedByName?: string; // Name of grocer
  completedAt?: Timestamp;
  notes?: string; // General fulfillment notes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper to calculate total items ordered
export const calculateTotalItemsOrdered = (items: FulfillmentItem[]): number => {
  return items.reduce((total, item) => total + item.quantityOrdered, 0);
};

// Helper to calculate total items fulfilled
export const calculateTotalItemsFulfilled = (items: FulfillmentItem[]): number => {
  return items.reduce((total, item) => total + item.quantityFulfilled, 0);
};

// Helper to check if all items are fulfilled
export const isFullyFulfilled = (items: FulfillmentItem[]): boolean => {
  return items.every(item =>
    item.status === ItemFulfillmentStatus.ADDED &&
    item.quantityFulfilled === item.quantityOrdered
  );
};

// Helper to get fulfillment completion percentage
export const getFulfillmentProgress = (items: FulfillmentItem[]): number => {
  const totalOrdered = calculateTotalItemsOrdered(items);
  const totalFulfilled = calculateTotalItemsFulfilled(items);
  return totalOrdered > 0 ? Math.round((totalFulfilled / totalOrdered) * 100) : 0;
};
