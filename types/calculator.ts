import { Timestamp } from 'firebase/firestore';

/**
 * Calculator Feature
 * Represents an individual feature in the calculator
 */
export interface CalculatorFeature {
  id: string;
  label: string;
  hours: number;
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
  type: 'select' | 'number' | 'text';
  label: string;
  defaultValue?: string | number;
  options?: Array<{
    label: string;
    value: string | number;
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
 * Calculator Submission
 * Stores user submissions for analytics/lead generation
 */
export interface CalculatorSubmission {
  id: string;
  calculatorId: string;
  calculatorName: string;
  selections: Record<string, boolean | number | string>;
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
          defaultValue: 'informational',
          options: [
            { label: 'Informational', value: 'informational' },
            { label: 'E-Commerce', value: 'ecommerce' },
          ],
          required: true,
        },
        {
          id: 'num_pages',
          type: 'number',
          label: 'No. of Unique Landing Pages',
          defaultValue: 5,
          min: 1,
          required: true,
        },
        {
          id: 'hourly_rate',
          type: 'number',
          label: 'Hourly Rate',
          defaultValue: 150,
          min: 10,
          max: 1000,
          step: 10,
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
          hours: 25,
          mandatory: true,
        },
        {
          id: 'landing_page_design',
          label: 'Each Unique Landing Page Design & Development',
          hours: 40,
          mandatory: true,
        },
        {
          id: 'onsite_optimization',
          label: 'Onsite Optimization',
          hours: 30,
          mandatory: true,
        },
        {
          id: 'copywriting',
          label: 'Copywriting',
          hours: 25,
          hasQuantity: true,
          quantityLabel: 'Number of Pages',
          defaultQuantity: 10,
          minQuantity: 1,
        },
        {
          id: 'multi_language',
          label: 'Multi-Language Feature',
          hours: 25,
          hasQuantity: true,
          quantityLabel: 'Number of Languages',
          defaultQuantity: 1,
          minQuantity: 1,
        },
        {
          id: 'content_migration',
          label: 'Content Migration',
          hours: 20,
        },
        {
          id: 'motion_graphics',
          label: 'Motion Graphics',
          hours: 30,
          hasQuantity: true,
          quantityLabel: 'Number of Animations',
          defaultQuantity: 1,
          minQuantity: 1,
        },
        {
          id: 'basic_search',
          label: 'Basic Search',
          hours: 15,
        },
        {
          id: 'interactive_map',
          label: 'Interactive Map',
          hours: 20,
        },
        {
          id: 'events_calendar',
          label: 'Events Calendar',
          hours: 25,
        },
        {
          id: 'chat_feature',
          label: 'Chat Feature',
          hours: 30,
        },
        {
          id: 'project_management',
          label: 'Project Management & Client Communication',
          hours: 35,
          mandatory: true,
        },
      ],
    },
  ],
};
