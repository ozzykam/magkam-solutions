/**
 * Payment Received Email Template
 * Notifies admin when a customer makes a payment
 */

interface PaymentReceivedEmailData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
  paymentAmount: number;
  remainingBalance: number;
  totalAmount: number;
  paymentMethod: string;
  cardBrand?: string;
  cardLast4?: string;
  paidAt: string;
  invoiceTitle?: string;
  processingFee?: number;
}

export function generatePaymentReceivedEmail(data: PaymentReceivedEmailData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const paymentMethodDisplay = data.cardBrand && data.cardLast4
    ? `${data.cardBrand.charAt(0).toUpperCase() + data.cardBrand.slice(1)} ••••${data.cardLast4}`
    : data.paymentMethod;

  const isPaidInFull = data.remainingBalance <= 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received - ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Green Success Theme -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                💰 Payment Received
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px;">
                ${data.invoiceNumber}
              </p>
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: center;">
              <div style="display: inline-block; background-color: #d1fae5; color: #065f46; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 14px;">
                ${isPaidInFull ? '✓ Paid in Full' : '✓ Partial Payment Received'}
              </div>
            </td>
          </tr>

          <!-- Payment Amount -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-bottom: 2px solid #f3f4f6;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                Invoice Payment
              </p>
              <p style="margin: 0; color: #10b981; font-size: 42px; font-weight: 700; line-height: 1.2;">
                ${formatCurrency(data.paymentAmount)}
              </p>
              ${data.processingFee && data.processingFee > 0 ? `
                <div style="margin: 16px 0 0 0; padding: 12px; background-color: #f3f4f6; border-radius: 8px; display: inline-block;">
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">
                    Processing Fee: ${formatCurrency(data.processingFee)}
                  </p>
                  <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">
                    Total Paid by Customer: ${formatCurrency(data.paymentAmount + data.processingFee)}
                  </p>
                </div>
              ` : ''}
            </td>
          </tr>

          <!-- Customer Information -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
                Customer Information
              </h2>

              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                    Customer:
                  </td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                    ${data.customerName}
                  </td>
                </tr>
                ${data.customerCompany ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    Company:
                  </td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                    ${data.customerCompany}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    Email:
                  </td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                    <a href="mailto:${data.customerEmail}" style="color: #3b82f6; text-decoration: none;">
                      ${data.customerEmail}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
                Payment Details
              </h2>

              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                ${data.invoiceTitle ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                    Invoice:
                  </td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                    ${data.invoiceTitle}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    Payment Method:
                  </td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                    ${paymentMethodDisplay}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    Payment Date:
                  </td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                    ${data.paidAt}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Balance Summary -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #10b981;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">
                      Invoice Total:
                    </td>
                    <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">
                      ${formatCurrency(data.totalAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">
                      This Payment:
                    </td>
                    <td style="padding: 6px 0; color: #10b981; font-size: 14px; font-weight: 600; text-align: right;">
                      ${formatCurrency(data.paymentAmount)}
                    </td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 6px 0; color: #111827; font-size: 16px; font-weight: 700;">
                      ${isPaidInFull ? 'Status:' : 'Remaining Balance:'}
                    </td>
                    <td style="padding: 12px 0 6px 0; color: ${isPaidInFull ? '#10b981' : '#f59e0b'}; font-size: 18px; font-weight: 700; text-align: right;">
                      ${isPaidInFull ? 'Paid in Full ✓' : formatCurrency(data.remainingBalance)}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                This is an automated notification from your invoice system.<br>
                ${isPaidInFull ? 'The invoice has been paid in full.' : 'A partial payment has been received.'}
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
