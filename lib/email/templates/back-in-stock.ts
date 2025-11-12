/**
 * Back in Stock Email Template
 * Sent when a product that was out of stock is restocked
 */

interface BackInStockData {
  customerName: string;
  productName: string;
  productSlug: string;
  productImage: string;
  productPrice: number;
  currentStock: number;
}

export function generateBackInStockEmail(data: BackInStockData): string {
  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/products/${data.productSlug}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Back in Stock</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                Good News!
              </h1>
              <p style="margin: 12px 0 0 0; color: #d1fae5; font-size: 18px;">
                Your wishlisted item is back in stock
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 18px; color: #111827; font-weight: 500;">
                Hi ${data.customerName},
              </p>

              <!-- Message -->}
              <p style="margin: 0 0 32px 0; color: #374151; line-height: 1.7; font-size: 15px;">
                Great news! A product you've been waiting for is now back in stock and ready to order. Don't wait too long – popular items sell out fast!
              </p>

              <!-- Product Card -->
              <div style="border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 32px;">
                <!-- Product Image -->
                <div style="position: relative; width: 100%; padding-bottom: 60%; background-color: #f3f4f6;">
                  <img
                    src="${data.productImage}"
                    alt="${data.productName}"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                  />
                </div>

                <!-- Product Info -->
                <div style="padding: 24px;">
                  <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #111827;">
                    ${data.productName}
                  </h2>

                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                      <div style="font-size: 28px; font-weight: 700; color: #10b981;">
                        $${data.productPrice.toFixed(2)}
                      </div>
                      ${
                        data.currentStock <= 10
                          ? `<div style="margin-top: 8px; color: #dc2626; font-size: 14px; font-weight: 600;">
                              ⚠️ Only ${data.currentStock} left in stock!
                            </div>`
                          : `<div style="margin-top: 8px; color: #059669; font-size: 14px; font-weight: 600;">
                              ✓ ${data.currentStock} in stock
                            </div>`
                      }
                    </div>
                  </div>

                  <!-- CTA Button -->
                  <a href="${productUrl}"
                     style="display: block; padding: 16px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                    Shop Now
                  </a>
                </div>
              </div>

              <!-- Urgency Message -->
              ${
                data.currentStock <= 10
                  ? `<div style="padding: 16px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; margin-bottom: 24px;">
                      <div style="font-weight: 600; color: #991b1b; margin-bottom: 4px; font-size: 15px;">
                        ⏰ Limited Stock Available
                      </div>
                      <div style="color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                        This item is in high demand. Order now to avoid missing out!
                      </div>
                    </div>`
                  : ''
              }

              <!-- Help Text -->}
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This email was sent because you added this item to your wishlist and requested to be notified when it's back in stock.
              </p>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                You can manage your wishlist preferences anytime in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/wishlist" style="color: #10b981; text-decoration: none; font-weight: 500;">wishlist page</a>.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Local Market - Fresh, Local Products
              </p>
              <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Local Market. All rights reserved.
              </p>
              <div style="margin-top: 16px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/wishlist" style="color: #10b981; text-decoration: none; font-weight: 500; font-size: 13px; margin: 0 8px;">View Wishlist</a>
                <span style="color: #d1d5db;">•</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="color: #10b981; text-decoration: none; font-weight: 500; font-size: 13px; margin: 0 8px;">Browse Products</a>
                <span style="color: #d1d5db;">•</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" style="color: #10b981; text-decoration: none; font-weight: 500; font-size: 13px; margin: 0 8px;">Contact Us</a>
              </div>
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
