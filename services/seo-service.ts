import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  SEOSettings,
  SEOPageConfig,
  SEOTemplateConfig,
  SEOTemplateType,
  TemplateVariables,
  DEFAULT_SEO_SETTINGS,
  SEOValidationError,
  SEO_VALIDATION_RULES,
} from '@/types/seo';

/**
 * Get all SEO settings from Firestore
 * Returns default settings if none exist
 */
export async function getAllSEOSettings(): Promise<SEOSettings> {
  try {
    const seoDoc = await getDoc(doc(db, 'seoSettings', 'main'));

    if (!seoDoc.exists()) {
      // Return defaults if no settings exist yet
      return {
        ...DEFAULT_SEO_SETTINGS,
        updatedAt: Timestamp.now(),
      };
    }

    return seoDoc.data() as SEOSettings;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    // Return defaults on error
    return {
      ...DEFAULT_SEO_SETTINGS,
      updatedAt: Timestamp.now(),
    };
  }
}

/**
 * Update SEO settings in Firestore
 */
export async function updateSEOSettings(settings: Partial<SEOSettings>): Promise<void> {
  try {
    const seoRef = doc(db, 'seoSettings', 'main');
    const existingDoc = await getDoc(seoRef);

    if (existingDoc.exists()) {
      // Update existing settings
      await setDoc(seoRef, {
        ...existingDoc.data(),
        ...settings,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } else {
      // Create new settings with defaults
      await setDoc(seoRef, {
        ...DEFAULT_SEO_SETTINGS,
        ...settings,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    throw error;
  }
}

/**
 * Initialize SEO settings with defaults if they don't exist
 * Should be called on first admin access
 */
export async function initializeSEOSettings(): Promise<void> {
  try {
    const seoRef = doc(db, 'seoSettings', 'main');
    const seoDoc = await getDoc(seoRef);

    if (!seoDoc.exists()) {
      await setDoc(seoRef, {
        ...DEFAULT_SEO_SETTINGS,
        updatedAt: Timestamp.now(),
      });
      console.log('SEO settings initialized with defaults');
    }
  } catch (error) {
    console.error('Error initializing SEO settings:', error);
    throw error;
  }
}

/**
 * Get SEO configuration for a specific route
 * Priority: Exact match > Pattern match > Global defaults
 */
export async function getSEOForRoute(route: string): Promise<SEOPageConfig> {
  try {
    const settings = await getAllSEOSettings();

    // 1. Check for exact route match
    if (settings.pages[route]) {
      return mergeSEOConfigs(
        createGlobalConfig(settings),
        settings.pages[route]
      );
    }

    // 2. Check for pattern match
    const patternMatch = matchRoutePattern(route, settings.patterns);
    if (patternMatch) {
      return mergeSEOConfigs(
        createGlobalConfig(settings),
        patternMatch
      );
    }

    // 3. Return global defaults
    return createGlobalConfig(settings);
  } catch (error) {
    console.error('Error getting SEO for route:', route, error);
    // Return basic defaults on error
    return {
      title: 'Our Store',
      description: DEFAULT_SEO_SETTINGS.global.description,
      keywords: DEFAULT_SEO_SETTINGS.global.keywords,
    };
  }
}

/**
 * Get SEO for dynamic pages using templates
 * Applies template with variable substitution
 */
export async function getSEOForTemplate(
  templateType: SEOTemplateType,
  variables: TemplateVariables
): Promise<SEOPageConfig> {
  try {
    const settings = await getAllSEOSettings();
    const template = settings.templates[templateType];

    if (!template) {
      return createGlobalConfig(settings);
    }

    // Apply template variables
    const title = applyTemplateVariables(template.titleTemplate, variables);
    const description = template.descriptionTemplate
      ? applyTemplateVariables(template.descriptionTemplate, variables)
      : undefined;

    return {
      title,
      description,
      keywords: template.keywords,
    };
  } catch (error) {
    console.error('Error getting SEO for template:', templateType, error);
    return {
      title: 'Our Store',
      description: DEFAULT_SEO_SETTINGS.global.description,
      keywords: DEFAULT_SEO_SETTINGS.global.keywords,
    };
  }
}

/**
 * Replace template variables in a string
 * Supports: {name}, {businessName}, {description}, etc.
 */
export function applyTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template;

  // Replace each variable
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  });

  // Clean up any remaining unreplaced variables
  result = result.replace(/\{[^}]+\}/g, '');

  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/**
 * Match a route to wildcard patterns
 * Supports patterns like: /products/*, /account/*
 */
function matchRoutePattern(
  route: string,
  patterns: Record<string, SEOPageConfig>
): SEOPageConfig | null {
  for (const [pattern, config] of Object.entries(patterns)) {
    // Convert wildcard pattern to regex
    // /products/* becomes /^\/products\/.+$/
    const regexPattern = pattern
      .replace(/\*/g, '.+')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${regexPattern}$`);

    if (regex.test(route)) {
      return config;
    }
  }

  return null;
}

/**
 * Create SEO config from global settings
 */
function createGlobalConfig(settings: SEOSettings): SEOPageConfig {
  return {
    description: settings.global.description,
    keywords: settings.global.keywords,
    ogImage: settings.global.ogImage,
  };
}

/**
 * Merge SEO configs with priority to specific config
 */
function mergeSEOConfigs(
  global: SEOPageConfig,
  specific?: SEOPageConfig
): SEOPageConfig {
  if (!specific) {
    return global;
  }

  return {
    title: specific.title || global.title,
    description: specific.description || global.description,
    keywords: specific.keywords || global.keywords,
    ogImage: specific.ogImage || global.ogImage,
    noindex: specific.noindex !== undefined ? specific.noindex : global.noindex,
  };
}

/**
 * Validate SEO configuration
 * Returns array of validation errors/warnings
 */
export function validateSEOConfig(config: SEOPageConfig): SEOValidationError[] {
  const errors: SEOValidationError[] = [];

  // Validate keywords
  if (config.keywords) {
    if (config.keywords.length < SEO_VALIDATION_RULES.keywords.min) {
      errors.push({
        field: 'keywords',
        message: `At least ${SEO_VALIDATION_RULES.keywords.min} keywords recommended`,
        severity: 'warning',
      });
    }

    if (config.keywords.length > SEO_VALIDATION_RULES.keywords.max) {
      errors.push({
        field: 'keywords',
        message: `Maximum ${SEO_VALIDATION_RULES.keywords.max} keywords recommended`,
        severity: 'warning',
      });
    }

    config.keywords.forEach((keyword, index) => {
      if (keyword.length > SEO_VALIDATION_RULES.keywords.maxLength) {
        errors.push({
          field: 'keywords',
          message: `Keyword "${keyword}" exceeds ${SEO_VALIDATION_RULES.keywords.maxLength} characters`,
          severity: 'warning',
        });
      }
    });
  }

  // Validate description
  if (config.description) {
    if (config.description.length < SEO_VALIDATION_RULES.description.min) {
      errors.push({
        field: 'description',
        message: `Description should be at least ${SEO_VALIDATION_RULES.description.min} characters`,
        severity: 'warning',
      });
    }

    if (config.description.length > SEO_VALIDATION_RULES.description.max) {
      errors.push({
        field: 'description',
        message: `Description exceeds ${SEO_VALIDATION_RULES.description.max} characters (will be truncated)`,
        severity: 'error',
      });
    } else if (config.description.length > SEO_VALIDATION_RULES.description.warningThreshold) {
      errors.push({
        field: 'description',
        message: `Description is getting long (${config.description.length}/${SEO_VALIDATION_RULES.description.max} characters)`,
        severity: 'warning',
      });
    }
  }

  // Validate title
  if (config.title) {
    if (config.title.length < SEO_VALIDATION_RULES.title.min) {
      errors.push({
        field: 'title',
        message: `Title should be at least ${SEO_VALIDATION_RULES.title.min} characters`,
        severity: 'warning',
      });
    }

    if (config.title.length > SEO_VALIDATION_RULES.title.max) {
      errors.push({
        field: 'title',
        message: `Title exceeds ${SEO_VALIDATION_RULES.title.max} characters (will be truncated)`,
        severity: 'error',
      });
    } else if (config.title.length > SEO_VALIDATION_RULES.title.warningThreshold) {
      errors.push({
        field: 'title',
        message: `Title is getting long (${config.title.length}/${SEO_VALIDATION_RULES.title.max} characters)`,
        severity: 'warning',
      });
    }
  }

  return errors;
}

/**
 * Truncate text to fit SEO limits
 */
export function truncateForSEO(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate at last space before limit
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Generate a suggested meta description from content
 */
export function generateMetaDescription(content: string, maxLength = 160): string {
  // Strip HTML tags
  const stripped = content.replace(/<[^>]*>/g, '');

  // Remove extra whitespace
  const cleaned = stripped.replace(/\s+/g, ' ').trim();

  // Truncate to fit
  return truncateForSEO(cleaned, maxLength);
}
