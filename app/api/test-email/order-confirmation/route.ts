import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email/email-service';

/**
 * Test endpoint for Order Confirmation Email
 * Admin only - for testing email functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Sample order data for testing
    const sampleOrderData = {
      orderNumber: 'TEST-' + Date.now().toString().slice(-6),
      customerName: 'Test Customer',
      items: [
        { name: 'Organic Apples (1 lb)', quantity: 2, price: 5.98 },
        { name: 'Fresh Milk (1 gallon)', quantity: 1, price: 4.99 },
        { name: 'Whole Wheat Bread', quantity: 3, price: 11.97 },
      ],
      subtotal: 22.94,
      deliveryFee: 5.00,
      total: 27.94,
      fulfillmentType: 'delivery' as const,
      deliveryDate: new Date(Date.now() + 86400000).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      deliveryTime: '2:00 PM - 4:00 PM',
      deliveryAddress: '123 Main Street, Springfield, IL 62701',
    };

    const success = await sendOrderConfirmationEmail(email, sampleOrderData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully',
        orderNumber: sampleOrderData.orderNumber,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test order confirmation email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
