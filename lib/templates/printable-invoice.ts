import { Invoice, InvoiceStatus } from '@/types/invoice';
import { canPayInvoice, invoicePaymentAmounts } from '@/lib/invoice-payment';

export const escapeInvoiceHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const safeUrl = (value?: string) => {
  if (!value) return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escapeInvoiceHtml(url.href) : ''; } catch { return ''; }
};

export function generatePrintableInvoice(invoice: Invoice, business: {
  businessName: string; logo?: string; city?: string; state?: string; zipCode?: string;
  phone?: string; email?: string; website?: string;
}, options: { paymentUrl?: string; checkoutToken?: string; paymentSubmitted?: boolean } = {}): string {
  const e = escapeInvoiceHtml;
  const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const date = (value: { toDate?: () => Date } | string | number | undefined) => {
    if (!value) return '';
    const d = typeof value === 'object' && value.toDate ? value.toDate() : new Date(value as string | number);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };
  const paid = invoice.amountDue <= 0;
  const payable = canPayInvoice(invoice);
  const amounts = invoicePaymentAmounts(invoice);
  const paymentUrl = safeUrl(options.paymentUrl);
  const logo = safeUrl(business.logo);
  const status = invoice.status === InvoiceStatus.CANCELLED ? 'CANCELLED' : invoice.status === InvoiceStatus.DRAFT ? 'DRAFT' : paid ? 'PAID' : invoice.amountPaid > 0 ? 'PARTIALLY PAID' : 'PAYMENT DUE';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer">
<title>Invoice ${e(invoice.invoiceNumber)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#172b3a;font:14px/1.5 Arial,Helvetica,sans-serif}
.toolbar{max-width:900px;margin:24px auto;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:0 20px}
button,.button{background:#164e63;color:white;padding:12px 20px;border:0;border-radius:6px;cursor:pointer;font:600 14px Arial;text-decoration:none;display:inline-block}
.sheet{max-width:900px;margin:0 auto 40px;background:white;padding:48px;box-shadow:0 4px 24px #0f172a12}
header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #164e63;padding-bottom:24px;margin-bottom:28px}
h1{font-size:25px;margin:0 0 6px}h2{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#546776;margin:0 0 8px}h3{font-size:16px;margin:0 0 8px}p{margin:4px 0}
.muted{color:#546776}.right{text-align:right}.logo{max-width:170px;max-height:60px;object-fit:contain;margin-bottom:10px}.badge{display:inline-block;background:#e8f1f4;color:#164e63;padding:4px 10px;font-size:11px;font-weight:bold;border-radius:4px;margin:8px 0}
.parties{display:flex;justify-content:space-between;gap:24px;margin-bottom:26px}.description{margin-bottom:22px;white-space:pre-wrap}
table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#e8f1f4;text-align:left;color:#164e63;font-size:11px;text-transform:uppercase;padding:10px}td{padding:12px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top;overflow-wrap:anywhere}th:not(:first-child),td:not(:first-child){text-align:right}th:first-child{width:55%}
.totals{width:340px;max-width:100%;margin:20px 0 24px auto;break-inside:avoid}.row{display:flex;justify-content:space-between;gap:16px;padding:6px 0}.row strong:last-child,.row span:last-child{white-space:nowrap}.balance{border-top:2px solid #164e63;margin-top:8px;padding-top:12px;font-size:18px}.online-total{font-weight:bold;background:#e8f1f4;padding:10px;margin-top:6px}
.payment{border:1px solid #b9ced7;padding:20px;border-radius:6px;clear:both;break-inside:avoid}.payment a{color:#164e63}.payment .button{color:white}.payment-url{overflow-wrap:anywhere;font-size:11px;margin-top:12px}.terms{margin-top:28px;white-space:pre-wrap;overflow-wrap:anywhere}.notice{padding:14px;background:#fff4d5;margin-bottom:20px}.history{font-size:12px}footer{border-top:1px solid #e2e8f0;padding-top:16px;margin-top:30px;color:#546776;font-size:12px;text-align:center}
@media(max-width:600px){.sheet{padding:22px}.toolbar{flex-wrap:wrap}header,.parties{flex-direction:column}.right{text-align:left}th,td{padding:8px 5px}h1{font-size:22px}}
@media print{@page{size:letter;margin:0.5in}body{background:white;font-size:10pt;print-color-adjust:exact;-webkit-print-color-adjust:exact}.sheet{box-shadow:none;padding:0;margin:0;max-width:none}.no-print{display:none!important}header{margin-bottom:20px}thead{display:table-header-group}tr{break-inside:avoid}a{color:inherit;text-decoration:none}.terms{font-size:9pt}footer{margin-top:24px}}
</style></head><body>
<div class="toolbar no-print"><span class="muted">Save a PDF using your browser's print dialog.</span><button onclick="window.print()">Print / Save as PDF</button></div>
<main class="sheet">
${options.paymentSubmitted && !paid ? '<div class="notice no-print">Your payment was submitted to Stripe. Confirmation is being processed. Refresh this page shortly to see the updated balance; please do not pay again.</div>' : ''}
<header><div>${logo ? `<img class="logo" src="${logo}" alt="${e(business.businessName)}">` : ''}<h1>${e(business.businessName)}</h1>
<p class="muted">${e([business.city, business.state, business.zipCode].filter(Boolean).join(' '))}</p>
${[business.email, business.phone, business.website].filter(Boolean).map(value => `<p class="muted">${e(value)}</p>`).join('')}</div>
<div class="right"><h2>Invoice</h2><h1>${e(invoice.invoiceNumber)}</h1><span class="badge">${status}</span><p>Issued ${date(invoice.issueDate)}</p><p><strong>Due ${date(invoice.dueDate)}</strong></p>${paid && invoice.paidAt ? `<p>Paid ${date(invoice.paidAt)}</p>` : ''}</div></header>
<section class="parties"><div><h2>Bill to</h2><strong>${e(invoice.client.name)}</strong>${invoice.client.company ? `<p>${e(invoice.client.company)}</p>` : ''}<p>${e(invoice.client.email)}</p>${invoice.client.phone ? `<p>${e(invoice.client.phone)}</p>` : ''}
${invoice.client.address ? `<p>${e(invoice.client.address.street)}</p><p>${e([invoice.client.address.city, invoice.client.address.state, invoice.client.address.zipCode].filter(Boolean).join(' '))}</p>${invoice.client.address.country ? `<p>${e(invoice.client.address.country)}</p>` : ''}` : ''}</div>
${invoice.purchaseOrderNumber ? `<div><h2>Purchase order</h2>${e(invoice.purchaseOrderNumber)}</div>` : ''}</section>
${invoice.title ? `<h3>${e(invoice.title)}</h3>` : ''}${invoice.description ? `<p class="description muted">${e(invoice.description)}</p>` : ''}
<table aria-label="Invoice items"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
${invoice.lineItems.map(item => `<tr><td>${e(item.description)}</td><td>${e(item.quantity)}</td><td>${money(item.rate)}</td><td>${money(item.amount)}</td></tr>`).join('')}
</tbody></table>
<div class="totals"><div class="row"><span>Subtotal</span><span>${money(invoice.subtotal)}</span></div>
${invoice.discountAmount > 0 ? `<div class="row"><span>Discount${invoice.discount?.reason ? ` (${e(invoice.discount.reason)})` : ''}</span><span>-${money(invoice.discountAmount)}</span></div>` : ''}
${invoice.taxAmount > 0 ? `<div class="row"><span>${e(invoice.taxConfig?.taxLabel || 'Tax')}</span><span>${money(invoice.taxAmount)}</span></div>` : ''}
<div class="row"><strong>Invoice total</strong><strong>${money(invoice.total)}</strong></div>
${invoice.amountPaid > 0 ? `<div class="row"><span>Payments toward invoice</span><span>-${money(invoice.amountPaid)}</span></div>` : ''}
<div class="row balance"><strong>Balance due</strong><strong>${money(invoice.amountDue)}</strong></div>
${!paid && invoice.status !== InvoiceStatus.CANCELLED ? `<div class="row"><span>Online payment fee (${amounts.rate}%)</span><span>${money(amounts.feeCents / 100)}</span></div><div class="row online-total"><span>Total if paid online</span><span>${money(amounts.totalCents / 100)}</span></div>` : ''}</div>
${payable ? `<section class="payment"><h3>Payment options</h3><p>Online card payment${amounts.rate > 0 ? ` includes a ${amounts.rate}% fee on the remaining invoice balance` : ' through Stripe'}. The fee is shown separately at checkout.</p><p>For an offline payment, contact ${e(business.email || business.businessName)} to arrange payment of ${money(invoice.amountDue)} without the online fee.</p>
${paymentUrl ? `${options.checkoutToken && !options.paymentSubmitted ? `<form class="no-print" method="post" action="/api/stripe/create-checkout-session" style="margin-top:16px"><input type="hidden" name="invoiceId" value="${e(invoice.id)}"><input type="hidden" name="token" value="${e(options.checkoutToken)}"><button type="submit">Pay ${money(amounts.totalCents / 100)} securely with Stripe</button></form>` : ''}<p class="payment-url"><strong>Pay online - no account required:</strong><br><a href="${paymentUrl}">${paymentUrl}</a></p>` : '<p>Request an online payment link from the sender.</p>'}</section>` : ''}
${invoice.payments?.length ? `<section class="history"><h3 style="margin-top:24px">Payment history</h3><table><thead><tr><th>Date / method</th><th>Invoice</th><th>Fee</th><th>Paid</th></tr></thead><tbody>${invoice.payments.map(payment => `<tr><td>${date(payment.paidAt)} / ${e(payment.paymentMethod || 'Payment')}${payment.cardLast4 ? ` ending ${e(payment.cardLast4)}` : ''}</td><td>${money(payment.amount)}</td><td>${money(payment.processingFee || 0)}</td><td>${money(payment.totalPaid ?? payment.amount + (payment.processingFee || 0))}</td></tr>`).join('')}</tbody></table></section>` : ''}
${invoice.terms ? `<section class="terms"><h2>Payment terms</h2>${e(invoice.terms)}</section>` : ''}
<footer>Thank you for your business.</footer></main></body></html>`;
}
