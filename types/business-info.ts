import { Timestamp } from 'firebase/firestore';

export interface TimeSlot {
  id: string;
  date: string;              // Format: YYYY-MM-DD
  startTime: string;         // Format: HH:MM (24-hour)
  endTime: string;           // Format: HH:MM (24-hour)
  maxOrders: number;         // Max orders for this slot
  maxItems: number;          // Max items for this slot
  currentOrders: number;     // Current orders in this slot
  currentItems: number;      // Current items in this slot
  isAvailable: boolean;      // Whether slot is still available
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimeSlotCapacity {
  ordersRemaining: number;
  itemsRemaining: number;
  isAvailable: boolean;
}

export interface StoreSettings {
  id: string;

  // Business Information
  businessName?: string;
  businessDescription?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Delivery Settings
  deliveryRadius?: number;          // Delivery radius in miles (e.g., 10)
  storeLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryEnabled?: boolean;        // Whether delivery service is enabled

  // Social Media
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    x?: string;          // Twitter/X
    linkedin?: string;
    youtube?: string;
  };

  // Notification Settings
  adminNotificationEmail?: string;  // Email address to receive new order notifications

  // Content Settings (Blog/Recipes/Style Guides)
  contentSettings?: {
    enabled: boolean;
    sectionName: string;          // e.g., "Recipes", "Style Guides", "Blog"
    sectionNamePlural: string;    // e.g., "Recipes", "Style Guides", "Blog Posts"
    itemsLabel: string;           // e.g., "Ingredients", "Featured Items", "Materials"
    itemsLabelSingular: string;   // e.g., "Ingredient", "Featured Item", "Material"
    urlSlug: string;              // e.g., "recipes", "style-guides", "blog"
    showAuthor: boolean;
    showViewCount: boolean;
    allowVendorPosts: boolean;
  };

  // Premium Features (Tier-based)
  features?: {
    analytics?: {
      enabled: boolean;
      // Google Analytics 4
      google?: {
        enabled: boolean;
        measurementId?: string;       // GA4 Measurement ID (G-XXXXXXXXXX)
        siteVerification?: string;    // Google Search Console verification code
        trackEcommerce?: boolean;     // Track ecommerce events
        anonymizeIp?: boolean;        // GDPR: Anonymize IP addresses
      };
      // Microsoft Bing + Clarity
      bing?: {
        enabled: boolean;
        siteVerification?: string;    // Bing Webmaster Tools verification code
        clarityId?: string;           // Microsoft Clarity project ID
        trackHeatmaps?: boolean;      // Enable heatmaps/session recordings
      };
      // Global analytics settings
      cookieConsent?: boolean;        // Show cookie consent banner
      dataRetentionDays?: number;     // How long to retain analytics data
    };
    // Future premium features can be added here:
    // advancedSeo?: { enabled: boolean; };
    // emailMarketing?: { enabled: boolean; };
    // inventorySync?: { enabled: boolean; };
  };

  // Time Slot Settings
  maxOrdersPerHour: number;    // Default: 10
  maxItemsPerHour: number;      // Default: 100
  slotDurationMinutes: number;  // Default: 60 (1 hour slots)
  advanceBookingDays: number;   // How many days in advance can customers book
  operatingHours: {
    [key: string]: {           // Key: day of week (0-6, 0 = Sunday)
      open: string;            // Format: HH:MM
      close: string;           // Format: HH:MM
      closed: boolean;         // True if store is closed this day
    };
  };
  blackoutDates: string[];     // Dates when store is closed (YYYY-MM-DD)
  updatedAt: Timestamp;
}

// Default store settings
export const DEFAULT_STORE_SETTINGS: Omit<StoreSettings, 'id' | 'updatedAt'> = {
  contentSettings: {
    enabled: true,
    sectionName: 'Blog',
    sectionNamePlural: 'Blog Posts',
    itemsLabel: 'Featured Products',
    itemsLabelSingular: 'Featured Product',
    urlSlug: 'blog',
    showAuthor: true,
    showViewCount: false,
    allowVendorPosts: false,
  },
  maxOrdersPerHour: 10,
  maxItemsPerHour: 100,
  slotDurationMinutes: 60,
  advanceBookingDays: 7,
  operatingHours: {
    '0': { open: '09:00', close: '18:00', closed: false }, // Sunday
    '1': { open: '08:00', close: '20:00', closed: false }, // Monday
    '2': { open: '08:00', close: '20:00', closed: false }, // Tuesday
    '3': { open: '08:00', close: '20:00', closed: false }, // Wednesday
    '4': { open: '08:00', close: '20:00', closed: false }, // Thursday
    '5': { open: '08:00', close: '20:00', closed: false }, // Friday
    '6': { open: '08:00', close: '20:00', closed: false }, // Saturday
  },
  blackoutDates: [],
};

// Helper to format time slot for display
export const formatTimeSlot = (startTime: string, endTime: string): string => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Helper to format date for display
export const formatSlotDate = (dateString: string): string => {
  // Parse date string in local timezone (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to midnight for comparison

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const isToday = dateOnly.getTime() === today.getTime();
  const isTomorrow = dateOnly.getTime() === tomorrow.getTime();

  if (isToday) return 'Today - ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (isTomorrow) return 'Tomorrow - ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

// Helper to check if a time slot is full
export const isTimeSlotFull = (slot: TimeSlot): boolean => {
  return slot.currentOrders >= slot.maxOrders || slot.currentItems >= slot.maxItems;
};

// Helper to get capacity percentage
export const getCapacityPercentage = (slot: TimeSlot): number => {
  const orderPercentage = (slot.currentOrders / slot.maxOrders) * 100;
  const itemPercentage = (slot.currentItems / slot.maxItems) * 100;
  return Math.max(orderPercentage, itemPercentage);
};

// Helper to generate time slot ID
export const generateTimeSlotId = (date: string, startTime: string): string => {
  return `${date}_${startTime.replace(':', '')}`;
};
