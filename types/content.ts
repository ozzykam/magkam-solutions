import { Timestamp } from 'firebase/firestore';

/**
 * Flexible Featured Item - can be a service or custom item
 * For recipes: ingredients (flour, eggs, local honey from your store)
 * For styling: outfit pieces (shoes, accessories)
 * For how-tos: tools/materials needed
 */
export interface FeaturedItem {
  id: string;
  name: string;
  serviceId?: string;        // If linked to a service in your store
  serviceSlug?: string;       // For linking to service page
  quantity?: string;          // e.g., "2 cups", "1 pair", "3 items"
  notes?: string;             // e.g., "or substitute with regular honey"
  image?: string;             // Custom image if not a service
  isAvailable?: boolean;      // If it's a service, is it in stock?
}

/**
 * Content Category - organize content into categories
 */
export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;          // Hex color for badge
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Content Post - versatile blog-style content
 * Can be recipes, styling guides, how-tos, stories, etc.
 */
export interface ContentPost {
  id: string;
  title: string;
  slug: string;
  description: string;        // Rich text content (main body)
  excerpt?: string;           // Short summary for previews

  // Category
  categoryId: string;
  categoryName: string;       // Denormalized for easy display

  // Featured items (ingredients, outfit pieces, tools, etc.)
  featuredItems: FeaturedItem[];

  // Metadata
  coverImage?: string;
  images: string[];           // Additional images for gallery
  tags: string[];             // e.g., ["dessert", "quick", "summer"] or ["casual", "formal", "winter"]

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Publishing
  isPublished: boolean;
  publishedAt?: Timestamp;

  // Author (vendor or admin)
  authorId: string;
  authorName: string;
  authorType: 'admin' | 'vendor';

  // Engagement
  viewCount: number;
  likeCount?: number;

  // Reviews summary (calculated from contentReviews collection)
  averageRating?: number;
  totalReviews?: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Content Settings - customize labels for different business types
 * Store owners can customize terminology to match their business
 */
export interface ContentSettings {
  enabled: boolean;

  // Customizable labels
  sectionName: string;          // e.g., "Recipes", "Style Guides", "Blog", "How-Tos"
  sectionNamePlural: string;    // e.g., "Recipes", "Style Guides", "Blog Posts"
  itemsLabel: string;           // e.g., "Ingredients", "Featured Items", "Materials"
  itemsLabelSingular: string;   // e.g., "Ingredient", "Featured Item", "Material"

  // URL paths
  urlSlug: string;              // e.g., "recipes", "style-guides", "blog"

  // Display settings
  showAuthor: boolean;
  showViewCount: boolean;
  allowVendorPosts: boolean;    // Can vendors create posts?
}

// Default content settings
export const DEFAULT_CONTENT_SETTINGS: ContentSettings = {
  enabled: true,
  sectionName: 'Blog',
  sectionNamePlural: 'Blog Posts',
  itemsLabel: 'Featured Items',
  itemsLabelSingular: 'Featured Item',
  urlSlug: 'blog',
  showAuthor: true,
  showViewCount: false,
  allowVendorPosts: false,
};

// Pre-configured templates for common business types
export const CONTENT_TEMPLATES = {
  recipes: {
    sectionName: 'Recipes',
    sectionNamePlural: 'Recipes',
    itemsLabel: 'Ingredients',
    itemsLabelSingular: 'Ingredient',
    urlSlug: 'recipes',
  },
  styleGuides: {
    sectionName: 'Style Guide',
    sectionNamePlural: 'Style Guides',
    itemsLabel: 'Featured Pieces',
    itemsLabelSingular: 'Featured Piece',
    urlSlug: 'style-guides',
  },
  howTos: {
    sectionName: 'How-To',
    sectionNamePlural: 'How-Tos',
    itemsLabel: 'Materials Needed',
    itemsLabelSingular: 'Material',
    urlSlug: 'how-tos',
  },
  blog: {
    sectionName: 'Blog',
    sectionNamePlural: 'Blog Posts',
    itemsLabel: 'Featured Services',
    itemsLabelSingular: 'Featured Service',
    urlSlug: 'blog',
  },
};

// Type for content post with Date objects (for client components)
export type ContentPostWithDates = Omit<ContentPost, 'createdAt' | 'updatedAt' | 'publishedAt'> & {
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
};

/**
 * Content Review - reviews for blog posts, recipes, style guides, etc.
 */
export interface ContentReview {
  id: string;
  contentPostId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;           // 1-5 stars
  title?: string;           // Optional review title
  comment: string;          // Review text
  helpful: number;          // Number of helpful votes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Type for content review with Date objects
export type ContentReviewWithDates = Omit<ContentReview, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Content Bookmark - saved posts for users
 * Similar to wishlist but for content posts
 */
export interface ContentBookmark {
  userId: string;
  postIds: string[];        // Array of bookmarked post IDs
  updatedAt: Timestamp;
}
