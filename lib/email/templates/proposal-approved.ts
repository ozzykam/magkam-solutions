/**
 * Proposal Approved Email Template
 * Sent to admin when a customer approves a proposal
 */

interface ProposalApprovedData {
  proposalNumber: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  taxLabel?: string;
  discountReason?: string;
  proposalTitle?: string;
  acceptedAt: string;
}

export function generateProposalApprovedEmail(data: ProposalApprovedData): string {
  const itemsHtml = data.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
        <div style="font-weight: 600; color: #111827; font-size: 15px;">${item.description}</div>
        <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
          Quantity: ${item.quantity} × $${item.rate.toFixed(2)}
        </div>
      </td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #111827; background-color: #ffffff; font-weight: 500;">
        $${item.amount.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const discountHtml = data.discountAmount > 0
    ? `
    <tr>
      <td style="padding: 10px 16px; color: #059669; font-size: 15px;">
        Discount${data.discountReason ? ` (${data.discountReason})` : ''}
      </td>
      <td style="padding: 10px 16px; text-align: right; color: #059669; font-size: 15px; font-weight: 500;">
        -$${data.discountAmount.toFixed(2)}
      </td>
    </tr>
    `
    : '';

  const taxHtml = data.taxAmount > 0
    ? `
    <tr>
      <td style="padding: 10px 16px; color: #6b7280; font-size: 15px;">${data.taxLabel || 'Tax'}</td>
      <td style="padding: 10px 16px; text-align: right; color: #111827; font-size: 15px; font-weight: 500;">
        $${data.taxAmount.toFixed(2)}
      </td>
    </tr>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposal Approved - ${data.proposalNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" style="width: 100%; max-width: 650px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800;">
                ✅ PROPOSAL APPROVED!
              </h1>
              <p style="margin: 12px 0 0 0; color: #d1fae5; font-size: 16px; font-weight: 500;">
                Customer Accepted - Ready to Convert to Invoice
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Success Banner -->
              <div style="margin-bottom: 28px; padding: 16px 20px; background-color: #d1fae5; border: 2px solid #10b981; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">
                  🎉 ${data.customerName} has approved the proposal!
                </p>
              </div>

              <!-- Proposal Number -->
              <div style="margin-bottom: 28px; text-align: center;">
                <div style="display: inline-block; padding: 16px 32px; background-color: #ecfdf5; border: 3px solid #10b981; border-radius: 10px;">
                  <div style="font-size: 14px; color: #065f46; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600;">
                    PROPOSAL NUMBER
                  </div>
                  <div style="font-size: 28px; font-weight: 800; color: #059669;">
                    ${data.proposalNumber}
                  </div>
                </div>
              </div>

              ${data.proposalTitle ? `
              <!-- Proposal Title -->
              <div style="margin-bottom: 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">
                  ${data.proposalTitle}
                </h2>
              </div>
              ` : ''}

              <!-- Customer Information -->
              <div style="margin-bottom: 28px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #111827;">
                  👤 Customer Information
                </h3>
                <p style="margin: 6px 0; color: #374151; font-size: 15px;">
                  <strong>Name:</strong> ${data.customerName}
                </p>
                <p style="margin: 6px 0; color: #374151; font-size: 15px;">
                  <strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #10b981; text-decoration: none;">${data.customerEmail}</a>
                </p>
                ${data.customerCompany ? `
                <p style="margin: 6px 0; color: #374151; font-size: 15px;">
                  <strong>Company:</strong> ${data.customerCompany}
                </p>
                ` : ''}
                <p style="margin: 6px 0; color: #374151; font-size: 15px;">
                  <strong>Approved At:</strong> ${data.acceptedAt}
                </p>
              </div>

              <!-- Proposal Items -->
              <h2 style="margin: 32px 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; border-bottom: 3px solid #10b981; padding-bottom: 12px;">
                📋 Approved Items
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr>
                    <th style="padding: 14px 12px; background-color: #f3f4f6; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                    <th style="padding: 14px 12px; background-color: #f3f4f6; text-align: right; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Proposal Summary -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px; background-color: #f9fafb; border-radius: 6px; padding: 16px;">
                <tr>
                  <td style="padding: 10px 16px; color: #6b7280; font-size: 15px;">Subtotal</td>
                  <td style="padding: 10px 16px; text-align: right; color: #111827; font-size: 15px; font-weight: 500;">$${data.subtotal.toFixed(2)}</td>
                </tr>
                ${discountHtml}
                ${taxHtml}
                <tr style="border-top: 3px solid #10b981;">
                  <td style="padding: 14px 16px; font-size: 20px; font-weight: 700; color: #111827;">TOTAL</td>
                  <td style="padding: 14px 16px; text-align: right; font-size: 20px; font-weight: 700; color: #10b981;">
                    $${data.total.toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <div style="margin: 36px 0 24px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/proposals/${data.proposalNumber.replace(/[^a-zA-Z0-9-]/g, '')}"
                   style="display: inline-block; padding: 16px 40px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 0 8px 12px 8px;">
                  View Proposal in Admin
                </a>
                <br>
                <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">
                  💡 Next step: Convert this proposal to an invoice
                </p>
              </div>

              <!-- Next Steps -->
              <div style="margin-top: 32px; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; color: #78350f; font-size: 14px; line-height: 1.6; font-weight: 600;">
                  📌 Recommended Next Steps:
                </p>
                <ol style="margin: 8px 0 0 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.6;">
                  <li>Review the approved proposal details</li>
                  <li>Convert the proposal to an invoice</li>
                  <li>Send the invoice to the customer for payment</li>
                  <li>Begin work once payment is received</li>
                </ol>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #1f2937; border-radius: 0 0 10px 10px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #d1d5db; font-size: 14px; font-weight: 500;">
                Admin Notification - ${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '')}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated notification. Do not reply to this email.
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
