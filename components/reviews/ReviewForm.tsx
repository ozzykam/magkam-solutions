'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Review } from '@/types/review';
import { useAuth } from '@/lib/contexts/AuthContext';
import { checkVerifiedPurchase } from '@/services/review-service';

interface ReviewFormProps {
  serviceId: string;
  existingReview?: Review;
  onSubmit: (review: Partial<Review>) => Promise<void>;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  serviceId,
  existingReview,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(false);

  // Check if user has purchased this service
  useEffect(() => {
    const verifyPurchase = async () => {
      if (user?.uid && serviceId) {
        const verified = await checkVerifiedPurchase(user.uid, serviceId);
        setIsVerifiedPurchase(verified);
      }
    };

    verifyPurchase();
  }, [user?.uid, serviceId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!comment.trim()) {
      newErrors.comment = 'Please write a review';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!user) return;

    setLoading(true);

    try {
      const reviewData: Partial<Review> = {
        serviceId,
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        verified: isVerifiedPurchase, // Verified if user purchased service
      };

      await onSubmit(reviewData);

      // Reset form if creating new review
      if (!existingReview) {
        setRating(0);
        setTitle('');
        setComment('');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrors({ submit: 'Failed to submit review. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating {errors.rating && <span className="text-red-600">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-gray-600">
            {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
          </span>
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      {/* Title */}
      <Input
        label="Review Title (Optional)"
        placeholder="Sum up your experience..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        fullWidth
      />

      {/* Comment */}
      <Textarea
        label="Your Review"
        placeholder="Share your thoughts about this service..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={errors.comment}
        rows={5}
        maxLength={1000}
        fullWidth
      />

      {/* Character count */}
      <p className="text-sm text-gray-500 text-right">
        {comment.length}/1000 characters
      </p>

      {/* Submit Error */}
      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          {existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
