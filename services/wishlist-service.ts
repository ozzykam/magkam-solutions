import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { WishlistItem, Wishlist, WishlistAnalytics } from '@/types/wishlist';
import { Product } from '@/types/product';

/**
 * Get user's wishlist
 */
export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  try {
    const wishlistRef = doc(db, 'wishlists', userId);
    const wishlistDoc = await getDoc(wishlistRef);

    if (!wishlistDoc.exists()) {
      return [];
    }

    const wishlist = wishlistDoc.data() as Wishlist;
    return wishlist.items || [];
  } catch (error) {
    console.error('Error getting user wishlist:', error);
    throw new Error('Failed to get wishlist');
  }
}

/**
 * Add item to wishlist
 */
export async function addToWishlist(
  userId: string,
  product: Product,
  userEmail: string,
  userName: string
): Promise<void> {
  try {
    const wishlistRef = doc(db, 'wishlists', userId);
    const wishlistDoc = await getDoc(wishlistRef);

    const wishlistItem: WishlistItem = {
      id: `${userId}_${product.id}`,
      userId,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0] || '',
      productPrice: product.price,
      wasInStockWhenAdded: product.stock > 0,
      notifyWhenRestocked: product.stock === 0, // Auto-enable for out-of-stock items
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      addedAt: Timestamp.now(),
    };

    if (!wishlistDoc.exists()) {
      // Create new wishlist
      const newWishlist: Wishlist = {
        userId,
        items: [wishlistItem],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(wishlistRef, newWishlist);
    } else {
      // Add to existing wishlist
      const wishlist = wishlistDoc.data() as Wishlist;

      // Check if item already exists
      const itemExists = wishlist.items.some(item => item.productId === product.id);
      if (itemExists) {
        throw new Error('Item already in wishlist');
      }

      wishlist.items.push(wishlistItem);
      wishlist.updatedAt = Timestamp.now();

      await updateDoc(wishlistRef, {
        items: wishlist.items,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    throw new Error(error.message || 'Failed to add to wishlist');
  }
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  try {
    const wishlistRef = doc(db, 'wishlists', userId);
    const wishlistDoc = await getDoc(wishlistRef);

    if (!wishlistDoc.exists()) {
      throw new Error('Wishlist not found');
    }

    const wishlist = wishlistDoc.data() as Wishlist;
    wishlist.items = wishlist.items.filter(item => item.productId !== productId);
    wishlist.updatedAt = Timestamp.now();

    await updateDoc(wishlistRef, {
      items: wishlist.items,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw new Error('Failed to remove from wishlist');
  }
}

/**
 * Toggle restock notification for a wishlist item
 */
export async function toggleRestockNotification(
  userId: string,
  productId: string,
  enabled: boolean
): Promise<void> {
  try {
    const wishlistRef = doc(db, 'wishlists', userId);
    const wishlistDoc = await getDoc(wishlistRef);

    if (!wishlistDoc.exists()) {
      throw new Error('Wishlist not found');
    }

    const wishlist = wishlistDoc.data() as Wishlist;
    const itemIndex = wishlist.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      throw new Error('Item not found in wishlist');
    }

    wishlist.items[itemIndex].notifyWhenRestocked = enabled;
    wishlist.updatedAt = Timestamp.now();

    await updateDoc(wishlistRef, {
      items: wishlist.items,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling restock notification:', error);
    throw new Error('Failed to update notification preference');
  }
}

/**
 * Mark restock notification as sent
 */
export async function markRestockNotificationSent(
  userId: string,
  productId: string
): Promise<void> {
  try {
    const wishlistRef = doc(db, 'wishlists', userId);
    const wishlistDoc = await getDoc(wishlistRef);

    if (!wishlistDoc.exists()) {
      return;
    }

    const wishlist = wishlistDoc.data() as Wishlist;
    const itemIndex = wishlist.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return;
    }

    wishlist.items[itemIndex].notificationSent = true;
    wishlist.items[itemIndex].notificationSentAt = Timestamp.now();
    wishlist.updatedAt = Timestamp.now();

    await updateDoc(wishlistRef, {
      items: wishlist.items,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking notification as sent:', error);
  }
}

/**
 * Get all users waiting for restock notification for a specific product
 */
export async function getUsersWaitingForRestock(
  productId: string
): Promise<Array<{ userId: string; userEmail: string; userName: string; item: WishlistItem }>> {
  try {
    const wishlistsRef = collection(db, 'wishlists');
    const snapshot = await getDocs(wishlistsRef);

    const waitingUsers: Array<{ userId: string; userEmail: string; userName: string; item: WishlistItem }> = [];

    for (const wishlistDoc of snapshot.docs) {
      const wishlist = wishlistDoc.data() as Wishlist;
      const item = wishlist.items.find(
        item =>
          item.productId === productId &&
          item.notifyWhenRestocked &&
          !item.notificationSent
      );

      if (item) {
        // Fetch user details
        const userRef = doc(db, 'users', wishlist.userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          waitingUsers.push({
            userId: wishlist.userId,
            userEmail: userData.email,
            userName: userData.name,
            item,
          });
        }
      }
    }

    return waitingUsers;
  } catch (error) {
    console.error('Error getting users waiting for restock:', error);
    throw new Error('Failed to get users waiting for restock');
  }
}

/**
 * Get wishlist analytics for admin
 * Returns products with their wishlist counts and user lists
 */
export async function getWishlistAnalytics(): Promise<WishlistAnalytics[]> {
  try {
    const wishlistsRef = collection(db, 'wishlists');
    const snapshot = await getDocs(wishlistsRef);

    // Map to aggregate wishlist data by product
    const productMap = new Map<string, WishlistAnalytics>();

    for (const wishlistDoc of snapshot.docs) {
      const wishlist = wishlistDoc.data() as Wishlist;

      // Fetch user details
      const userRef = doc(db, 'users', wishlist.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      for (const item of wishlist.items) {
        if (!productMap.has(item.productId)) {
          // Fetch product details for current stock
          const productRef = doc(db, 'products', item.productId);
          const productDoc = await getDoc(productRef);
          const product = productDoc.exists() ? productDoc.data() : null;

          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            productImage: item.productImage,
            currentStock: product?.stock || 0,
            isInStock: (product?.stock || 0) > 0,
            totalWishlisted: 0,
            waitingForRestock: 0,
            notificationsPending: 0,
            users: [],
          });
        }

        const analytics = productMap.get(item.productId)!;
        analytics.totalWishlisted++;

        if (item.notifyWhenRestocked) {
          analytics.waitingForRestock++;
          if (!item.notificationSent) {
            analytics.notificationsPending++;
          }
        }

        if (userData) {
          analytics.users.push({
            userId: wishlist.userId,
            userName: userData.name,
            userEmail: userData.email,
            addedAt: item.addedAt,
            notificationSent: item.notificationSent || false,
          });
        }
      }
    }

    return Array.from(productMap.values()).sort(
      (a, b) => b.totalWishlisted - a.totalWishlisted
    );
  } catch (error) {
    console.error('Error getting wishlist analytics:', error);
    throw new Error('Failed to get wishlist analytics');
  }
}

/**
 * Clear all wishlist items (for testing or user request)
 */
export async function clearWishlist(userId: string): Promise<void> {
  try {
    const wishlistRef = doc(db, 'wishlists', userId);
    await updateDoc(wishlistRef, {
      items: [],
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    throw new Error('Failed to clear wishlist');
  }
}
