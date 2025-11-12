import { Timestamp } from 'firebase/firestore';

/**
 * SEO Configuration for a specific page or route
 */
export interface SEOPageConfig {
  title?: string;                    // Page title (supports template variables)
  description?: string;              // Meta description
  keywords?: string[];               // Page-specific keywords
  ogImage?: string;                  // Open Graph image URL
  noindex?: boolean;                 // Prevent search engine indexing
}

/**
 * SEO Template Configuration for dynamic pages
 * Supports variable substitution like {name}, {businessName}
 */
export interface SEOTemplateConfig {
  titleTemplate: string;             // e.g., "{name} | {businessName}"
  descriptionTemplate?: string;      // e.g., "Buy {name} from {vendorName}"
  keywords: string[];                // Template-level keywords
}

/**
 * Complete SEO Settings Document
 * Stored in Firestore at: seoSettings/main
 */
export interface SEOSettings {
  // Global site-wide defaults
  global: {
    keywords: string[];              // Default keywords for all pages
    description: string;             // Fallback meta description
    ogImage?: string;                // Default Open Graph image URL
    twitterCard: 'summary' | 'summary_large_image';
  };

  // Page-specific overrides (exact routes)
  // Key is the route path, e.g., "/shop", "/about"
  pages: {
    [route: string]: SEOPageConfig;
  };

  // Wildcard route patterns
  // Key is the pattern, e.g., "/products/*", "/account/*"
  patterns: {
    [pattern: string]: SEOPageConfig;
  };

  // Dynamic page templates with variable substitution
  templates: {
    product: SEOTemplateConfig;
    category: SEOTemplateConfig;
    vendor: SEOTemplateConfig;
    contentPost: SEOTemplateConfig;
  };

  // Metadata
  updatedAt: Timestamp;
}

/**
 * Template variable types for type safety
 */
export interface ProductTemplateVariables {
  name: string;
  categoryName: string;
  vendorName: string;
  description: string;
  price: string;
  businessName: string;
}

export interface CategoryTemplateVariables {
  name: string;
  description: string;
  productCount: string;
  businessName: string;
}

export interface VendorTemplateVariables {
  name: string;
  description: string;
  city: string;
  businessName: string;
}

export interface ContentPostTemplateVariables {
  title: string;
  excerpt: string;
  authorName: string;
  categoryName: string;
  businessName: string;
}

export type TemplateVariables =
  | ProductTemplateVariables
  | CategoryTemplateVariables
  | VendorTemplateVariables
  | ContentPostTemplateVariables
  | Record<string, string>;

/**
 * SEO Template Type Union
 */
export type SEOTemplateType = 'product' | 'category' | 'vendor' | 'contentPost';

/**
 * Default SEO Settings
 * Used when no custom settings exist
 */
export const DEFAULT_SEO_SETTINGS: Omit<SEOSettings, 'updatedAt'> = {
  global: {
    keywords: [
      'local products',
      'fresh food',
      'farmers market',
      'organic',
      'local delivery',
      'farm to table',
    ],
    description: 'Shop fresh, local products from trusted vendors in your community.',
    twitterCard: 'summary_large_image',
  },
  pages: {
    '/shop': {
      title: 'Shop All Products | {businessName}',
      description: 'Browse our complete selection of fresh, local products. Filter by category, vendor, and tags to find exactly what you need.',
      keywords: ['shop', 'products', 'buy online', 'local shopping', 'browse'],
    },
    '/about': {
      title: 'About Us | {businessName}',
      description: 'Learn about our mission to connect local producers with customers in the community.',
      keywords: ['about', 'our story', 'mission', 'local business', 'community'],
    },
    '/contact': {
      title: 'Contact Us | {businessName}',
      description: 'Get in touch with our team. We\'re here to help with orders, questions, and support.',
      keywords: ['contact', 'customer service', 'support', 'help', 'get in touch'],
    },
    '/vendors': {
      title: 'Our Vendors | {businessName}',
      description: 'Meet the local farmers and producers we work with. Supporting local businesses in our community.',
      keywords: ['vendors', 'farmers', 'producers', 'local businesses', 'partners'],
    },
    '/terms': {
      title: 'Terms of Service | {businessName}',
      description: 'Terms and conditions for using our services. Read our policies on orders, payments, and delivery.',
      keywords: ['terms', 'terms of service', 'policies', 'legal'],
    },
    '/privacy': {
      title: 'Privacy Policy | {businessName}',
      description: 'Learn how we collect, use, and protect your personal information. Your privacy is important to us.',
      keywords: ['privacy', 'privacy policy', 'data protection', 'security'],
    },
  },
  patterns: {
    '/account/*': {
      noindex: true,  // Don't index private account pages
    },
    '/cart': {
      noindex: true,
    },
    '/checkout': {
      noindex: true,
    },
    '/wishlist': {
      noindex: true,
    },
    '/bookmarks': {
      noindex: true,
    },
  },
  templates: {
    product: {
      titleTemplate: '{name} - {categoryName} | {businessName}',
      descriptionTemplate: '{description}',
      keywords: ['product', 'buy', 'shop', 'local', 'fresh'],
    },
    category: {
      titleTemplate: '{name} | {businessName}',
      descriptionTemplate: 'Shop {name} products from local vendors. {description}',
      keywords: ['category', 'browse', 'shop by category', 'products'],
    },
    vendor: {
      titleTemplate: '{name} - Local Vendor | {businessName}',
      descriptionTemplate: 'Shop products from {name}. {description}',
      keywords: ['vendor', 'local farmer', 'producer', 'supplier'],
    },
    contentPost: {
      titleTemplate: '{title} | {businessName}',
      descriptionTemplate: '{excerpt}',
      keywords: ['blog', 'article', 'guide', 'tips', 'recipes'],
    },
  },
};

/**
 * Type for SEO validation errors
 */
export interface SEOValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * SEO validation rules
 */
export const SEO_VALIDATION_RULES = {
  keywords: {
    min: 3,
    max: 15,
    maxLength: 30,
  },
  description: {
    min: 50,
    max: 160,
    warningThreshold: 150,
  },
  title: {
    min: 20,
    max: 60,
    warningThreshold: 55,
  },
  ogImage: {
    maxSizeMB: 2,
    recommendedWidth: 1200,
    recommendedHeight: 630,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },
};
