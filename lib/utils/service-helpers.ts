/**
 * Service Helper Utilities
 *
 * Functions to handle service-related operations:
 * - Related services logic
 * - Service filtering and sorting
 * - Service status checks
 */

import { Service } from '@/types/services';
import { Timestamp } from 'firebase/firestore';
import { getServices, getServicesByCategory } from '@/services/services-service';

/**
 * Type that accepts both Firestore Timestamp and Date for serialized services
 */
export type ServiceWithOptionalDates = Omit<Service, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  saleStart?: Timestamp | Date;
  saleEnd?: Date | Timestamp;
};

/**
 * Get related services based on the current service
 * Logic: Services in the same category, excluding the current service
 *
 * @param currentService - The current service to find related services for
 * @param limit - Maximum number of related services to return (default: 6)
 * @returns Array of related services
 */
export async function getRelatedServices(
  currentService: ServiceWithOptionalDates,
  limit: number = 6
): Promise<Service[]> {
  // If service has no category, return empty array
  if (!currentService.categoryId) {
    return [];
  }

  try {
    // Fetch services in the same category
    const categoryServices = await getServicesByCategory(currentService.categoryId);

    // Filter out the current service and inactive services
    const relatedServices: Service[] = categoryServices
      .filter((service: Service) => service.id !== currentService.id && service.isActive)
      .slice(0, limit);

    return relatedServices;
  } catch (error) {
    console.error('Error fetching related services:', error);
    return [];
  }
}

/**
 * Get popular services based on ratings and review count
 *
 * @param limit - Maximum number of services to return (default: 6)
 * @returns Array of popular services
 */
export async function getPopularServices(limit: number = 6): Promise<Service[]> {
  try {
    const services = await getServices({ activeOnly: true });

    // Sort by average rating (descending), then by total reviews (descending)
    const popularServices = services
      .filter(service => service.averageRating && service.totalReviews)
      .sort((a, b) => {
        // First sort by rating
        const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
        if (ratingDiff !== 0) return ratingDiff;

        // If ratings are equal, sort by number of reviews
        return (b.totalReviews || 0) - (a.totalReviews || 0);
      })
      .slice(0, limit);

    return popularServices;
  } catch (error) {
    console.error('Error fetching popular services:', error);
    return [];
  }
}

/**
 * Filter services by search query
 * Searches in: name, shortDescription, tags
 */
export function filterServicesBySearch(services: ServiceWithOptionalDates[], query: string): ServiceWithOptionalDates[] {
  if (!query || query.trim() === '') {
    return services;
  }

  const searchTerm = query.toLowerCase().trim();

  return services.filter(service => {
    // Search in name
    if (service.name.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in short description
    if (service.shortDescription?.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in tags
    if (service.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
      return true;
    }

    return false;
  });
}

/**
 * Filter services by category
 */
export function filterServicesByCategory(services: ServiceWithOptionalDates[], categoryId: string | null): ServiceWithOptionalDates[] {
  if (!categoryId) {
    return services;
  }

  return services.filter(service => service.categoryId === categoryId);
}

/**
 * Filter services by price range
 */
export function filterServicesByPriceRange(
  services: ServiceWithOptionalDates[],
  minPrice: number | null,
  maxPrice: number | null
): ServiceWithOptionalDates[] {
  if (minPrice === null && maxPrice === null) {
    return services;
  }

  return services.filter(service => {
    let price: number = 0;

    // Get the numeric price based on pricing type
    switch (service.pricingType) {
      case 'fixed':
      case 'starting_from':
        price = service.basePrice || 0;
        break;
      case 'hourly':
        price = service.hourlyRate || 0;
        break;
      default:
        // For package/custom quote, we can't filter by price
        return true;
    }

    if (minPrice !== null && price < minPrice) {
      return false;
    }

    if (maxPrice !== null && price > maxPrice) {
      return false;
    }

    return true;
  });
}

/**
 * Filter services that are currently on sale
 */
export function filterServicesOnSale(services: ServiceWithOptionalDates[]): ServiceWithOptionalDates[] {
  return services.filter(service => {
    if (!service.onSale) return false;

    // If there are sale dates, check if currently within the sale period
    if (service.saleStart || service.saleEnd) {
      const now = new Date();
      const startDate = service.saleStart instanceof Date
        ? service.saleStart
        : service.saleStart && 'toDate' in service.saleStart
        ? service.saleStart.toDate()
        : undefined;
      const endDate = service.saleEnd instanceof Date
        ? service.saleEnd
        : service.saleEnd && 'toDate' in service.saleEnd
        ? service.saleEnd.toDate()
        : undefined;

      if (startDate && now < startDate) return false;
      if (endDate && now > endDate) return false;
    }

    return true;
  });
}

/**
 * Sort services by various criteria
 */
export type ServiceSortOption =
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'rating-asc'
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc';

export function sortServices(services: ServiceWithOptionalDates[], sortBy: ServiceSortOption): ServiceWithOptionalDates[] {
  const sorted = [...services];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => {
        const priceA = a.basePrice || a.hourlyRate || 0;
        const priceB = b.basePrice || b.hourlyRate || 0;
        return priceA - priceB;
      });

    case 'price-desc':
      return sorted.sort((a, b) => {
        const priceA = a.basePrice || a.hourlyRate || 0;
        const priceB = b.basePrice || b.hourlyRate || 0;
        return priceB - priceA;
      });

    case 'rating-desc':
      return sorted.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });

    case 'rating-asc':
      return sorted.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingA - ratingB;
      });

    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : 'toDate' in a.createdAt
          ? a.createdAt.toDate().getTime()
          : 0;
        const dateB = b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : 'toDate' in b.createdAt
          ? b.createdAt.toDate().getTime()
          : 0;
        return dateB - dateA;
      });

    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : 'toDate' in a.createdAt
          ? a.createdAt.toDate().getTime()
          : 0;
        const dateB = b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : 'toDate' in b.createdAt
          ? b.createdAt.toDate().getTime()
          : 0;
        return dateA - dateB;
      });

    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    default:
      return sorted;
  }
}

/**
 * Check if a service is new (created within the last 30 days)
 */
export function isNewService(service: ServiceWithOptionalDates, daysThreshold: number = 30): boolean {
  const createdAt = service.createdAt instanceof Date
    ? service.createdAt
    : 'toDate' in service.createdAt
    ? service.createdAt.toDate()
    : new Date();

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= daysThreshold;
}

/**
 * Get service status label
 */
export function getServiceStatusLabel(service: ServiceWithOptionalDates): {
  label: string;
  color: string;
} {
  if (!service.isActive) {
    return {
      label: 'Inactive',
      color: 'bg-gray-100 text-gray-800',
    };
  }

  if (service.isFeatured) {
    return {
      label: 'Featured',
      color: 'bg-yellow-100 text-yellow-800',
    };
  }

  if (service.onSale) {
    return {
      label: 'On Sale',
      color: 'bg-red-100 text-red-800',
    };
  }

  if (isNewService(service)) {
    return {
      label: 'New',
      color: 'bg-green-100 text-green-800',
    };
  }

  return {
    label: 'Active',
    color: 'bg-blue-100 text-blue-800',
  };
}

/**
 * Paginate services array
 */
export function paginateServices(
  services: ServiceWithOptionalDates[],
  page: number,
  itemsPerPage: number
): {
  services: ServiceWithOptionalDates[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalItems = services.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = services.slice(startIndex, endIndex);

  return {
    services: paginatedServices,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Get unique categories from services list
 */
export function getUniqueCategories(services: ServiceWithOptionalDates[]): Array<{ id: string; name: string }> {
  const categoryMap = new Map<string, string>();

  services.forEach(service => {
    if (service.categoryId) {
      // We don't have category name in service, so we'll just use the ID
      // In real implementation, you might want to fetch category details
      categoryMap.set(service.categoryId, service.categoryId);
    }
  });

  return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
}

/**
 * Calculate service statistics for a list of services
 */
export function getServiceStats(services: ServiceWithOptionalDates[]) {
  const total = services.length;
  const active = services.filter(s => s.isActive).length;
  const featured = services.filter(s => s.isFeatured).length;
  const onSale = filterServicesOnSale(services).length;
  const newServices = services.filter(s => isNewService(s)).length;

  const avgRating = services.reduce((sum, s) => sum + (s.averageRating || 0), 0) / total || 0;
  const totalReviews = services.reduce((sum, s) => sum + (s.totalReviews || 0), 0);

  return {
    total,
    active,
    featured,
    onSale,
    new: newServices,
    avgRating: Number(avgRating.toFixed(2)),
    totalReviews,
  };
}
