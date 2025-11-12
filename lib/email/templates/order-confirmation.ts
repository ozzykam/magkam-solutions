/**
 * Order Confirmation Email Template
 */

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
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
}

export function generateOrderConfirmationEmail(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 500; color: #111827;">${item.name}</div>
        <div style="font-size: 14px; color: #6b7280;">Qty: ${item.quantity}</div>
      </td>
      <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #e5e7eb; color: #111827;">
        $${item.price.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const fulfillmentDetailsHtml =
    data.fulfillmentType === 'delivery'
      ? `
    <div style="margin-bottom: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">
        🚚 Delivery Details
      </h3>
      <p style="margin: 4px 0; color: #374151;">
        <strong>Date:</strong> ${data.deliveryDate}
      </p>
      <p style="margin: 4px 0; color: #374151;">
        <strong>Time:</strong> ${data.deliveryTime}
      </p>
      <p style="margin: 4px 0; color: #374151;">
        <strong>Address:</strong> ${data.deliveryAddress}
      </p>
    </div>
  `
      : `
    <div style="margin-bottom: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">
        📦 Pickup Details
      </h3>
      <p style="margin: 4px 0; color: #374151;">
        <strong>Date:</strong> ${data.pickupDate}
      </p>
      <p style="margin: 4px 0; color: #374151;">
        <strong>Time:</strong> ${data.pickupTime}
      </p>
      <p style="margin: 4px 0; color: #374151;">
        <strong>Location:</strong> Local Market Store
      </p>
    </div>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✓ Order Confirmed!
              </h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 16px;">
                Thank you for your order, ${data.customerName}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Order Number -->
              <div style="margin-bottom: 32px; text-align: center;">
                <div style="display: inline-block; padding: 12px 24px; background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 8px;">
                  <div style="font-size: 14px; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Order Number
                  </div>
                  <div style="font-size: 24px; font-weight: 700; color: #047857;">
                    ${data.orderNumber}
                  </div>
                </div>
              </div>

              <!-- Success Message -->
              <p style="margin: 0 0 24px 0; color: #374151; line-height: 1.6;">
                Your order has been confirmed and is being processed. We'll send you another email when your order is ready.
              </p>

              <!-- Fulfillment Details -->
              ${fulfillmentDetailsHtml}

              <!-- Order Items -->
              <h2 style="margin: 32px 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                Order Items
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
              </table>

              <!-- Order Summary -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Subtotal</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827;">$${data.subtotal.toFixed(2)}</td>
                </tr>
                ${
                  data.deliveryFee > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Delivery Fee</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827;">$${data.deliveryFee.toFixed(2)}</td>
                </tr>
                `
                    : ''
                }
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0; font-size: 18px; font-weight: 600; color: #111827;">Total</td>
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 600; color: #10b981;">
                    $${data.total.toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="margin: 32px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders"
                   style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Order Details
                </a>
              </div>

              <!-- Help Section -->
              <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                  Questions about your order?
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact"
                   style="color: #10b981; text-decoration: none; font-weight: 500;">
                  Contact Support
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Local Market - Fresh, Local Products
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Local Market. All rights reserved.
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
