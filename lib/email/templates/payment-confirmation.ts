/**
 * Payment Confirmation Email Template
 * Sent to customer after successful payment
 */

interface PaymentConfirmationEmailData {
  invoiceNumber: string;
  customerName: string;
  paymentAmount: number;
  remainingBalance: number;
  totalAmount: number;
  paymentMethod: string;
  cardBrand?: string;
  cardLast4?: string;
  paidAt: string;
  invoiceTitle?: string;
  processingFee?: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  taxLabel?: string;
  discountReason?: string;
}

export function generatePaymentConfirmationEmail(data: PaymentConfirmationEmailData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const paymentMethodDisplay = data.cardBrand && data.cardLast4
    ? `${data.cardBrand.charAt(0).toUpperCase() + data.cardBrand.slice(1)} ending in ${data.cardLast4}`
    : data.paymentMethod;

  const isPaidInFull = data.remainingBalance <= 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation - ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Payment Confirmed
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px;">
                Thank you for your payment!
              </p>
            </td>
          </tr>

          <!-- Payment Summary -->
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px; font-weight: 600;">
                      Invoice Payment
                    </td>
                    <td style="padding: 6px 0; color: #065f46; font-size: 24px; font-weight: 700; text-align: right;">
                      ${formatCurrency(data.paymentAmount)}
                    </td>
                  </tr>
                  ${data.processingFee && data.processingFee > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #059669; font-size: 12px;">
                      Processing Fee
                    </td>
                    <td style="padding: 4px 0; color: #059669; font-size: 12px; text-align: right;">
                      ${formatCurrency(data.processingFee)}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid #d1fae5;">
                    <td style="padding: 8px 0 4px 0; color: #065f46; font-size: 14px; font-weight: 700;">
                      Total You Paid
                    </td>
                    <td style="padding: 8px 0 4px 0; color: #065f46; font-size: 18px; font-weight: 700; text-align: right;">
                      ${formatCurrency(data.paymentAmount + data.processingFee)}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 6px 0 0 0; color: #065f46; font-size: 14px;">
                      Invoice Number
                    </td>
                    <td style="padding: 6px 0 0 0; color: #065f46; font-size: 14px; text-align: right; font-weight: 600;">
                      ${data.invoiceNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px;">
                      Payment Date
                    </td>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px; text-align: right;">
                      ${data.paidAt}
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px;">
                Hi ${data.customerName},
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                We've received your payment of <strong>${formatCurrency(data.paymentAmount)}</strong>${data.processingFee && data.processingFee > 0 ? ` (you paid <strong>${formatCurrency(data.paymentAmount + data.processingFee)}</strong> including the ${formatCurrency(data.processingFee)} processing fee)` : ''} for invoice ${data.invoiceNumber}.
                ${isPaidInFull ? 'Your invoice has been paid in full.' : `You have a remaining balance of ${formatCurrency(data.remainingBalance)}.`}
              </p>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
                Payment Details
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">
                    Payment Method:
                  </td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">
                    ${paymentMethodDisplay}
                  </td>
                </tr>
                ${data.invoiceTitle ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">
                    Description:
                  </td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">
                    ${data.invoiceTitle}
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
                Invoice Items
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; font-size: 14px;">
                <thead>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 8px 0; color: #6b7280; font-weight: 600; text-align: left;">Item</th>
                    <th style="padding: 8px 0; color: #6b7280; font-weight: 600; text-align: center;">Qty</th>
                    <th style="padding: 8px 0; color: #6b7280; font-weight: 600; text-align: right;">Rate</th>
                    <th style="padding: 8px 0; color: #6b7280; font-weight: 600; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.lineItems.map((item) => `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                      <td style="padding: 12px 0; color: #111827;">${item.description}</td>
                      <td style="padding: 12px 0; color: #6b7280; text-align: center;">${item.quantity}</td>
                      <td style="padding: 12px 0; color: #6b7280; text-align: right;">${formatCurrency(item.rate)}</td>
                      <td style="padding: 12px 0; color: #111827; font-weight: 600; text-align: right;">${formatCurrency(item.amount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Totals -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 20px; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 6px 0; color: #111827; text-align: right;">${formatCurrency(data.subtotal)}</td>
                </tr>
                ${data.discountAmount > 0 ? `
                <tr>
                  <td style="padding: 6px 0; color: #10b981;">
                    Discount${data.discountReason ? ` (${data.discountReason})` : ''}:
                  </td>
                  <td style="padding: 6px 0; color: #10b981; text-align: right;">-${formatCurrency(data.discountAmount)}</td>
                </tr>
                ` : ''}
                ${data.taxAmount > 0 ? `
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">${data.taxLabel || 'Tax'}:</td>
                  <td style="padding: 6px 0; color: #111827; text-align: right;">${formatCurrency(data.taxAmount)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0 6px 0; color: #111827; font-size: 16px; font-weight: 700;">Total:</td>
                  <td style="padding: 12px 0 6px 0; color: #111827; font-size: 16px; font-weight: 700; text-align: right;">${formatCurrency(data.totalAmount)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #10b981; font-weight: 600;">Amount Paid:</td>
                  <td style="padding: 6px 0; color: #10b981; font-weight: 600; text-align: right;">${formatCurrency(data.paymentAmount)}</td>
                </tr>
                ${!isPaidInFull ? `
                <tr>
                  <td style="padding: 6px 0; color: #f59e0b; font-weight: 600;">Remaining Balance:</td>
                  <td style="padding: 6px 0; color: #f59e0b; font-weight: 600; text-align: right;">${formatCurrency(data.remainingBalance)}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #111827; font-size: 14px; font-weight: 600;">
                Need Help?
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                If you have any questions about this payment or invoice,<br>
                please don't hesitate to contact us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
