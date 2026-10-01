import { Timestamp } from 'firebase/firestore';

/**
 * Calculator Feature
 * Represents an individual feature in the calculator
 */
export interface CalculatorFeature {
  id: string;
  label: string;
  hours: number;
  description?: string;
  quantityFrom?: string;
  mandatory?: boolean; // If true, cannot be toggled off
  conditional?: {
    showWhen: string; // Field ID that controls visibility
    value: string | number | boolean; // Value that triggers visibility
  };
  hasQuantity?: boolean; // If true, shows a quantity input
  quantityLabel?: string; // Label for the quantity field (e.g., "Number of pages")
  minQuantity?: number;
  maxQuantity?: number;
  defaultQuantity?: number;
}

/**
 * Calculator Step
 * Represents a page/step in the calculator
 */
export interface CalculatorStep {
  id: string;
  title: string;
  description?: string;
  fields: (CalculatorFeature | CalculatorConfigField)[];
}

/**
 * Calculator Config Field
 * Represents configuration fields like website type, hourly rate, etc.
 */
export interface CalculatorConfigField {
  id: string;
  type: 'select' | 'number' | 'text' | 'pages';
  label: string;
  defaultValue?: string | number;
  helpText?: string;
  options?: Array<{
    label: string;
    value: string | number;
    hours?: number;
    description?: string;
    examples?: string[];
    suggestedPages?: string[];
    package?: CalculatorPackage;
  }>;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

/**
 * Calculator Settings
 * Main calculator configuration
 */
export interface CalculatorPackage {
  pageFieldId?: string;
  includedPages: string[];
  includedFeatureIds: string[];
  recommendedFeatureIds: string[];
  includedServices: string[];
}

export interface Calculator {
  id: string;
  name: string;
  slug: string;
  description?: string;
  headerCopy?: string;
  footerCopy?: string;
  defaultHourlyRate: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  steps: CalculatorStep[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

/**
 * Serialized Calculator for client components
 * Timestamps are converted to ISO strings
 */
export type SerializedCalculator = Omit<Calculator, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

/**
 * Calculator Submission
 * Stores user submissions for analytics/lead generation
 */
export interface CalculatorSubmission {
  id: string;
  calculatorId: string;
  calculatorName: string;
  selections: Record<string, boolean | number | string>;
  config?: Record<string, string | number>;
  pageSelections?: Record<string, CalculatorPageSelection>;
  pageSummaries?: Record<string, string>;
  basePrice?: number;
  additionsPrice?: number;
  packageNames?: string[];
  packageServices?: string[];
  lineItems?: CalculatorLineItem[];
  consent?: boolean;
  totalHours: number;
  totalPrice: number;
  hourlyRate: number;
  contactInfo?: {
    name?: string;
    email?: string;
    company?: string;
  };
  submittedAt: Timestamp;
  status: 'pending' | 'contacted' | 'converted' | 'archived';
}

export interface CalculatorLineItem {
  label: string;
  hours: number;
  cost: number;
  category?: 'base' | 'addition';
}

export interface CalculatorEstimate {
  totalHours: number;
  totalPrice: number;
  hourlyRate: number;
  lineItems: CalculatorLineItem[];
  basePrice: number;
  additionsPrice: number;
  packageNames: string[];
  packageServices: string[];
}

export interface CalculatorSubmissionRequest {
  calculatorId: string;
  selections: Record<string, boolean | number | string>;
  config: Record<string, string | number>;
  pageSelections?: Record<string, CalculatorPageSelection>;
  contactInfo: { name: string; email: string };
  consent: boolean;
  website: string;
}

export interface CalculatorPageSelection {
  pages: string[];
  otherPages: string[];
  unsure: boolean;
}

/**
 * Default calculator template
 */
export const DEFAULT_CALCULATOR: Omit<Calculator, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  name: 'Website Cost Calculator',
  slug: 'website-calculator',
  description: 'Calculate the cost of your custom website project',
  headerCopy: 'Fill in the features below and calculate custom web design price with our free website cost calculator.',
  footerCopy: '',
  defaultHourlyRate: 150,
  minHourlyRate: 10,
  maxHourlyRate: 1000,
  isActive: true,
  steps: [
    {
      id: 'step-1',
      title: 'Project Basics',
      description: 'Tell us about your project',
      fields: [
        {
          id: 'website_type',
          type: 'select',
          label: 'Website Type',
          helpText: 'Choose an informational website or an online store with product and checkout setup.',
          defaultValue: 'informational',
          options: [
            { label: 'Informational', value: 'informational', hours: 0 },
            { label: 'E-Commerce', value: 'ecommerce', hours: 40 },
          ],
          required: true,
        },
        {
          id: 'num_pages',
          type: 'pages',
          label: 'Which pages does your website need?',
          helpText: 'Choose what you have in mind. We’ll help confirm the pages during your consultation.',
          defaultValue: 2,
          min: 1,
          max: 100,
          required: true,
        },
      ],
    },
    {
      id: 'step-2',
      title: 'Features & Services',
      description: 'Select the features you need',
      fields: [
        {
          id: 'site_planning',
          label: 'Site Planning',
          description: 'Plan the pages, navigation and requirements before design begins.',
          hours: 25,
          mandatory: true,
        },
        {
          id: 'landing_page_design',
          label: 'Page design & development',
          hours: 40,
          quantityFrom: 'num_pages',
          description: 'Design and build each distinct page layout, including mobile layouts.',
          mandatory: true,
        },
        {
          id: 'onsite_optimization',
          label: 'Onsite Optimization',
          description: 'Prepare page structure, metadata and performance basics for launch.',
          hours: 30,
          mandatory: true,
        },
        {
          id: 'copywriting',
          label: 'Copywriting',
          description: 'Write original website content for the number of pages you select.',
          hours: 25,
          hasQuantity: true,
          quantityLabel: 'Number of Pages',
          defaultQuantity: 10,
          minQuantity: 1,
        },
        {
          id: 'multi_language',
          label: 'Multi-Language Feature',
          description: 'Add support for additional languages. Translation scope is confirmed during consultation.',
          hours: 25,
          hasQuantity: true,
          quantityLabel: 'Number of Languages',
          defaultQuantity: 1,
          minQuantity: 1,
        },
        {
          id: 'content_migration',
          label: 'Content Migration',
          description: 'Move existing content to your new website; the amount is confirmed during scope review.',
          hours: 20,
        },
        {
          id: 'motion_graphics',
          label: 'Motion Graphics',
          description: 'Add custom animations to explain your service or bring key sections to life.',
          hours: 30,
          hasQuantity: true,
          quantityLabel: 'Number of Animations',
          defaultQuantity: 1,
          minQuantity: 1,
        },
        {
          id: 'basic_search',
          label: 'Basic Search',
          description: 'Help visitors find pages and content through a site search.',
          hours: 15,
        },
        {
          id: 'interactive_map',
          label: 'Interactive Map',
          description: 'Let visitors explore your location or service area on a map.',
          hours: 20,
        },
        {
          id: 'events_calendar',
          label: 'Events Calendar',
          description: 'Publish upcoming events in a calendar visitors can browse.',
          hours: 25,
        },
        {
          id: 'chat_feature',
          label: 'Chat Feature',
          description: 'Connect visitors with your team through a website chat tool.',
          hours: 30,
        },
        {
          id: 'project_management',
          label: 'Project Management & Client Communication',
          description: 'Coordinate milestones, feedback and project updates from planning through delivery.',
          hours: 35,
          mandatory: true,
        },
      ],
    },
  ],
};
