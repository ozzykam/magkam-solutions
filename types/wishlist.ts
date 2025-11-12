import { Timestamp } from 'firebase/firestore';

/**
 * Wishlist Item
 * Represents a single item in a user's wishlist
 */
export interface WishlistItem {
  id: string;                    // Unique wishlist item ID
  userId: string;                // User who added this item
  productId: string;             // Reference to the product
  productName: string;           // Product name (snapshot)
  productSlug: string;           // Product URL slug
  productImage: string;          // Product image URL
  productPrice: number;          // Price at time of adding

  // Stock tracking
  wasInStockWhenAdded: boolean;  // Was the item in stock when added?
  notifyWhenRestocked: boolean;  // Should user be notified on restock?
  notificationSent?: boolean;    // Has restock notification been sent?
  notificationSentAt?: Timestamp; // When was notification sent?

  // Vendor info (for display)
  vendorId: string;
  vendorName: string;

  // Metadata
  addedAt: Timestamp;            // When was it added to wishlist?
  notes?: string;                // Optional user notes
}

/**
 * Wishlist Document (stored per user)
 * Each user has one wishlist document containing all their items
 */
export interface Wishlist {
  userId: string;
  items: WishlistItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Admin Wishlist Analytics
 * Aggregated data for admin view
 */
export interface WishlistAnalytics {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  currentStock: number;
  isInStock: boolean;

  // Wishlist stats
  totalWishlisted: number;        // Total users who wishlisted this
  waitingForRestock: number;      // Users waiting for restock notification
  notificationsPending: number;   // Users who haven't been notified yet

  // User list for notifications
  users: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    addedAt: Timestamp;
    notificationSent: boolean;
  }>;
}

/**
 * Helper to check if a product is in the user's wishlist
 */
export const isInWishlist = (wishlist: WishlistItem[], productId: string): boolean => {
  return wishlist.some(item => item.productId === productId);
};

/**
 * Helper to get wishlist item by product ID
 */
export const getWishlistItem = (wishlist: WishlistItem[], productId: string): WishlistItem | undefined => {
  return wishlist.find(item => item.productId === productId);
};

/**
 * Helper to count items in wishlist
 */
export const getWishlistCount = (wishlist: WishlistItem[]): number => {
  return wishlist.length;
};

/**
 * Helper to filter out-of-stock items that need restock notifications
 */
export const getRestockNotificationItems = (wishlist: WishlistItem[]): WishlistItem[] => {
  return wishlist.filter(item =>
    item.notifyWhenRestocked &&
    !item.notificationSent &&
    !item.wasInStockWhenAdded
  );
};
