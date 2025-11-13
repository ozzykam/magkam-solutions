import { Timestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  userName: string; // Denormalized for display
  userEmail: string; // Denormalized for display
  rating: number; // 1-5
  title?: string;
  comment: string;
  verified: boolean; // True if user purchased the service
  helpful: number; // Count of helpful votes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Helper to calculate average rating
export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
};

// Helper to get rating distribution
export const getRatingDistribution = (reviews: Review[]): ReviewStats['ratingDistribution'] => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    distribution[review.rating as keyof typeof distribution]++;
  });
  return distribution;
};

// Helper to calculate review stats
export const calculateReviewStats = (reviews: Review[]): ReviewStats => {
  return {
    averageRating: calculateAverageRating(reviews),
    totalReviews: reviews.length,
    ratingDistribution: getRatingDistribution(reviews),
  };
};
