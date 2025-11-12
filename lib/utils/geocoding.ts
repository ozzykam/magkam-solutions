/**
 * Geocoding utilities for converting addresses to coordinates
 * Uses Google Geocoding API
 */

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address to get latitude and longitude
 * Uses Google Geocoding API
 *
 * @param address Full address string or structured address
 * @returns Object with latitude and longitude, or null if geocoding fails
 */
export async function geocodeAddress(
  address: string | { street: string; city: string; state: string; zipCode: string; apartment?: string }
): Promise<GeocodeResult | null> {
  try {
    // Build address string
    const addressString = typeof address === 'string'
      ? address
      : `${address.street}${address.apartment ? ` ${address.apartment}` : ''}, ${address.city}, ${address.state} ${address.zipCode}`;

    // Call geocoding API endpoint
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: addressString }),
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.latitude || !data.longitude) {
      console.error('Invalid geocoding response');
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 *
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles (use 6371 for kilometers)

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if an address is within delivery range
 *
 * @param addressCoords Address coordinates {latitude, longitude}
 * @param storeCoords Store coordinates {latitude, longitude}
 * @param maxRadius Maximum delivery radius in miles
 * @returns Object with isInRange boolean and distance number
 */
export function isWithinDeliveryRange(
  addressCoords: { latitude: number; longitude: number },
  storeCoords: { latitude: number; longitude: number },
  maxRadius: number
): { isInRange: boolean; distance: number } {
  const distance = calculateDistance(
    storeCoords.latitude,
    storeCoords.longitude,
    addressCoords.latitude,
    addressCoords.longitude
  );

  return {
    isInRange: distance <= maxRadius,
    distance,
  };
}
