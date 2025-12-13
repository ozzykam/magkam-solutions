import { Timestamp } from 'firebase/firestore';

export interface ThemeSettings {
  // Brand Colors
  primaryColor: string;       // Hex color (e.g., "#3B82F6")
  secondaryColor: string;     // Hex color (e.g., "#10B981")

  // Typography
  fontFamily: string;         // Font name (e.g., "Inter", "Poppins", "Roboto")

  // Branding Assets
  logo?: string;              // Logo image URL from Firebase Storage
  favicon?: string;           // Favicon image URL from Firebase Storage
}

export interface HomepageSettings {
  // Hero Section
  hero: {
    headline: string;           // e.g., "Local Services"
    highlightedText: string;    // e.g., "Delivered to Your Door" (highlighted in primary color)
    subtitle: string;           // e.g., "Websites and Digital Solutions for Small Businesses."
    primaryCTA: {
      text: string;             // e.g., "Shop Now"
      link: string;             // e.g., "/services"
    };
    secondaryCTA: {
      text: string;             // e.g., "Learn More"
      link: string;             // e.g., "/about"
    };
  };

  // Features Section
  features: {
    feature1: {
      title: string;            // e.g., "Fresh & Local"
      description: string;      // e.g., "All services guaranteed."
      icon: string;             // Icon identifier (check, clock, shield, etc.)
    };
    feature2: {
      title: string;
      description: string;
      icon: string;
    };
    feature3: {
      title: string;
      description: string;
      icon: string;
    };
  };

  // CTA Section
  cta: {
    heading: string;            // e.g., "Ready to support local?"
    subtitle: string;           // e.g., "Join thousands of customers..."
    buttonText: string;         // e.g., "Create Your Account"
    buttonLink: string;         // e.g., "/register"
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  openInNewTab?: boolean;
  children?: NavigationItem[];  // For dropdown menus
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
}

export interface NavigationSettings {
  mainNav: NavigationItem[];
  showLogo?: boolean;
  showSearch?: boolean;
  showUserMenu?: boolean;
}

export interface StoreSettings {
  id: string;

  // Business Information
  businessName?: string;
  tagline?: string;
  businessDescription?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  operatingHours?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  }

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

  // Theme Settings
  themeSettings?: ThemeSettings;

  // Homepage Settings
  homepageSettings?: HomepageSettings;

  // Navigation Settings
  navigationSettings?: NavigationSettings;

  // Service Settings
  serviceSettings?: {
    enabled: boolean;
    serviceName: string;          // e.g., "Service", "Product", "Solution", "Offering"
    serviceNamePlural: string;    // e.g., "Services", "Products", "Solutions", "Offerings"
    urlSlug: string;              // e.g., "services", "products", "solutions", "offerings"
  };

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
    // Analytics
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

    // Calculators
    calculators?: {
      enabled: boolean;
      showInNavigation?: boolean;     // Show calculators link in main navigation
    };

    // Reviews & Ratings
    reviews?: {
      enabled: boolean;
      allowAnonymous?: boolean;       // Allow reviews without login
      requireModeration?: boolean;    // Admin must approve reviews before showing
      allowPhotos?: boolean;          // Allow photo uploads in reviews
    };

    // Content Bookmarks
    bookmarks?: {
      enabled: boolean;
      showInNavigation?: boolean;     // Show bookmarks link in navigation
    };

    // Contact Forms
    contact?: {
      enabled: boolean;
      requireAuth?: boolean;          // Require login to submit contact form
      notificationEmail?: string;     // Override admin notification email
    };

    // User Registration
    userRegistration?: {
      enabled: boolean;
      requireEmailVerification?: boolean;  // Require email verification
      allowSocialLogin?: boolean;     // Enable Google/Facebook login
    };

    // Search
    search?: {
      enabled: boolean;
      searchServices?: boolean;       // Include services in search
      searchContent?: boolean;        // Include content in search
    };
  };

  updatedAt: Timestamp;
}

// Default store settings
export const DEFAULT_STORE_SETTINGS: Omit<StoreSettings, 'id' | 'updatedAt'> = {
  themeSettings: {
    primaryColor: '#3B82F6',      // Blue-500
    secondaryColor: '#10B981',    // Green-500
    fontFamily: 'Inter',
  },
  homepageSettings: {
    hero: {
      headline: 'Professional Services',
      highlightedText: 'Tailored to Your Needs',
      subtitle: 'Expert solutions to help your business grow and succeed.',
      primaryCTA: {
        text: 'View Our Services',
        link: '/solutions',
      },
      secondaryCTA: {
        text: 'Learn More',
        link: '/about',
      },
    },
    features: {
      feature1: {
        title: 'Quality Service',
        description: 'Professional service with attention to detail and excellence.',
        icon: 'check',
      },
      feature2: {
        title: 'Fast Turnaround',
        description: 'Efficient delivery without compromising on quality.',
        icon: 'clock',
      },
      feature3: {
        title: 'Satisfaction Guaranteed',
        description: '100% satisfaction guarantee or your money back.',
        icon: 'shield',
      },
    },
    cta: {
      heading: 'Ready to Get Started?',
      subtitle: 'Join our growing community of satisfied clients',
      buttonText: 'Create Your Account',
      buttonLink: '/register',
    },
  },
  serviceSettings: {
    enabled: true,
    serviceName: 'Service',
    serviceNamePlural: 'Services',
    urlSlug: 'services',
  },
  contentSettings: {
    enabled: true,
    sectionName: 'Blog',
    sectionNamePlural: 'Blog Posts',
    itemsLabel: 'Featured Services',
    itemsLabelSingular: 'Featured Service',
    urlSlug: 'blog',
    showAuthor: true,
    showViewCount: false,
    allowVendorPosts: false,
  },
  features: {
    analytics: {
      enabled: false,
      google: {
        enabled: false,
        trackEcommerce: false,
        anonymizeIp: true,
      },
      bing: {
        enabled: false,
        trackHeatmaps: false,
      },
      cookieConsent: true,
      dataRetentionDays: 90,
    },
    calculators: {
      enabled: true,
      showInNavigation: true,
    },
    reviews: {
      enabled: true,
      allowAnonymous: false,
      requireModeration: false,
      allowPhotos: true,
    },
    bookmarks: {
      enabled: true,
      showInNavigation: true,
    },
    contact: {
      enabled: true,
      requireAuth: false,
    },
    userRegistration: {
      enabled: true,
      requireEmailVerification: false,
      allowSocialLogin: false,
    },
    search: {
      enabled: true,
      searchServices: true,
      searchContent: true,
    },
  },
};
