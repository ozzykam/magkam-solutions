import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  salePercent?: number; // Auto-calculated when salePrice is set
  saleStart?: Timestamp; // Optional: scheduled sale start date
  saleEnd?: Timestamp; // Optional: scheduled sale end date
  stock: number;
  lowStockThreshold?: number; // Show "low stock" warning when stock <= threshold
  isFeatured: boolean;
  canDiscount: boolean; // If false, exclude from site-wide sales
  isActive: boolean; // Hide/show product without deleting
  images: string[];
  categoryId: string;
  categoryName: string; // Denormalized for queries
  categorySlug: string; // Denormalized for queries
  tags: string[]; // ['organic', 'local', 'gluten-free', 'vegan', etc.]
  unit?: string; // 'lb', 'oz', 'each', 'bunch', etc.
  sku?: string; // Stock keeping unit for inventory

  // Vendor information (denormalized for quick access)
  vendorId: string;
  vendorName: string;
  vendorSlug: string;

  // Reviews summary (calculated from reviews collection)
  averageRating?: number;
  totalReviews?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parentId?: string;
  productCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductFilters {
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  isFeatured?: boolean;
  search?: string;
}

// Helper function to calculate sale percentage
export const calculateSalePercent = (price: number, salePrice?: number): number => {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
};

// Helper function to check if product is low stock
export const isLowStock = (product: Product): boolean => {
  if (!product.lowStockThreshold) return false;
  return product.stock <= product.lowStockThreshold;
};

// Helper function to check if product is currently on sale
// Handles both Firestore Timestamps and Date objects for client/server compatibility
export const isCurrentlyOnSale = (product: Product | any): boolean => {
  // If manual sale (onSale is true and no schedule), it's on sale
  if (product.onSale && !product.saleStart && !product.saleEnd) {
    return true;
  }

  // If scheduled sale exists, check if we're within the date range
  if (product.saleStart && product.saleEnd) {
    const now = Date.now();

    // Convert to milliseconds - handle both Timestamp and Date objects
    const startMillis = typeof product.saleStart === 'object' && 'toMillis' in product.saleStart
      ? product.saleStart.toMillis()
      : product.saleStart instanceof Date
      ? product.saleStart.getTime()
      : new Date(product.saleStart).getTime();

    const endMillis = typeof product.saleEnd === 'object' && 'toMillis' in product.saleEnd
      ? product.saleEnd.toMillis()
      : product.saleEnd instanceof Date
      ? product.saleEnd.getTime()
      : new Date(product.saleEnd).getTime();

    const isAfterStart = now >= startMillis;
    const isBeforeEnd = now < endMillis;
    return isAfterStart && isBeforeEnd;
  }

  // If only saleStart exists (no end date), check if sale has started
  if (product.saleStart && !product.saleEnd) {
    const now = Date.now();

    const startMillis = typeof product.saleStart === 'object' && 'toMillis' in product.saleStart
      ? product.saleStart.toMillis()
      : product.saleStart instanceof Date
      ? product.saleStart.getTime()
      : new Date(product.saleStart).getTime();

    return now >= startMillis;
  }

  // Otherwise, check the manual onSale flag
  return product.onSale;
};

// Helper function to get effective price (sale price if on sale, otherwise regular price)
export const getEffectivePrice = (product: Product): number => {
  return isCurrentlyOnSale(product) && product.salePrice ? product.salePrice : product.price;
};

// Helper function to get sale end countdown text
// Returns text like "Sale ends TODAY!", "Sale ends TOMORROW!", or "Sale ends in X DAYS!"
export const getSaleEndText = (product: Product | any): string | null => {
  // Only show countdown if there's a scheduled sale end date
  if (!product.saleEnd) {
    return null;
  }

  const now = new Date();

  // Convert saleEnd to milliseconds - handle both Timestamp and Date objects
  const endMillis = typeof product.saleEnd === 'object' && 'toMillis' in product.saleEnd
    ? product.saleEnd.toMillis()
    : product.saleEnd instanceof Date
    ? product.saleEnd.getTime()
    : new Date(product.saleEnd).getTime();

  const endDate = new Date(endMillis);

  // Calculate the difference in milliseconds
  const diffMs = endMillis - now.getTime();

  // If sale has already ended, return null
  if (diffMs <= 0) {
    return null;
  }

  // Get start of today and tomorrow for comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrowStart = new Date(tomorrowStart);
  dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 1);

  // Check if sale ends today (same calendar day)
  if (endDate >= todayStart && endDate < tomorrowStart) {
    return '~ Ends TODAY! ~';
  }

  // Check if sale ends tomorrow
  if (endDate >= tomorrowStart && endDate < dayAfterTomorrowStart) {
    return '~ Ends TOMORROW! ~';
  }

  // Calculate days remaining (for sales ending 2+ days from now)
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `~ Ends in ${daysRemaining} DAYS! ~`;
};
