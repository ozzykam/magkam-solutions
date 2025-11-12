import { NextRequest, NextResponse } from 'next/server';

/**
 * Geocode API endpoint
 * Converts an address to latitude/longitude coordinates
 * Uses Google Geocoding API
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Get Google Maps API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key not configured');
      // Return null coordinates instead of error to allow checkout to continue
      return NextResponse.json(
        { latitude: null, longitude: null, warning: 'Geocoding not configured' },
        { status: 200 }
      );
    }

    // Call Google Geocoding API
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding failed:', data.status, data.error_message);
      // Return null coordinates instead of error to allow checkout to continue
      return NextResponse.json(
        { latitude: null, longitude: null, warning: 'Could not geocode address' },
        { status: 200 }
      );
    }

    // Extract coordinates from first result
    const location = data.results[0].geometry.location;

    return NextResponse.json({
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: data.results[0].formatted_address,
    });
  } catch (error) {
    console.error('Geocoding API error:', error);
    // Return null coordinates instead of error to allow checkout to continue
    return NextResponse.json(
      { latitude: null, longitude: null, warning: 'Geocoding service unavailable' },
      { status: 200 }
    );
  }
}
