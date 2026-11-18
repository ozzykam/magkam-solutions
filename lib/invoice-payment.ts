import { Invoice, InvoiceStatus, calculateProcessingFee } from '@/types/invoice';

export function invoicePaymentAmounts(invoice: Invoice) {
  const amountCents = Math.round(invoice.amountDue * 100);
  const rate = invoice.processingFeeConfig?.enabled ? invoice.processingFeeConfig.cardFeePercent : 0;
  if (!Number.isSafeInteger(amountCents) || amountCents < 0 || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error('Invalid invoice payment amounts');
  }
  const feeCents = Math.round(calculateProcessingFee(amountCents / 100, invoice.processingFeeConfig) * 100);
  if (!Number.isSafeInteger(amountCents + feeCents)) throw new Error('Invalid invoice payment total');
  return { amountCents, feeCents, totalCents: amountCents + feeCents, rate };
}

export function canPayInvoice(invoice: Invoice) {
  return [InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID].includes(invoice.status)
    && invoicePaymentAmounts(invoice).amountCents > 0;
}
