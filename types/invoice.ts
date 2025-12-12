import { Timestamp } from 'firebase/firestore';

/**
 * Line Item for Proposals and Invoices
 * Represents a single service or product line
 */
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number; // Price per unit
  amount: number; // quantity * rate
  taxable?: boolean;
}

/**
 * Tax Configuration
 */
export interface TaxConfig {
  taxRate: number; // Percentage (e.g., 8.5 for 8.5%)
  taxLabel: string; // e.g., "Sales Tax", "VAT"
}

/**
 * Client/Customer Information
 */
export interface ClientInfo {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
}

/**
 * Payment Information
 */
export interface PaymentInfo {
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount: number;
  paidAt: Timestamp;
  paymentMethod?: 'card' | 'ach' | 'bank_transfer' | 'check' | 'cash' | 'wire' | 'other';
  transactionNote?: string;
  // Card details (when paid by card)
  cardBrand?: string; // e.g., 'visa', 'mastercard', 'amex'
  cardLast4?: string; // Last 4 digits, e.g., '4242'
}

/**
 * Credit Card Processing Fee Configuration
 * Adds a surcharge for credit card payments to cover Stripe fees
 */
export interface ProcessingFeeConfig {
  enabled: boolean;
  cardFeePercent: number; // e.g., 3 for 3%
  feeLabel?: string; // e.g., "Credit Card Processing Fee"
}

/**
 * Default Processing Fee Configuration
 * 3% surcharge for credit card payments to cover Stripe fees (2.9% + $0.30)
 */
export const DEFAULT_PROCESSING_FEE: ProcessingFeeConfig = {
  enabled: true,
  cardFeePercent: 3,
  feeLabel: 'Credit Card Processing Fee',
};

/**
 * Payment Method Discount Configuration
 * Allows offering discounts for certain payment methods (e.g., ACH)
 */
export interface PaymentMethodDiscount {
  enabled: boolean;
  achDiscountPercent: number; // e.g., 3 for 3%
  achDiscountLabel?: string; // e.g., "Save 3% by paying with ACH"
}

/**
 * Default Payment Method Discount Configuration
 * 3% discount for ACH payments to offset credit card processing fees
 */
export const DEFAULT_PAYMENT_METHOD_DISCOUNT: PaymentMethodDiscount = {
  enabled: true,
  achDiscountPercent: 3,
  achDiscountLabel: 'Save 3% by paying with ACH bank transfer',
};

/**
 * Proposal Status
 */
export enum ProposalStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CONVERTED = 'converted', // Converted to invoice
}

/**
 * Invoice Status
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

/**
 * Proposal
 * Draft quote/estimate sent to clients
 */
export interface Proposal {
  id: string;
  proposalNumber: string; // e.g., "PROP-2025-001"
  status: ProposalStatus;

  // Client Information
  clientId?: string; // Reference to user in users collection (if customer has account)
  client: ClientInfo; // Denormalized client data (snapshot at time of creation)

  // Line Items
  lineItems: LineItem[];

  // Pricing
  subtotal: number;
  taxConfig?: TaxConfig;
  taxAmount: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  discountAmount: number;
  total: number;

  // Payment Options
  processingFeeConfig?: ProcessingFeeConfig;
  paymentMethodDiscount?: PaymentMethodDiscount;

  // Terms & Notes
  title?: string; // e.g., "Website Development Proposal"
  description?: string;
  terms?: string; // Payment terms, conditions
  notes?: string; // Internal notes
  validUntil?: Timestamp; // Proposal expiration date

  // Tracking
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  respondedAt?: Timestamp; // When client accepted/rejected
  convertedToInvoiceId?: string; // If converted to invoice

  // Metadata
  createdBy: string; // User ID who created it
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Invoice
 * Finalized billing document
 */
export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2025-001"
  status: InvoiceStatus;

  // Client Information
  clientId?: string; // Reference to user in users collection (if customer has account)
  client: ClientInfo; // Denormalized client data (snapshot at time of creation)

  // Line Items
  lineItems: LineItem[];

  // Pricing
  subtotal: number;
  taxConfig?: TaxConfig;
  taxAmount: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  discountAmount: number;
  total: number;

  // Payment Options
  processingFeeConfig?: ProcessingFeeConfig;
  paymentMethodDiscount?: PaymentMethodDiscount;

  // Payment Tracking
  amountPaid: number;
  amountDue: number;
  payments: PaymentInfo[];

  // Terms & Dates
  title?: string; // e.g., "Website Development Services"
  description?: string;
  terms?: string; // Payment terms, late fees, etc.
  notes?: string; // Internal notes
  issueDate: Timestamp;
  dueDate: Timestamp;

  // Related Documents
  proposalId?: string; // If created from a proposal
  purchaseOrderNumber?: string; // Client's PO number

  // Tracking
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  paidAt?: Timestamp; // When fully paid
  cancelledAt?: Timestamp; // When cancelled

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Helper to calculate line item amount
 */
export const calculateLineItemAmount = (quantity: number, rate: number): number => {
  return Math.round(quantity * rate * 100) / 100;
};

/**
 * Helper to calculate subtotal from line items
 */
export const calculateSubtotal = (lineItems: LineItem[]): number => {
  return lineItems.reduce((sum, item) => sum + item.amount, 0);
};

/**
 * Helper to calculate tax amount
 */
export const calculateTaxAmount = (subtotal: number, taxConfig?: TaxConfig): number => {
  if (!taxConfig || taxConfig.taxRate === 0) return 0;
  return Math.round(subtotal * (taxConfig.taxRate / 100) * 100) / 100;
};

/**
 * Helper to calculate discount amount
 */
export const calculateDiscountAmount = (
  subtotal: number,
  discount?: { type: 'percentage' | 'fixed'; value: number }
): number => {
  if (!discount || discount.value === 0) return 0;

  if (discount.type === 'percentage') {
    return Math.round(subtotal * (discount.value / 100) * 100) / 100;
  }

  return discount.value;
};

/**
 * Helper to calculate total
 */
export const calculateTotal = (
  subtotal: number,
  taxAmount: number,
  discountAmount: number
): number => {
  return Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
};

/**
 * Helper to generate proposal number
 */
export const generateProposalNumber = (year: number, sequence: number): string => {
  return `PROP-${year}-${String(sequence).padStart(3, '0')}`;
};

/**
 * Helper to generate invoice number
 */
export const generateInvoiceNumber = (year: number, sequence: number): string => {
  return `INV-${year}-${String(sequence).padStart(3, '0')}`;
};

/**
 * Helper to calculate credit card processing fee
 */
export const calculateProcessingFee = (
  total: number,
  processingFeeConfig?: ProcessingFeeConfig
): number => {
  if (!processingFeeConfig || !processingFeeConfig.enabled) return 0;
  return Math.round(total * (processingFeeConfig.cardFeePercent / 100) * 100) / 100;
};

/**
 * Helper to calculate total with processing fee included
 */
export const calculateTotalWithProcessingFee = (
  total: number,
  processingFeeConfig?: ProcessingFeeConfig
): number => {
  const fee = calculateProcessingFee(total, processingFeeConfig);
  return Math.round((total + fee) * 100) / 100;
};

/**
 * Helper to calculate ACH discount amount
 */
export const calculateAchDiscount = (
  total: number,
  paymentMethodDiscount?: PaymentMethodDiscount
): number => {
  if (!paymentMethodDiscount || !paymentMethodDiscount.enabled) return 0;
  return Math.round(total * (paymentMethodDiscount.achDiscountPercent / 100) * 100) / 100;
};

/**
 * Helper to calculate total with ACH discount applied
 */
export const calculateAchTotal = (
  total: number,
  paymentMethodDiscount?: PaymentMethodDiscount
): number => {
  const discount = calculateAchDiscount(total, paymentMethodDiscount);
  return Math.round((total - discount) * 100) / 100;
};

/**
 * Helper to format payment method discount display
 */
export const formatPaymentMethodSavings = (
  total: number,
  paymentMethodDiscount?: PaymentMethodDiscount
): string | null => {
  if (!paymentMethodDiscount || !paymentMethodDiscount.enabled) return null;
  const savings = calculateAchDiscount(total, paymentMethodDiscount);
  return `Save $${savings.toFixed(2)} (${paymentMethodDiscount.achDiscountPercent}%) by paying with ACH`;
};

/**
 * Serialized versions for client components (Timestamps as strings)
 */
export type SerializedProposal = Omit<
  Proposal,
  'createdAt' | 'updatedAt' | 'sentAt' | 'viewedAt' | 'respondedAt' | 'validUntil'
> & {
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  validUntil?: string;
};

export type SerializedInvoice = Omit<
  Invoice,
  'createdAt' | 'updatedAt' | 'sentAt' | 'viewedAt' | 'paidAt' | 'issueDate' | 'dueDate' | 'payments'
> & {
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  issueDate: string;
  dueDate: string;
  payments: Array<Omit<PaymentInfo, 'paidAt'> & { paidAt: string }>;
};
