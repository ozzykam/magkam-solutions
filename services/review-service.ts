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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Review, calculateAverageRating } from '@/types/review';

const REVIEWS_COLLECTION = 'reviews';
const SERVICES_COLLECTION = 'services';

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

    // Update services's average rating and total reviews
    await updateServiceReviewStats(reviewData.serviceId);

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
 * Get reviews for a service
 */
export const getServiceReviews = async (serviceId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('serviceId', '==', serviceId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
  } catch (error) {
    console.error('Error fetching service reviews:', error);
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
  updates: Partial<Omit<Review, 'id' | 'serviceId' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);

    // Get the review to get serviceId
    const reviewDoc = await getDoc(docRef);
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }

    const review = reviewDoc.data() as Review;

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    // If rating changed, update service stats
    if (updates.rating !== undefined) {
      await updateServiceReviewStats(review.serviceId);
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

    // Get the review to get serviceId
    const reviewDoc = await getDoc(docRef);
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }

    const review = reviewDoc.data() as Review;

    await deleteDoc(docRef);

    // Update service stats after deletion
    await updateServiceReviewStats(review.serviceId);
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
 * Check if user has already reviewed a service
 */
export const hasUserReviewedService = async (
  userId: string,
  serviceId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      where('serviceId', '==', serviceId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if user reviewed service:', error);
    throw error;
  }
};

/**
 * Get user's review for a service
 */
export const getUserServiceReview = async (
  userId: string,
  serviceId: string
): Promise<Review | null> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId),
      where('serviceId', '==', serviceId)
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
    console.error('Error fetching user service review:', error);
    throw error;
  }
};

/**
 * Update service's review statistics
 * This is called after creating, updating, or deleting a review
 */
const updateServiceReviewStats = async (serviceId: string): Promise<void> => {
  try {
    // Get all reviews for the service
    const reviews = await getServiceReviews(serviceId);

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? calculateAverageRating(reviews) : 0;

    // Update service document
    const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
    await updateDoc(serviceRef, {
      averageRating,
      totalReviews,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating service review stats:', error);
    throw error;
  }
};

/**
 * Minimal type for legacy order items
 * Used for checking if a service was purchased
 */
interface OrderItem {
  id: string;
  [key: string]: unknown; // Allow other properties from legacy data
}
interface LegacyOrder {
  userId?: string;
  status?: string;
  items?: OrderItem[];
}

/**
 * Verify if user purchased the service (for verified purchase badge)
 * Note: This checks legacy order data from when the platform was e-commerce
 */
export const checkVerifiedPurchase = async (
  userId: string,
  serviceId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', 'in', ['completed', 'confirmed', 'preparing', 'ready', 'out_for_delivery'])
    );

    const snapshot = await getDocs(q);

    // Check if any order contains this service
    for (const doc of snapshot.docs) {
      const order = doc.data() as LegacyOrder;
      const hasService = order.items?.some((item: OrderItem) => item.id === serviceId);
      if (hasService) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking verified purchase:', error);
    return false;
  }
};
