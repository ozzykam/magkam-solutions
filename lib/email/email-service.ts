/**
 * Email Service
 *
 * This service handles sending emails using Resend API.
 * Supports order confirmations, status updates, and welcome emails.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('[Email Service] 🔍 Starting email send process...');
    console.log('[Email Service] Recipient:', options.to);
    console.log('[Email Service] Subject:', options.subject);
    console.log('[Email Service] NODE_ENV:', process.env.NODE_ENV);
    console.log('[Email Service] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('[Email Service] RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);
    console.log('[Email Service] RESEND_API_KEY prefix:', process.env.RESEND_API_KEY?.substring(0, 5));
    console.log('[Email Service] EMAIL_FROM:', process.env.EMAIL_FROM);

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('[Email Service] ❌ RESEND_API_KEY not configured');
      console.error('[Email Service] Available env vars:', Object.keys(process.env).filter(k => k.includes('RESEND') || k.includes('EMAIL')));
      // In development, log email instead of throwing error
      if (process.env.NODE_ENV === 'development') {
        console.log('[Email Service] Would send email:', {
          to: options.to,
          subject: options.subject,
        });
        return true;
      }
      throw new Error('RESEND_API_KEY not configured');
    }

    const fromEmail = process.env.EMAIL_FROM || 'noreply@magkamsolutions.com';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email Service] ❌ Failed to send email');
      console.error('[Email Service] Response status:', response.status, response.statusText);
      console.error('[Email Service] Error details:', JSON.stringify(error, null, 2));
      console.error('[Email Service] Recipient:', options.to);
      console.error('[Email Service] Subject:', options.subject);
      return false;
    }

    const data = await response.json();
    console.log('[Email Service] ✅ Email sent successfully to:', options.to);
    console.log('[Email Service] Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return false;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderData: {
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
): Promise<boolean> {
  const { generateOrderConfirmationEmail } = await import('./templates/order-confirmation');

  const html = generateOrderConfirmationEmail(orderData);
  const subject = `Order Confirmation - ${orderData.orderNumber}`;

  return sendEmail({ to, subject, html });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(
  to: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    status: string;
    statusMessage: string;
    trackingInfo?: string;
  }
): Promise<boolean> {
  const { generateOrderStatusEmail } = await import('./templates/order-status');

  const html = generateOrderStatusEmail(orderData);
  const subject = `Order Update - ${orderData.orderNumber}`;

  return sendEmail({ to, subject, html });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  userData: {
    name: string;
  }
): Promise<boolean> {
  const { generateWelcomeEmail } = await import('./templates/welcome');

  const html = generateWelcomeEmail(userData);
  const subject = 'Welcome to Local Market!';

  return sendEmail({ to, subject, html });
}

/**
 * Send back in stock notification email
 */
export async function sendBackInStockEmail(
  to: string,
  productData: {
    customerName: string;
    productName: string;
    productSlug: string;
    productImage: string;
    productPrice: number;
    currentStock: number;
  }
): Promise<boolean> {
  const { generateBackInStockEmail } = await import('./templates/back-in-stock');

  const html = generateBackInStockEmail(productData);
  const subject = `${productData.productName} is Back in Stock!`;

  return sendEmail({ to, subject, html });
}

/**
 * Send admin notification email for new orders
 */
export async function sendAdminOrderNotificationEmail(
  to: string,
  orderData: {
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
): Promise<boolean> {
  const { generateAdminOrderNotificationEmail } = await import('./templates/admin-order-notification');

  const html = generateAdminOrderNotificationEmail(orderData);
  const subject = `🔔 New Order - ${orderData.orderNumber}`;

  return sendEmail({ to, subject, html });
}
