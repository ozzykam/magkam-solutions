import { Timestamp } from 'firebase/firestore';

/**
 * Service pricing types for flexibility across different business models
 */
export type ServicePricingType = 'fixed' | 'starting_from' | 'hourly' | 'package' | 'custom_quote';

/**
 * Service interface for service-based businesses
 * (agencies, consultants, photographers, designers, etc.)
 */
export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string; // Brief summary for cards/previews

  // Pricing configuration
  pricingType: ServicePricingType;
  basePrice?: number; // Fixed price or starting price
  hourlyRate?: number; // For hourly services
  priceDisplayText?: string; // Custom text: "Starting from $500", "Contact for quote", etc.

  // Promotional pricing
  onSale: boolean; // Whether service is currently on sale
  canDiscount: boolean; // Whether discounts can be applied
  salePrice?: number; // Discounted price (for fixed/starting_from pricing)
  salePercent?: number; // Auto-calculated discount percentage
  saleStart?: Timestamp; // Optional: scheduled sale start date
  saleEnd?: Timestamp; // Optional: scheduled sale end date

  // Organization & Discovery
  categoryId?: string; // Optional link to content categories
  tags: string[]; // ['photography', 'branding', 'web-design', 'consulting']

  // Visual Assets
  images: string[]; // Portfolio samples, service imagery
  featuredImage?: string; // Primary image for cards

  // Service Details
  deliverables?: string[]; // ["50 edited photos", "2 design concepts", "3 revisions"]
  duration?: string; // "2-4 weeks", "1 day shoot", "Ongoing"
  includes?: string[]; // What's included in the service

  // Display & Ordering
  isFeatured: boolean; // Show on homepage/featured sections
  isActive: boolean; // Publish/unpublish without deleting
  sortOrder?: number; // Manual ordering for display

  // Integration with calculator system
  calculatorId?: string; // Link to associated calculator for dynamic pricing

  // Reviews summary (calculated from reviews collection)
  averageRating?: number;
  totalReviews?: number;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin user who created it
}

/**
 * Filters for querying services
 */
export interface ServiceFilters {
  categoryId?: string; // Filter by category
  tags?: string[]; // Filter by tags
  minPrice?: number; // Minimum price filter (client-side)
  maxPrice?: number; // Maximum price filter (client-side)
  pricingType?: ServicePricingType; // Filter by pricing model
  isFeatured?: boolean; // Only featured services
  onSale?: boolean; // Only services on sale
  search?: string; // Text search (client-side)
  activeOnly?: boolean; // Only active/published services
}

/**
 * Helper function to check if service is currently on sale
 * Handles scheduled sales and manual sale flags
 */
export const isCurrentlyOnSale = (service: Service): boolean => {
  // If not marked as on sale, return false
  if (!service.onSale) {
    return false;
  }

  // If manual sale (onSale is true and no schedule), it's on sale
  if (!service.saleStart && !service.saleEnd) {
    return true;
  }

  // If scheduled sale exists, check if we're within the date range
  const now = Date.now();

  if (service.saleStart && service.saleEnd) {
    const startMillis = service.saleStart.toMillis();
    const endMillis = service.saleEnd.toMillis();
    return now >= startMillis && now < endMillis;
  }

  // If only saleStart exists (no end date), check if sale has started
  if (service.saleStart) {
    const startMillis = service.saleStart.toMillis();
    return now >= startMillis;
  }

  // Default to the manual onSale flag
  return service.onSale;
};

/**
 * Helper function to calculate sale percentage
 */
export const calculateSalePercent = (basePrice: number | 0, salePrice?: number): number => {
  if (!salePrice || salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
};

/**
 * Helper function to get effective price (sale price if on sale, otherwise base price)
 */
export const getEffectivePrice = (service: Service): number | undefined => {
  if (isCurrentlyOnSale(service) && service.salePrice) {
    return service.salePrice;
  }
  return service.basePrice;
};

/**
 * Helper function to get display price text for a service
 */
export const getServicePriceDisplay = (service: Service): string => {
  // If custom text is provided, use it
  if (service.priceDisplayText) {
    return service.priceDisplayText;
  }

  // Determine the price to display (sale price if on sale)
  const effectivePrice = getEffectivePrice(service);
  const isOnSale = isCurrentlyOnSale(service);

  // Generate based on pricing type
  switch (service.pricingType) {
    case 'fixed':
      if (!effectivePrice) return 'Contact for pricing';
      if (isOnSale && service.salePrice) {
        return `$${service.salePrice.toLocaleString()} (was $${service.basePrice?.toLocaleString()})`;
      }
      return `$${effectivePrice.toLocaleString()}`;

    case 'starting_from':
      if (!effectivePrice) return 'Contact for pricing';
      if (isOnSale && service.salePrice) {
        return `Starting from $${service.salePrice.toLocaleString()} (was $${service.basePrice?.toLocaleString()})`;
      }
      return `Starting from $${effectivePrice.toLocaleString()}`;

    case 'hourly':
      return service.hourlyRate ? `$${service.hourlyRate}/hour` : 'Contact for pricing';

    case 'package':
      if (!effectivePrice) return 'Package pricing available';
      if (isOnSale && service.salePrice) {
        return `$${service.salePrice.toLocaleString()} package (was $${service.basePrice?.toLocaleString()})`;
      }
      return `$${effectivePrice.toLocaleString()} package`;

    case 'custom_quote':
      return 'Custom quote';

    default:
      return 'Contact for pricing';
  }
};

/**
 * Helper function to get sale end countdown text
 * Returns text like "Ends today!", "Ends tomorrow!", or "Ends in X days!"
 */
export const getSaleEndText = (service: Service): string | null => {
  if (!isCurrentlyOnSale(service) || !service.saleEnd) {
    return null;
  }

  const now = new Date();
  const endMillis = service.saleEnd.toMillis();
  const endDate = new Date(endMillis);

  // If sale has already ended, return null
  const diffMs = endMillis - now.getTime();
  if (diffMs <= 0) {
    return null;
  }

  // Get start of today and tomorrow for comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrowStart = new Date(tomorrowStart);
  dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 1);

  // Check if sale ends today
  if (endDate >= todayStart && endDate < tomorrowStart) {
    return 'Ends today!';
  }

  // Check if sale ends tomorrow
  if (endDate >= tomorrowStart && endDate < dayAfterTomorrowStart) {
    return 'Ends tomorrow!';
  }

  // Calculate days remaining
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `Ends in ${daysRemaining} days!`;
};

/**
 * Helper function to check if service has calculator integration
 */
export const hasCalculator = (service: Service): boolean => {
  return !!service.calculatorId;
};

/**
 * Data required to create a new service
 */
export type CreateServiceData = Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalReviews'>;
