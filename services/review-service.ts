import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Review, calculateAverageRating } from '@/types/review';

const REVIEWS_COLLECTION = 'reviews';
const PRODUCTS_COLLECTION = 'products';

/**
 * Create a new review
 */
export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> => {
  try {
    const now = Timestamp.now();
    const review = {
      ...reviewData,
      helpful: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), review);

    // Update product's average rating and total reviews
    await updateProductReviewStats(reviewData.productId);

    return {
      id: docRef.id,
      ...review,
    } as Review;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

/**
 * Get reviews for a product
 */
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    throw error;
  }
};

/**
 * Get a single review by ID
 */
export const getReviewById = async (reviewId: string): Promise<Review | null> => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Review;
  } catch (error) {
    console.error('Error fetching review:', error);
    throw error;
  }
};

/**
 * Update an existing review
 */
export const updateReview = async (
  reviewId: string,
  updates: Partial<Omit<Review, 'id' | 'productId' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);

    // Get the review to get productId
    const reviewDoc = await getDoc(docRef);
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }

    const review = reviewDoc.data() as Review;

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    // If rating changed, update product stats
    if (updates.rating !== undefined) {
      await updateProductReviewStats(review.productId);
    }
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);

    // Get the review to get productId
    const reviewDoc = await getDoc(docRef);
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }

    const review = reviewDoc.data() as Review;

    await deleteDoc(docRef);

    // Update product stats after deletion
    await updateProductReviewStats(review.productId);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

/**
 * Mark a review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);

    await updateDoc(docRef, {
      helpful: increment(1),
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    throw error;
  }
};

/**
 * Get reviews by user
 */
export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
};

/**
 * Check if user has already reviewed a product
 */
export const hasUserReviewedProduct = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if user reviewed product:', error);
    throw error;
  }
};

/**
 * Get user's review for a product
 */
export const getUserProductReview = async (
  userId: string,
  productId: string
): Promise<Review | null> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Review;
  } catch (error) {
    console.error('Error fetching user product review:', error);
    throw error;
  }
};

/**
 * Update product's review statistics
 * This is called after creating, updating, or deleting a review
 */
const updateProductReviewStats = async (productId: string): Promise<void> => {
  try {
    // Get all reviews for the product
    const reviews = await getProductReviews(productId);

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? calculateAverageRating(reviews) : 0;

    // Update product document
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      averageRating,
      totalReviews,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product review stats:', error);
    throw error;
  }
};

/**
 * Verify if user purchased the product (for verified purchase badge)
 */
export const checkVerifiedPurchase = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', 'in', ['completed', 'confirmed', 'preparing', 'ready', 'out_for_delivery'])
    );

    const snapshot = await getDocs(q);

    // Check if any order contains this product
    for (const doc of snapshot.docs) {
      const order = doc.data();
      const hasProduct = order.items?.some((item: any) => item.id === productId);
      if (hasProduct) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking verified purchase:', error);
    return false;
  }
};
