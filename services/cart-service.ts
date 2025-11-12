import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SavedCart, CartItem, calculateCartTotals } from '@/types/cart';

const SAVED_CARTS_COLLECTION = 'savedCarts';

/**
 * Clean cart items to remove undefined values for Firestore
 */
const cleanCartItems = (items: CartItem[]): CartItem[] => {
  return items.map(item => {
    const cleanedItem: any = {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      quantity: item.quantity,
      price: item.price,
      stock: item.stock,
      subtotal: item.subtotal,
    };

    // Only add optional fields if they have values
    if (item.productSku !== undefined && item.productSku !== null) {
      cleanedItem.productSku = item.productSku;
    }
    if (item.salePrice !== undefined && item.salePrice !== null) {
      cleanedItem.salePrice = item.salePrice;
    }
    if (item.image !== undefined && item.image !== null) {
      cleanedItem.image = item.image;
    }
    if (item.unit !== undefined && item.unit !== null) {
      cleanedItem.unit = item.unit;
    }
    if (item.vendorId !== undefined && item.vendorId !== null) {
      cleanedItem.vendorId = item.vendorId;
    }
    if (item.vendorName !== undefined && item.vendorName !== null) {
      cleanedItem.vendorName = item.vendorName;
    }

    return cleanedItem as CartItem;
  });
};

/**
 * Save cart to Firestore (for logged-in users)
 * Creates a new cart or updates existing one
 */
export const saveCart = async (
  userId: string,
  items: CartItem[]
): Promise<SavedCart> => {
  try {
    const cleanedItems = cleanCartItems(items);
    const { subtotal, itemCount } = calculateCartTotals(cleanedItems);
    const now = Timestamp.now();

    // Check if user already has a saved cart
    const existingCart = await getSavedCart(userId);

    // Use userId as the document ID (required by security rules)
    const docRef = doc(db, SAVED_CARTS_COLLECTION, userId);

    const cartData = {
      userId,
      items: cleanedItems,
      subtotal,
      itemCount,
      updatedAt: now,
      ...(existingCart ? {} : { createdAt: now }),
    };

    await setDoc(docRef, cartData, { merge: true });

    return {
      id: userId,
      ...cartData,
      createdAt: existingCart?.createdAt || now,
    } as SavedCart;
  } catch (error) {
    console.error('Error saving cart:', error);
    throw error;
  }
};

/**
 * Get saved cart for a user
 */
export const getSavedCart = async (userId: string): Promise<SavedCart | null> => {
  try {
    // Use userId as document ID (matches security rules)
    const docRef = doc(db, SAVED_CARTS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as SavedCart;
  } catch (error) {
    console.error('Error fetching saved cart:', error);
    throw error;
  }
};

/**
 * Merge local cart with saved cart
 * Used when user logs in and has items in local storage
 */
export const mergeLocalCart = async (
  userId: string,
  localItems: CartItem[]
): Promise<SavedCart> => {
  try {
    const savedCart = await getSavedCart(userId);

    if (!savedCart) {
      // No saved cart exists, just save local items
      return saveCart(userId, localItems);
    }

    // Merge logic: combine items, update quantities for duplicates
    const mergedItems = [...savedCart.items];

    localItems.forEach(localItem => {
      const existingItemIndex = mergedItems.findIndex(
        item => item.productId === localItem.productId
      );

      if (existingItemIndex >= 0) {
        // Item exists, add quantities
        mergedItems[existingItemIndex].quantity += localItem.quantity;
        mergedItems[existingItemIndex].subtotal =
          mergedItems[existingItemIndex].quantity *
          (mergedItems[existingItemIndex].salePrice ?? mergedItems[existingItemIndex].price);
      } else {
        // New item, add to cart
        mergedItems.push(localItem);
      }
    });

    return saveCart(userId, mergedItems);
  } catch (error) {
    console.error('Error merging local cart:', error);
    throw error;
  }
};

/**
 * Update item quantity in saved cart
 */
export const updateCartItemQuantity = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<void> => {
  try {
    const savedCart = await getSavedCart(userId);
    if (!savedCart) {
      throw new Error('Cart not found');
    }

    const updatedItems = savedCart.items.map(item => {
      if (item.productId === productId) {
        const price = item.salePrice ?? item.price;
        return {
          ...item,
          quantity,
          subtotal: Math.round(price * quantity * 100) / 100,
        };
      }
      return item;
    });

    await saveCart(userId, updatedItems);
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

/**
 * Remove item from saved cart
 */
export const removeCartItem = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    const savedCart = await getSavedCart(userId);
    if (!savedCart) {
      throw new Error('Cart not found');
    }

    const updatedItems = savedCart.items.filter(
      item => item.productId !== productId
    );

    if (updatedItems.length === 0) {
      // If cart is empty, delete it
      await clearCart(userId);
    } else {
      await saveCart(userId, updatedItems);
    }
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
};

/**
 * Clear cart for a user
 */
export const clearCart = async (userId: string): Promise<void> => {
  try {
    const savedCart = await getSavedCart(userId);
    if (!savedCart) {
      return; // Cart doesn't exist, nothing to clear
    }

    const docRef = doc(db, SAVED_CARTS_COLLECTION, savedCart.id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

/**
 * Get abandoned carts (admin)
 * Carts that haven't been updated in specified days
 */
export const getAbandonedCarts = async (daysInactive: number = 7): Promise<SavedCart[]> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const q = query(
      collection(db, SAVED_CARTS_COLLECTION),
      where('updatedAt', '<', cutoffTimestamp),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedCart[];
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    throw error;
  }
};

/**
 * Get all active carts (admin)
 * For monitoring purposes
 */
export const getAllActiveCarts = async (): Promise<SavedCart[]> => {
  try {
    const q = query(
      collection(db, SAVED_CARTS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedCart[];
  } catch (error) {
    console.error('Error fetching active carts:', error);
    throw error;
  }
};

/**
 * Get cart statistics (admin)
 */
export const getCartStats = async (): Promise<{
  totalCarts: number;
  totalValue: number;
  averageValue: number;
  totalItems: number;
}> => {
  try {
    const carts = await getAllActiveCarts();

    const stats = {
      totalCarts: carts.length,
      totalValue: 0,
      averageValue: 0,
      totalItems: 0,
    };

    if (carts.length > 0) {
      stats.totalValue = carts.reduce((sum, cart) => sum + cart.subtotal, 0);
      stats.averageValue = stats.totalValue / carts.length;
      stats.totalItems = carts.reduce((sum, cart) => sum + cart.itemCount, 0);

      // Round to 2 decimal places
      stats.totalValue = Math.round(stats.totalValue * 100) / 100;
      stats.averageValue = Math.round(stats.averageValue * 100) / 100;
    }

    return stats;
  } catch (error) {
    console.error('Error getting cart stats:', error);
    throw error;
  }
};

/**
 * Clear expired carts (admin/cron job)
 * Remove carts that haven't been updated in specified days
 */
export const clearExpiredCarts = async (daysInactive: number = 90): Promise<number> => {
  try {
    const abandonedCarts = await getAbandonedCarts(daysInactive);

    let deletedCount = 0;
    for (const cart of abandonedCarts) {
      const docRef = doc(db, SAVED_CARTS_COLLECTION, cart.id);
      await deleteDoc(docRef);
      deletedCount++;
    }

    return deletedCount;
  } catch (error) {
    console.error('Error clearing expired carts:', error);
    throw error;
  }
};
