/**
 * Welcome Email Template
 */

interface WelcomeData {
  name: string;
}

export function generateWelcomeEmail(data: WelcomeData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Local Market</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <div style="font-size: 64px; margin-bottom: 16px;">👋</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                Welcome to Local Market!
              </h1>
              <p style="margin: 12px 0 0 0; color: #d1fae5; font-size: 18px;">
                We're thrilled to have you join us
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 18px; color: #111827; font-weight: 500;">
                Hi ${data.name},
              </p>

              <!-- Welcome Message -->
              <p style="margin: 0 0 20px 0; color: #374151; line-height: 1.7; font-size: 15px;">
                Thank you for creating an account with Local Market! You're now part of a community that values fresh, locally-sourced products and supports local farmers and vendors.
              </p>

              <p style="margin: 0 0 32px 0; color: #374151; line-height: 1.7; font-size: 15px;">
                Here's what you can do with your new account:
              </p>

              <!-- Features List -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px 0;">
                    <div style="display: flex; align-items: flex-start;">
                      <div style="font-size: 28px; margin-right: 16px;">🛒</div>
                      <div>
                        <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 16px;">
                          Shop Fresh Products
                        </div>
                        <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                          Browse hundreds of fresh, local products from trusted farmers and vendors
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: flex-start;">
                      <div style="font-size: 28px; margin-right: 16px;">🚚</div>
                      <div>
                        <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 16px;">
                          Choose Delivery or Pickup
                        </div>
                        <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                          Select a convenient time slot for delivery or pick up your order at our store
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: flex-start;">
                      <div style="font-size: 28px; margin-right: 16px;">📦</div>
                      <div>
                        <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 16px;">
                          Track Your Orders
                        </div>
                        <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                          View order history, track deliveries, and manage your account settings
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: flex-start;">
                      <div style="font-size: 28px; margin-right: 16px;">📍</div>
                      <div>
                        <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 16px;">
                          Save Delivery Addresses
                        </div>
                        <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                          Store multiple addresses for faster checkout on future orders
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="margin: 40px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop"
                   style="display: inline-block; padding: 16px 40px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                  Start Shopping Now
                </a>
              </div>

              <!-- Tip Box -->
              <div style="margin: 32px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <div style="font-weight: 600; color: #92400e; margin-bottom: 8px; font-size: 15px;">
                  💡 Pro Tip
                </div>
                <div style="color: #78350f; font-size: 14px; line-height: 1.6;">
                  Complete your profile and add a delivery address now to make your first order even faster!
                </div>
              </div>

              <!-- Help Section -->
              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 15px;">
                  Need help getting started?
                </p>
                <div style="display: inline-block;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/profile"
                     style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-weight: 500; font-size: 14px;">
                    Complete Profile
                  </a>
                  <span style="color: #d1d5db;">•</span>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/about"
                     style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-weight: 500; font-size: 14px;">
                    Learn More
                  </a>
                  <span style="color: #d1d5db;">•</span>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact"
                     style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-weight: 500; font-size: 14px;">
                    Contact Us
                  </a>
                </div>
              </div>

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
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This email was sent to you because you created an account with Local Market.
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
