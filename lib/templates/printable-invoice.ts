/**
 * Printable Invoice Template
 * Generates a print-friendly invoice HTML that can be saved as PDF
 */

import { Invoice } from '@/types/invoice';

export function generatePrintableInvoice(invoice: Invoice, businessInfo: {
  businessName: string;
  logo?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
}): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isPaid = invoice.amountDue <= 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    @media print {
      @page {
        margin: 0.5in;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #1f2937;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }

    .company-logo {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 12px;
      object-fit: contain;
    }

    .company-info h1 {
      font-size: 24pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .company-info p {
      color: #6b7280;
      font-size: 10pt;
      line-height: 1.4;
    }

    .invoice-details {
      text-align: right;
    }

    .invoice-number {
      font-size: 18pt;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 8px;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-partial {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-unpaid {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .party {
      flex: 1;
    }

    .party h2 {
      font-size: 11pt;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .party p {
      color: #1f2937;
      line-height: 1.6;
    }

    .party strong {
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    thead {
      background-color: #f3f4f6;
    }

    th {
      padding: 12px;
      text-align: left;
      font-size: 10pt;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    th:last-child, td:last-child {
      text-align: right;
    }

    th:nth-child(2), td:nth-child(2) {
      text-align: center;
    }

    tbody tr {
      border-bottom: 1px solid #f3f4f6;
    }

    td {
      padding: 12px;
      color: #1f2937;
    }

    .totals {
      margin-top: 20px;
      margin-left: auto;
      width: 300px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }

    .totals-row.subtotal {
      color: #6b7280;
    }

    .totals-row.total {
      font-size: 14pt;
      font-weight: 700;
      padding-top: 12px;
      border-top: 2px solid #e5e7eb;
      color: #1f2937;
    }

    .totals-row.paid {
      color: #059669;
      font-weight: 600;
    }

    .totals-row.due {
      color: #dc2626;
      font-weight: 600;
    }

    .payment-info {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-top: 40px;
    }

    .payment-info h3 {
      font-size: 12pt;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1f2937;
    }

    .payment-list {
      list-style: none;
    }

    .payment-list li {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 10pt;
    }

    .payment-list li:last-child {
      border-bottom: none;
    }

    .payment-list li > div {
      flex: 1;
    }

    .payment-list li > strong {
      margin-left: 16px;
      white-space: nowrap;
    }

    .terms {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .terms h3 {
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 8px;
      color: #1f2937;
    }

    .terms p {
      font-size: 10pt;
      color: #6b7280;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .print-button:hover {
      background-color: #2563eb;
    }
  </style>
</head>
<body>
  <button onclick="window.print()" class="print-button no-print">🖨️ Print / Save as PDF</button>

  <div class="header">
    <div class="company-info">
      ${businessInfo.logo ? `<img src="${businessInfo.logo}" alt="${businessInfo.businessName}" class="company-logo">` : ''}
      <h1>${businessInfo.businessName}</h1>
      <p>
        ${businessInfo.city && businessInfo.state && businessInfo.zipCode ? `${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}<br>` : ''}
        ${businessInfo.phone ? `Phone: ${businessInfo.phone}<br>` : ''}
        ${businessInfo.email ? `Email: ${businessInfo.email}<br>` : ''}
        ${businessInfo.website ? `Website: ${businessInfo.website}` : ''}
      </p>
    </div>
    <div class="invoice-details">
      <div class="invoice-number">INVOICE</div>
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <div class="status-badge ${isPaid ? 'status-paid' : invoice.amountPaid > 0 ? 'status-partial' : 'status-unpaid'}">
        ${isPaid ? 'PAID' : invoice.amountPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID'}
      </div>
      <p style="margin-top: 12px; font-size: 10pt; color: #6b7280;">
        <strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}<br>
        <strong>Due Date:</strong> ${formatDate(invoice.dueDate)}${isPaid && invoice.paidAt ? `<br><strong style="color: #059669;">Paid On:</strong> <span style="color: #059669;">${formatDate(invoice.paidAt)}</span>` : ''}
      </p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h2>Bill To</h2>
      <p>
        <strong>${invoice.client.name}</strong><br>
        ${invoice.client.company ? `${invoice.client.company}<br>` : ''}
        ${invoice.client.email}<br>
        ${invoice.client.phone ? `${invoice.client.phone}<br>` : ''}
        ${invoice.client.address ? `
          ${invoice.client.address.street}<br>
          ${invoice.client.address.city}, ${invoice.client.address.state} ${invoice.client.address.zipCode}
        ` : ''}
      </p>
    </div>
  </div>

  ${invoice.title || invoice.description ? `
    <div style="margin-bottom: 30px;">
      ${invoice.title ? `<h2 style="font-size: 14pt; font-weight: 600; margin-bottom: 8px;">${invoice.title}</h2>` : ''}
      ${invoice.description ? `<p style="color: #6b7280; font-size: 10pt;">${invoice.description}</p>` : ''}
    </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lineItems.map((item) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.rate)}</td>
          <td>${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row subtotal">
      <span>Subtotal</span>
      <span>${formatCurrency(invoice.subtotal)}</span>
    </div>
    ${invoice.discountAmount > 0 ? `
      <div class="totals-row subtotal" style="color: #059669;">
        <span>Discount${invoice.discount?.reason ? ` (${invoice.discount.reason})` : ''}</span>
        <span>-${formatCurrency(invoice.discountAmount)}</span>
      </div>
    ` : ''}
    ${invoice.taxAmount > 0 ? `
      <div class="totals-row subtotal">
        <span>${invoice.taxConfig?.taxLabel || 'Tax'}</span>
        <span>${formatCurrency(invoice.taxAmount)}</span>
      </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total</span>
      <span>${formatCurrency(invoice.total)}</span>
    </div>
    ${invoice.amountPaid > 0 ? `
      <div class="totals-row paid">
        <span>Amount Paid</span>
        <span>${formatCurrency(invoice.amountPaid)}</span>
      </div>
    ` : ''}
    ${!isPaid ? `
      <div class="totals-row due">
        <span>Balance Due</span>
        <span>${formatCurrency(invoice.amountDue)}</span>
      </div>
    ` : ''}
  </div>

  ${invoice.payments && invoice.payments.length > 0 ? `
    <div class="payment-info">
      <h3>Payment History</h3>
      <ul class="payment-list">
        ${invoice.payments.map((payment) => {
          // Handle backward compatibility - calculate totalPaid if not present
          const totalPaid = payment.totalPaid ?? (payment.amount + (payment.processingFee || 0));
          return `
          <li>
            <div>
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                ${formatDate(payment.paidAt)} - ${payment.paymentMethod ? payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1) : 'Payment'}${payment.cardBrand && payment.cardLast4 ? ` (${payment.cardBrand.charAt(0).toUpperCase() + payment.cardBrand.slice(1)} ••••${payment.cardLast4})` : ''}
              </div>
              <div style="font-size: 9pt; color: #6b7280;">
                Invoice amount: ${formatCurrency(payment.amount)}${payment.processingFee && payment.processingFee > 0 ? ` + ${formatCurrency(payment.processingFee)} processing fee` : ''}
              </div>
            </div>
            <strong style="color: #059669;">${formatCurrency(totalPaid)}</strong>
          </li>
        `;
        }).join('')}
        ${invoice.payments.reduce((sum, p) => sum + (p.processingFee || 0), 0) > 0 ? `
          <li style="background-color: #f3f4f6; margin-top: 8px; font-weight: 600;">
            <span>Total Paid (including processing fees)</span>
            <strong style="color: #059669;">${formatCurrency(invoice.payments.reduce((sum, p) => {
              const totalPaid = p.totalPaid ?? (p.amount + (p.processingFee || 0));
              return sum + totalPaid;
            }, 0))}</strong>
          </li>
        ` : ''}
      </ul>
    </div>
  ` : ''}

  ${invoice.terms ? `
    <div class="terms">
      <h3>Terms & Conditions</h3>
      <p>${invoice.terms}</p>
    </div>
  ` : ''}

  <div style="margin-top: 60px; text-align: center; font-size: 10pt; color: #9ca3af;">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `.trim();
}
