'use client';

import { useState } from 'react';
import { ContentReview } from '@/types/content';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ContentReviewForm from '@/components/content/ContentReviewForm';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastContainer';
import {
  createContentReview,
  markContentReviewHelpful,
  getContentReviews,
  hasUserReviewedContent,
} from '@/services/content-review-service';

interface ContentReviewsProps {
  contentPostId: string;
  initialReviews: Array<Omit<ContentReview, 'createdAt' | 'updatedAt'> & {
    createdAt: Date;
    updatedAt: Date;
  }>;
  totalReviews?: number;
  averageRating?: number;
}

export default function ContentReviews({
  contentPostId,
  initialReviews,
  totalReviews,
  averageRating,
}: ContentReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [stats, setStats] = useState({
    total: totalReviews || 0,
    average: averageRating || 0,
  });
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const handleSubmitReview = async (reviewData: Partial<ContentReview>) => {
    try {
      if (!user) {
        toast?.error('You must be logged in to submit a review');
        return;
      }

      // Check if user already reviewed this content
      const alreadyReviewed = await hasUserReviewedContent(user.uid, contentPostId);
      if (alreadyReviewed) {
        toast?.error('You have already reviewed this post');
        return;
      }

      await createContentReview(reviewData as Omit<ContentReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful'>);

      toast?.success('Review submitted successfully!');
      setShowReviewModal(false);

      // Refresh reviews
      const updatedReviews = await getContentReviews(contentPostId);
      // Serialize timestamps
      const serializedReviews = updatedReviews.map(review => ({
        ...review,
        createdAt: review.createdAt instanceof Date
          ? review.createdAt
          : review.createdAt.toDate(),
        updatedAt: review.updatedAt instanceof Date
          ? review.updatedAt
          : review.updatedAt.toDate(),
      }));
      setReviews(serializedReviews);

      // Update stats
      if (reviewData.rating) {
        const newTotal = stats.total + 1;
        const newAverage = ((stats.average * stats.total) + reviewData.rating) / newTotal;
        setStats({
          total: newTotal,
          average: newAverage,
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast?.error('Failed to submit review. Please try again.');
    }
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      toast?.error('Please sign in to write a review');
      return;
    }
    setShowReviewModal(true);
  };

  const handleHelpful = async (reviewId: string, reviewUserId: string) => {
    if (!isAuthenticated || !user) {
      toast?.error('Please sign in to mark review as helpful');
      return;
    }
    if (reviewUserId === user.uid) {
      toast?.error('You cannot mark your own review as helpful');
      return;
    }
    try {
      await markContentReviewHelpful(reviewId);
      const updatedReviews = await getContentReviews(contentPostId);
      // Serialize timestamps
      const serializedReviews = updatedReviews.map(review => ({
        ...review,
        createdAt: review.createdAt.toDate(),
        updatedAt: review.updatedAt.toDate(),
      }));
      setReviews(serializedReviews);
      toast?.success('Marked as helpful!');
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      toast?.error('Failed to mark review as helpful. Please try again.');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {stats.total === 0 ? 'No Reviews Yet' : `Reviews (${stats.total})`}
            </h2>
            {stats.total > 0 && stats.average > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(stats.average) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600">
                  {stats.average.toFixed(1)} out of 5
                </span>
              </div>
            )}
          </div>
          <Button variant="outline" size="md" onClick={handleWriteReview}>
            Write a Review
          </Button>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 border-t border-gray-200">
            <p className="text-gray-500 mb-4">
              Be the first to review this post!
            </p>
          </div>
        ) : (
          <div className="space-y-6 border-t border-gray-200 pt-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{review.userName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                {review.title && (
                  <h3 className="font-semibold text-gray-900 mb-1">{review.title}</h3>
                )}
                <p className="text-gray-700 mb-2">{review.comment}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{review.createdAt.toLocaleDateString()}</span>
                  <button
                    className="hover:text-primary-600 transition-colors"
                    onClick={() => handleHelpful(review.id, review.userId)}
                  >
                    👍 Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
        size="lg"
      >
        <ContentReviewForm
          contentPostId={contentPostId}
          onSubmit={handleSubmitReview}
          onCancel={() => setShowReviewModal(false)}
        />
      </Modal>
    </>
  );
}
