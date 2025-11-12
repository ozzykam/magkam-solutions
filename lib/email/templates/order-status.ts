/**
 * Order Status Update Email Template
 */

interface OrderStatusData {
  orderNumber: string;
  customerName: string;
  status: string;
  statusMessage: string;
  trackingInfo?: string;
}

// Map status to emoji and color
function getStatusDisplay(status: string): { emoji: string; color: string; title: string } {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('ready') || statusLower.includes('pickup')) {
    return { emoji: '📦', color: '#10b981', title: 'Ready for Pickup' };
  }
  if (statusLower.includes('delivery') || statusLower.includes('out')) {
    return { emoji: '🚚', color: '#3b82f6', title: 'Out for Delivery' };
  }
  if (statusLower.includes('delivered') || statusLower.includes('completed')) {
    return { emoji: '✓', color: '#10b981', title: 'Delivered' };
  }
  if (statusLower.includes('cancelled')) {
    return { emoji: '✕', color: '#ef4444', title: 'Cancelled' };
  }
  if (statusLower.includes('processing')) {
    return { emoji: '⏳', color: '#f59e0b', title: 'Processing' };
  }

  return { emoji: '📋', color: '#6b7280', title: status };
}

export function generateOrderStatusEmail(data: OrderStatusData): string {
  const { emoji, color, title } = getStatusDisplay(data.status);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; background-color: ${color}; border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 12px;">${emoji}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ${title}
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Order ${data.orderNumber}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #111827;">
                Hi ${data.customerName},
              </p>

              <!-- Status Message -->
              <p style="margin: 0 0 24px 0; color: #374151; line-height: 1.6; font-size: 15px;">
                ${data.statusMessage}
              </p>

              <!-- Tracking Info (if available) -->
              ${
                data.trackingInfo
                  ? `
              <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid ${color};">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Tracking Information
                </div>
                <div style="font-size: 16px; font-weight: 600; color: #111827;">
                  ${data.trackingInfo}
                </div>
              </div>
              `
                  : ''
              }

              <!-- Order Number Box -->
              <div style="margin: 32px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
                <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  Order Number
                </div>
                <div style="font-size: 20px; font-weight: 700; color: #111827; font-family: 'Courier New', monospace;">
                  ${data.orderNumber}
                </div>
              </div>

              <!-- CTA Button -->
              <div style="margin: 32px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${data.orderNumber}"
                   style="display: inline-block; padding: 14px 32px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Order Details
                </a>
              </div>

              <!-- Help Section -->
              <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                  Need help with your order?
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact"
                   style="color: ${color}; text-decoration: none; font-weight: 500;">
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
