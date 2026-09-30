import type { Calculator, CalculatorConfigField, CalculatorFeature, CalculatorEstimate, CalculatorPageSelection } from '../types/calculator';

type Definition = Pick<Calculator, 'steps' | 'defaultHourlyRate'>;
export type Answers = Record<string, string | number | boolean>;
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const numeric = (value: unknown, fallback: number) =>
  value !== '' && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : fallback;

export const PAGE_OPTIONS = [
  { value: 'home', label: 'Home', description: 'Introduce your business and what you offer.' },
  { value: 'about', label: 'About', description: 'Share your story, team and experience.' },
  { value: 'services', label: 'Services', description: 'Explain the services you provide.' },
  { value: 'shop', label: 'Products / Shop', description: 'A section for browsing your products.' },
  { value: 'contact', label: 'Contact', description: 'Help visitors get in touch or find you.' },
  { value: 'faq', label: 'FAQ', description: 'Answer common customer questions.' },
  { value: 'blog', label: 'Blog / News', description: 'A section for articles and updates.' },
];

/** Starting copy for the existing solution types; admins can override every field. */
export const SOLUTION_GUIDANCE: Record<string, { description: string; examples: string[]; suggestedPages: string[] }> = {
  'basic website': {
    description: 'A straightforward online presence that explains what you do and helps people contact you. A good fit when you mainly need to be found and introduce your business.',
    examples: ['A neighborhood bakery sharing its menu, opening hours and location.', 'An independent consultant introducing their services and contact details.'],
    suggestedPages: ['Home', 'About', 'Services', 'Contact', 'Menu or portfolio (if relevant)'],
  },
  'professional website': {
    description: 'A more detailed site that builds credibility and turns visitor interest into enquiries. It may include service-specific content, project examples, testimonials and enquiry forms.',
    examples: ['An architecture studio showcasing projects and explaining its design services.', 'An accounting firm describing its specialties and inviting consultation requests.'],
    suggestedPages: ['Home', 'About', 'Services', 'Contact', 'FAQ', 'Portfolio or case studies', 'Testimonials'],
  },
  'e-commerce site': {
    description: 'An online store where customers browse products, add items to a cart and pay online. Product setup, delivery options and store policies are confirmed when we review the scope.',
    examples: ['A maker selling handmade ceramics with shipping and local pickup.', 'A clothing brand offering products in different sizes and colors.'],
    suggestedPages: ['Home', 'Products / Shop', 'About', 'Contact', 'FAQ', 'Shipping & returns', 'Store policies'],
  },
  'small business solution': {
    description: 'A website with tools that support day-to-day business tasks, such as booking appointments, requesting estimates or collecting customer information. We’ll help identify which tools you actually need.',
    examples: ['A salon letting clients choose services and request appointments.', 'A cleaning company collecting quote requests and customer preferences.'],
    suggestedPages: ['Home', 'About', 'Services', 'Contact', 'FAQ', 'Bookings or quote requests', 'Customer area (if needed)'],
  },
  'enterprise solution': {
    description: 'A custom platform for more complex workflows, multiple user roles or connections to other business systems. Discovery is needed to define integrations, permissions and the full scope.',
    examples: ['A distributor giving business customers a portal to place and track orders.', 'A multi-location organization managing approvals and reporting in a staff dashboard.'],
    suggestedPages: ['Home', 'Contact', 'Sign-in', 'User dashboard', 'Admin area', 'Reports', 'Help center'],
  },
};

function solutionOptions(field: CalculatorConfigField): CalculatorConfigField {
  if (field.type !== 'select' || field.id !== 'website_type') return field;
  return { ...field, options: field.options?.map(option => {
    const key = option.label.trim().toLowerCase();
    const guidance = SOLUTION_GUIDANCE[key === 'informational' ? 'basic website' : key === 'e-commerce' ? 'e-commerce site' : key];
    return guidance ? { ...guidance, ...option } : option;
  }) };
}

/** Upgrade the original website field without changing stored hourly rates or feature hours. */
export function prepareCalculator<T extends Definition>(calculator: T): T {
  const hasPageCount = calculator.steps.some(step => step.fields.some(field => 'type' in field && field.id === 'num_pages' && (field.type === 'number' || field.type === 'pages')));
  return { ...calculator, steps: calculator.steps.map(step => ({ ...step, fields: step.fields.map(field => {
    if ('type' in field && field.id === 'num_pages' && field.type === 'number') return {
      ...field, type: 'pages' as const, label: 'Which pages does your website need?',
      helpText: 'Choose what you have in mind. We’ll help confirm the pages during your consultation.',
    };
    if ('hours' in field && field.id === 'landing_page_design' && hasPageCount) return {
      ...field, label: field.label === 'Each Unique Landing Page Design & Development' ? 'Page design & development' : field.label,
      quantityFrom: field.quantityFrom || 'num_pages',
    };
    return 'type' in field ? solutionOptions(field) : field;
  }) })) };
}

export function pageCount(field: CalculatorConfigField, selection: CalculatorPageSelection): number {
  if (selection.unsure) return Math.max(field.min ?? 1, Math.min(field.max ?? 100, Math.floor(numeric(field.defaultValue, 2))));
  return new Set(selection.pages).size + selection.otherPages.filter(name => name.trim()).length;
}

export function pageSelectionErrors(field: CalculatorConfigField, selection?: CalculatorPageSelection): string[] {
  if (!selection) return ['Choose the pages you need, or select “I’m not sure yet.”'];
  if (selection.unsure && (selection.pages.length || selection.otherPages.length)) return ['Choose specific pages or “I’m not sure yet,” not both.'];
  if (selection.pages.some(value => !PAGE_OPTIONS.some(option => option.value === value))) return ['Choose a valid page type.'];
  if (new Set(selection.pages).size !== selection.pages.length) return ['Each page type can only be selected once.'];
  const names = selection.otherPages.map(name => name.trim().toLowerCase());
  if (names.some(name => !name || name.length > 100)) return ['Give each additional page a name (up to 100 characters), or remove it.'];
  const selectedLabels = PAGE_OPTIONS.filter(option => selection.pages.includes(option.value)).map(option => option.label.toLowerCase());
  if (new Set([...selectedLabels, ...names]).size !== selectedLabels.length + names.length) return ['Give each additional page a different name.'];
  const count = pageCount(field, selection);
  if (!selection.unsure && count === 0) return ['Choose at least one page, or select “I’m not sure yet.”'];
  if (count < (field.min ?? 1) || count > (field.max ?? 100)) return [`Choose between ${field.min ?? 1} and ${field.max ?? 100} pages, or ask us to help plan your site.`];
  return [];
}

export function pageSummary(field: CalculatorConfigField, selection: CalculatorPageSelection): string {
  const count = pageCount(field, selection);
  if (selection.unsure) return `Not sure yet — provisional estimate assumes ${count} ${count === 1 ? 'page' : 'pages'}; confirm during consultation.`;
  const names = [...PAGE_OPTIONS.filter(option => selection.pages.includes(option.value)).map(option => option.label), ...selection.otherPages.map(name => name.trim()).filter(Boolean)];
  return `${count} ${count === 1 ? 'page' : 'pages'}: ${names.join(', ')}`;
}

export function initialConfig(calculator: Definition): Record<string, string | number> {
  return Object.fromEntries(calculator.steps.flatMap(step => step.fields)
    .filter((field): field is CalculatorConfigField => 'type' in field && field.id !== 'hourly_rate')
    .map(field => [field.id, field.defaultValue ?? '']));
}

export function isFeatureVisible(feature: CalculatorFeature, config: Answers, selections: Answers): boolean {
  if (!feature.conditional) return true;
  const { showWhen, value } = feature.conditional;
  return String(config[showWhen] ?? selections[showWhen] ?? false) === String(value);
}

export function featureQuantity(feature: CalculatorFeature, config: Answers, selections: Answers): number {
  if (!feature.hasQuantity && !feature.quantityFrom) return 1;
  const raw = feature.quantityFrom ? config[feature.quantityFrom] : selections[`${feature.id}_qty`];
  const min = Math.max(0, feature.minQuantity ?? 1);
  const max = Math.max(min, feature.maxQuantity ?? Number.MAX_SAFE_INTEGER);
  return Math.min(max, Math.max(min, Math.floor(numeric(raw, feature.defaultQuantity ?? min))));
}

export function configErrors(fields: Calculator['steps'][number]['fields'], config: Answers): string[] {
  return fields.flatMap(field => {
    if (!('type' in field) || field.id === 'hourly_rate') return [];
    const value = config[field.id];
    if (value === undefined || String(value).trim() === '') {
      return field.required ? [`${field.label} is required.`] : [];
    }
    if (field.type === 'number' || field.type === 'pages') {
      const n = Number(value);
      if (!Number.isFinite(n) || (field.type === 'pages' && (!Number.isSafeInteger(n) || n < (field.min ?? 1) || n > (field.max ?? 100))) || (field.min !== undefined && n < field.min) ||
          (field.max !== undefined && n > field.max) ||
          (field.step && Math.abs((n - (field.min ?? 0)) / field.step - Math.round((n - (field.min ?? 0)) / field.step)) > 1e-8)) {
        return [`Enter a valid value for ${field.label}${field.min !== undefined ? ` (minimum ${field.min})` : ''}${field.max !== undefined ? ` (maximum ${field.max})` : ''}.`];
      }
    }
    if (field.type === 'select' && !field.options?.some(option => String(option.value) === String(value))) {
      return [`Choose an option for ${field.label}.`];
    }
    return [];
  });
}

export function calculateEstimate(calculator: Definition, config: Answers, selections: Answers): CalculatorEstimate {
  const hourlyRate = calculator.defaultHourlyRate;
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error('Calculator hourly rate must be positive.');
  const lineItems: CalculatorEstimate['lineItems'] = [];
  for (const field of calculator.steps.flatMap(step => step.fields)) {
    if ('type' in field) {
      if (field.type !== 'select' || field.id === 'hourly_rate') continue;
      const option = field.options?.find(option => String(option.value) === String(config[field.id] ?? field.defaultValue));
      if (option?.hours) lineItems.push({ label: `${field.label}: ${option.label}`, hours: option.hours, cost: round(option.hours * hourlyRate) });
    } else if ((field.mandatory || selections[field.id] === true) && isFeatureVisible(field, config, selections)) {
      const quantity = featureQuantity(field, config, selections);
      const hours = round(field.hours * quantity);
      lineItems.push({ label: `${field.label}${field.hasQuantity || field.quantityFrom ? ` × ${quantity}` : ''}`, hours, cost: round(hours * hourlyRate) });
    }
  }
  if (lineItems.some(item => !Number.isFinite(item.hours) || item.hours < 0 || !Number.isFinite(item.cost))) {
    throw new Error('Calculator contains invalid pricing.');
  }
  return {
    hourlyRate, lineItems,
    totalHours: round(lineItems.reduce((sum, item) => sum + item.hours, 0)),
    totalPrice: round(lineItems.reduce((sum, item) => sum + item.cost, 0)),
  };
}

export function validateCalculator(calculator: Definition & Pick<Calculator, 'name' | 'slug' | 'minHourlyRate' | 'maxHourlyRate'>): void {
  if (!calculator.name.trim()) throw new Error('Enter a calculator name.');
  if ((calculator.minHourlyRate !== undefined && (!Number.isFinite(calculator.minHourlyRate) || calculator.minHourlyRate <= 0 || calculator.defaultHourlyRate < calculator.minHourlyRate)) ||
      (calculator.maxHourlyRate !== undefined && (!Number.isFinite(calculator.maxHourlyRate) || calculator.maxHourlyRate <= 0 || calculator.defaultHourlyRate > calculator.maxHourlyRate))) throw new Error('The hourly rate must be within the configured minimum and maximum.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(calculator.slug)) throw new Error('Use lowercase letters, numbers and single hyphens in the slug.');
  if (!calculator.steps.length || calculator.steps.some(step => !step.title.trim() || !step.fields.length)) throw new Error('Every step needs a title and at least one field.');
  const fields = calculator.steps.flatMap(step => step.fields);
  const ids = new Set<string>();
  for (const field of fields) {
    if (!field.id || ids.has(field.id) || !field.label.trim() || field.id.endsWith('_qty')) throw new Error('Fields need unique IDs and non-empty labels. IDs cannot end in _qty.');
    ids.add(field.id);
    if ('hours' in field) {
      if (!Number.isFinite(field.hours) || field.hours < 0) throw new Error(`${field.label}: hours must be zero or greater.`);
      const min = field.minQuantity ?? 1;
      const max = field.maxQuantity ?? Number.MAX_SAFE_INTEGER;
      const quantity = field.defaultQuantity ?? min;
      if (![min, max, quantity].every(Number.isSafeInteger) || min < 0 || max < min || quantity < min || quantity > max) throw new Error(`${field.label}: check quantity limits and default.`);
      if (field.quantityFrom && !fields.some(other => other.id === field.quantityFrom && 'type' in other && (other.type === 'number' || other.type === 'pages'))) throw new Error(`${field.label}: choose an existing number or page checklist field for quantity.`);
      if (field.conditional && (field.conditional.showWhen === field.id || !fields.some(other => other.id === field.conditional?.showWhen))) throw new Error(`${field.label}: choose an existing field for the condition.`);
    } else {
      if (field.type === 'pages' && ((field.min !== undefined && (!Number.isSafeInteger(field.min) || field.min < 1)) ||
          (field.max !== undefined && (!Number.isSafeInteger(field.max) || field.max > 100 || field.max < (field.min ?? 1))) ||
          (field.min ?? 1) > 100)) throw new Error(`${field.label}: use whole-number page limits between 1 and 100.`);
      if (field.defaultValue !== undefined && field.defaultValue !== '') {
        const errors = configErrors([field], { [field.id]: field.defaultValue });
        if (errors.length) throw new Error(`Default value: ${errors[0]}`);
      }
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) throw new Error(`${field.label}: minimum cannot exceed maximum.`);
      if (field.step !== undefined && (!Number.isFinite(field.step) || field.step <= 0)) throw new Error(`${field.label}: step must be positive.`);
      if (field.type === 'select' && (!field.options?.length || new Set(field.options.map(option => String(option.value))).size !== field.options.length || field.options.some(option => !option.label.trim() || !String(option.value).trim() || !Number.isFinite(option.hours ?? 0) || (option.hours ?? 0) < 0))) throw new Error(`${field.label}: options need unique values, labels and non-negative hours.`);
    }
  }
  calculateEstimate(calculator, initialConfig(calculator), {});
}
