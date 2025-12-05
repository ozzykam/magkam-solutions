/**
 * Pricing Helper Utilities
 *
 * Functions to handle service pricing display logic across all pricing types:
 * - Fixed price
 * - Starting from price
 * - Hourly rate
 * - Package pricing
 * - Custom quote
 */

import { Service } from '@/types/services';

/**
 * Get the display text for a service's pricing
 * Handles all pricing types and formats them appropriately
 */
export function getPricingDisplay(service: Service): string {
  switch (service.pricingType) {
    case 'fixed':
      if (service.basePrice !== undefined && service.basePrice !== null) {
        return `$${service.basePrice.toFixed(2)}`;
      }
      return 'Contact for Pricing';

    case 'starting_from':
      if (service.basePrice !== undefined && service.basePrice !== null) {
        return `Starting at $${service.basePrice.toFixed(2)}`;
      }
      return 'Contact for Pricing';

    case 'hourly':
      if (service.hourlyRate !== undefined && service.hourlyRate !== null) {
        return `$${service.hourlyRate.toFixed(2)}/hour`;
      }
      return 'Contact for Pricing';

    case 'package':
      return service.priceDisplayText || 'Package Pricing';

    case 'custom_quote':
      return 'Request a Quote';

    default:
      return 'Contact for Pricing';
  }
}

/**
 * Get just the numeric price for sorting/filtering
 * Returns the base numeric value regardless of pricing type
 */
export function getNumericPrice(service: Service): number {
  switch (service.pricingType) {
    case 'fixed':
    case 'starting_from':
      return service.basePrice || 0;

    case 'hourly':
      return service.hourlyRate || 0;

    case 'package':
    case 'custom_quote':
      // For package/custom, return 0 or a configured value
      return service.basePrice || 0;

    default:
      return 0;
  }
}

/**
 * Get the pricing type label for display
 */
export function getPricingTypeLabel(pricingType: Service['pricingType']): string {
  switch (pricingType) {
    case 'fixed':
      return 'Fixed Price';
    case 'starting_from':
      return 'Starting From';
    case 'hourly':
      return 'Hourly Rate';
    case 'package':
      return 'Package Deal';
    case 'custom_quote':
      return 'Custom Quote';
    default:
      return 'Pricing';
  }
}

/**
 * Format a price for display with dollar sign and two decimals
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) {
    return '$0.00';
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Format a price with separate dollars and cents for large display
 * Returns { dollars: "99", cents: "99" }
 */
export function formatPriceParts(price: number): { dollars: string; cents: string } {
  const dollars = Math.floor(price);
  const cents = Math.round((price % 1) * 100);

  return {
    dollars: dollars.toString(),
    cents: cents.toString().padStart(2, '0'),
  };
}

/**
 * Check if a service has a valid price to display
 */
export function hasValidPrice(service: Service): boolean {
  switch (service.pricingType) {
    case 'fixed':
    case 'starting_from':
      return service.basePrice !== undefined && service.basePrice !== null && service.basePrice > 0;

    case 'hourly':
      return service.hourlyRate !== undefined && service.hourlyRate !== null && service.hourlyRate > 0;

    case 'package':
      return true; // Package always has pricing info (custom text)

    case 'custom_quote':
      return true; // Custom quote is always valid

    default:
      return false;
  }
}

/**
 * Get the badge color for pricing type
 */
export function getPricingTypeBadgeColor(pricingType: Service['pricingType']): string {
  switch (pricingType) {
    case 'fixed':
      return 'bg-blue-100 text-blue-800';
    case 'starting_from':
      return 'bg-green-100 text-green-800';
    case 'hourly':
      return 'bg-purple-100 text-purple-800';
    case 'package':
      return 'bg-orange-100 text-orange-800';
    case 'custom_quote':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Calculate the price range for display (for package deals with min/max)
 * Returns formatted string like "$99 - $199"
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
}

/**
 * Get savings amount from sale
 */
export function getSavingsAmount(originalPrice: number, salePrice: number): number {
  return originalPrice - salePrice;
}

/**
 * Format savings for display
 */
export function formatSavings(originalPrice: number, salePrice: number): string {
  const savings = getSavingsAmount(originalPrice, salePrice);
  return `Save ${formatPrice(savings)}`;
}
