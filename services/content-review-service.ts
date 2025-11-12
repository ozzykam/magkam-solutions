import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContentReview } from '@/types/content';

/**
 * Get all reviews for a content post
 */
export async function getContentReviews(contentPostId: string): Promise<ContentReview[]> {
  try {
    const reviewsRef = collection(db, 'contentReviews');
    const q = query(
      reviewsRef,
      where('contentPostId', '==', contentPostId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ContentReview[];
  } catch (error) {
    console.error('Error fetching content reviews:', error);
    return [];
  }
}

/**
 * Get a single review by ID
 */
export async function getContentReviewById(id: string): Promise<ContentReview | null> {
  try {
    const reviewDoc = await getDoc(doc(db, 'contentReviews', id));
    if (!reviewDoc.exists()) return null;

    return {
      id: reviewDoc.id,
      ...reviewDoc.data(),
    } as ContentReview;
  } catch (error) {
    console.error('Error fetching content review:', error);
    return null;
  }
}

/**
 * Create a new content review
 */
export async function createContentReview(
  reviewData: Omit<ContentReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful'>
): Promise<string> {
  try {
    const reviewsRef = collection(db, 'contentReviews');
    const newReviewRef = doc(reviewsRef);

    const review: Omit<ContentReview, 'id'> = {
      ...reviewData,
      helpful: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Use transaction to update content post rating stats
    await runTransaction(db, async (transaction) => {
      // Create review
      transaction.set(newReviewRef, review);

      // Update content post stats
      const postRef = doc(db, 'contentPosts', reviewData.contentPostId);
      const postDoc = await transaction.get(postRef);

      if (postDoc.exists()) {
        const currentData = postDoc.data();
        const currentTotal = currentData.totalReviews || 0;
        const currentAvg = currentData.averageRating || 0;

        const newTotal = currentTotal + 1;
        const newAvg = ((currentAvg * currentTotal) + reviewData.rating) / newTotal;

        transaction.update(postRef, {
          totalReviews: newTotal,
          averageRating: newAvg,
          updatedAt: Timestamp.now(),
        });
      }
    });

    return newReviewRef.id;
  } catch (error) {
    console.error('Error creating content review:', error);
    throw error;
  }
}

/**
 * Update an existing content review
 */
export async function updateContentReview(
  id: string,
  updates: Partial<ContentReview>
): Promise<void> {
  try {
    const reviewRef = doc(db, 'contentReviews', id);
    const oldReview = await getContentReviewById(id);

    if (!oldReview) {
      throw new Error('Review not found');
    }

    // If rating changed, update content post stats
    if (updates.rating !== undefined && updates.rating !== oldReview.rating) {
      const newRating = updates.rating;

      await runTransaction(db, async (transaction) => {
        // Update review
        transaction.update(reviewRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });

        // Update content post stats
        const postRef = doc(db, 'contentPosts', oldReview.contentPostId);
        const postDoc = await transaction.get(postRef);

        if (postDoc.exists()) {
          const currentData = postDoc.data();
          const currentTotal = currentData.totalReviews || 0;
          const currentAvg = currentData.averageRating || 0;

          // Recalculate average: remove old rating, add new rating
          const newAvg = ((currentAvg * currentTotal) - oldReview.rating + newRating) / currentTotal;

          transaction.update(postRef, {
            averageRating: newAvg,
            updatedAt: Timestamp.now(),
          });
        }
      });
    } else {
      // Just update the review
      await updateDoc(reviewRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error updating content review:', error);
    throw error;
  }
}

/**
 * Delete a content review
 */
export async function deleteContentReview(id: string): Promise<void> {
  try {
    const review = await getContentReviewById(id);
    if (!review) {
      throw new Error('Review not found');
    }

    await runTransaction(db, async (transaction) => {
      // Delete review
      const reviewRef = doc(db, 'contentReviews', id);
      transaction.delete(reviewRef);

      // Update content post stats
      const postRef = doc(db, 'contentPosts', review.contentPostId);
      const postDoc = await transaction.get(postRef);

      if (postDoc.exists()) {
        const currentData = postDoc.data();
        const currentTotal = currentData.totalReviews || 0;
        const currentAvg = currentData.averageRating || 0;

        const newTotal = Math.max(0, currentTotal - 1);
        const newAvg = newTotal > 0
          ? ((currentAvg * currentTotal) - review.rating) / newTotal
          : 0;

        transaction.update(postRef, {
          totalReviews: newTotal,
          averageRating: newTotal > 0 ? newAvg : undefined,
          updatedAt: Timestamp.now(),
        });
      }
    });
  } catch (error) {
    console.error('Error deleting content review:', error);
    throw error;
  }
}

/**
 * Mark a review as helpful
 */
export async function markContentReviewHelpful(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, 'contentReviews', reviewId);
    await updateDoc(reviewRef, {
      helpful: increment(1),
    });
  } catch (error) {
    console.error('Error marking content review as helpful:', error);
    throw error;
  }
}

/**
 * Check if user has already reviewed a content post
 */
export async function hasUserReviewedContent(
  userId: string,
  contentPostId: string
): Promise<boolean> {
  try {
    const reviewsRef = collection(db, 'contentReviews');
    const q = query(
      reviewsRef,
      where('userId', '==', userId),
      where('contentPostId', '==', contentPostId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user review:', error);
    return false;
  }
}
