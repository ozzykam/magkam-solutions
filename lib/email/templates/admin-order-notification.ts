/**
 * Admin Order Notification Email Template
 * Sent to admin when a new order is placed
 */

interface AdminOrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: 'delivery' | 'pickup';
  deliveryDate?: string;
  deliveryTime?: string;
  pickupDate?: string;
  pickupTime?: string;
  deliveryAddress?: string;
  customerNotes?: string;
}

export function generateAdminOrderNotificationEmail(data: AdminOrderNotificationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
        <div style="font-weight: 600; color: #111827; font-size: 15px;">${item.name}</div>
        <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Quantity: ${item.quantity}</div>
      </td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #111827; background-color: #ffffff; font-weight: 500;">
        $${item.price.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const fulfillmentDetailsHtml =
    data.fulfillmentType === 'delivery'
      ? `
    <div style="margin-bottom: 24px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
      <h3 style="margin: 0 0 12px 0; font-size: 17px; font-weight: 700; color: #92400e;">
        🚚 DELIVERY ORDER
      </h3>
      <p style="margin: 6px 0; color: #78350f; font-size: 15px;">
        <strong>Date:</strong> ${data.deliveryDate}
      </p>
      <p style="margin: 6px 0; color: #78350f; font-size: 15px;">
        <strong>Time Window:</strong> ${data.deliveryTime}
      </p>
      <p style="margin: 6px 0; color: #78350f; font-size: 15px;">
        <strong>Delivery Address:</strong><br>
        ${data.deliveryAddress}
      </p>
    </div>
  `
      : `
    <div style="margin-bottom: 24px; padding: 20px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
      <h3 style="margin: 0 0 12px 0; font-size: 17px; font-weight: 700; color: #1e40af;">
        📦 PICKUP ORDER
      </h3>
      <p style="margin: 6px 0; color: #1e3a8a; font-size: 15px;">
        <strong>Date:</strong> ${data.pickupDate}
      </p>
      <p style="margin: 6px 0; color: #1e3a8a; font-size: 15px;">
        <strong>Time Window:</strong> ${data.pickupTime}
      </p>
      <p style="margin: 6px 0; color: #1e3a8a; font-size: 15px;">
        <strong>Pickup Location:</strong> Local Market Store
      </p>
    </div>
  `;

  const customerNotesHtml = data.customerNotes
    ? `
    <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
      <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #374151;">
        📝 Customer Notes:
      </h3>
      <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; font-style: italic;">
        "${data.customerNotes}"
      </p>
    </div>
  `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" style="width: 100%; max-width: 650px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800;">
                🔔 NEW ORDER RECEIVED
              </h1>
              <p style="margin: 12px 0 0 0; color: #fecaca; font-size: 16px; font-weight: 500;">
                Action Required - Order Needs Preparation
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Urgent Banner -->
              <div style="margin-bottom: 28px; padding: 16px 20px; background-color: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                  ⚡ Please prepare this order for ${data.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'}
                </p>
              </div>

              <!-- Order Number -->
              <div style="margin-bottom: 28px; text-align: center;">
                <div style="display: inline-block; padding: 16px 32px; background-color: #fef2f2; border: 3px solid #dc2626; border-radius: 10px;">
                  <div style="font-size: 14px; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600;">
                    ORDER NUMBER
                  </div>
                  <div style="font-size: 28px; font-weight: 800; color: #b91c1c;">
                    ${data.orderNumber}
                  </div>
                </div>
              </div>

              <!-- Customer Information -->
              <div style="margin-bottom: 28px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #111827;">
                  👤 Customer Information
                </h3>
                <p style="margin: 6px 0; color: #374151; font-size: 15px;">
                  <strong>Name:</strong> ${data.customerName}
                </p>
                <p style="margin: 6px 0; color: #374151; font-size: 15px;">
                  <strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #dc2626; text-decoration: none;">${data.customerEmail}</a>
                </p>
              </div>

              <!-- Fulfillment Details -->
              ${fulfillmentDetailsHtml}

              <!-- Customer Notes -->
              ${customerNotesHtml}

              <!-- Order Items -->
              <h2 style="margin: 32px 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; border-bottom: 3px solid #dc2626; padding-bottom: 12px;">
                📋 Items to Prepare
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr>
                    <th style="padding: 14px 12px; background-color: #f3f4f6; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 14px 12px; background-color: #f3f4f6; text-align: right; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Order Summary -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px; background-color: #f9fafb; border-radius: 6px; padding: 16px;">
                <tr>
                  <td style="padding: 10px 16px; color: #6b7280; font-size: 15px;">Subtotal</td>
                  <td style="padding: 10px 16px; text-align: right; color: #111827; font-size: 15px; font-weight: 500;">$${data.subtotal.toFixed(2)}</td>
                </tr>
                ${
                  data.deliveryFee > 0
                    ? `
                <tr>
                  <td style="padding: 10px 16px; color: #6b7280; font-size: 15px;">Delivery Fee</td>
                  <td style="padding: 10px 16px; text-align: right; color: #111827; font-size: 15px; font-weight: 500;">$${data.deliveryFee.toFixed(2)}</td>
                </tr>
                `
                    : ''
                }
                <tr style="border-top: 3px solid #dc2626;">
                  <td style="padding: 14px 16px; font-size: 20px; font-weight: 700; color: #111827;">TOTAL PAID</td>
                  <td style="padding: 14px 16px; text-align: right; font-size: 20px; font-weight: 700; color: #dc2626;">
                    $${data.total.toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <div style="margin: 36px 0 24px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders"
                   style="display: inline-block; padding: 16px 40px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 0 8px 12px 8px;">
                  View in Admin Dashboard
                </a>
                <br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/fulfillment"
                   style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #dc2626; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; border: 2px solid #dc2626; margin: 0 8px;">
                  Go to Fulfillment Queue
                </a>
              </div>

              <!-- Reminder -->
              <div style="margin-top: 32px; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                  <strong>⏰ Reminder:</strong> Please process this order promptly to ensure timely ${data.fulfillmentType === 'delivery' ? 'delivery' : 'pickup'}.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #1f2937; border-radius: 0 0 10px 10px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #d1d5db; font-size: 14px; font-weight: 500;">
                Admin Notification - ${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '')}
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
