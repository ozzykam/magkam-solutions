'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MapPinIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';

const PickupLocation: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as StoreSettings);
        }
      } catch (error) {
        console.error('Error loading store settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Pickup Location</h3>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Format operating hours
  const formatOperatingHours = () => {
    if (!settings?.operatingHours) return null;

    const hours = settings.operatingHours;
    const weekdayHours = hours['1']; // Monday
    const sundayHours = hours['0'];

    return (
      <div className="space-y-2">
        {weekdayHours && !weekdayHours.closed && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <span>
              Mon-Sat: {formatTime(weekdayHours.open)} - {formatTime(weekdayHours.close)}
            </span>
          </div>
        )}
        {sundayHours && !sundayHours.closed && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <span>
              Sun: {formatTime(sundayHours.open)} - {formatTime(sundayHours.close)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Build Google Maps URL for embedded map
  const getMapUrl = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return null;
    }

    // If we have coordinates, use them for precise location
    if (settings?.storeLocation) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${settings.storeLocation.latitude},${settings.storeLocation.longitude}&zoom=15`;
    }

    // Otherwise, use the address
    if (settings?.address) {
      const address = `${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zipCode}`;
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=15`;
    }

    return null;
  };

  const mapUrl = getMapUrl();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Pickup Location</h3>

      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          {/* Location Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-6 h-6 text-primary-600" />
          </div>

          {/* Store Info */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-lg">
              {settings?.businessName || 'Local Market'}
            </h4>

            {settings?.address && (
              <p className="text-gray-600 mt-2">
                {settings.address.street}<br />
                {settings.address.city}, {settings.address.state} {settings.address.zipCode}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {/* Operating Hours */}
              {formatOperatingHours()}

              {/* Phone */}
              {settings?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <span>{settings.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-green-600 font-medium">
                We&apos;ll send you a notification when your order is ready for pickup
              </p>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="mt-6">
          {mapUrl ? (
            <iframe
              src={mapUrl}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg"
              title="Store Location Map"
            />
          ) : (
            <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Map unavailable</p>
                <p className="text-xs text-gray-400 mt-1">
                  {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                    ? 'Google Maps API key not configured'
                    : 'Store location not set'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickupLocation;
