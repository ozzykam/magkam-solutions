import { NextRequest, NextResponse } from 'next/server';
import { sendOrderStatusEmail } from '@/lib/email/email-service';

/**
 * Test endpoint for Order Status Email
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

    // Sample order status data for testing
    const sampleStatusData = {
      orderNumber: 'TEST-' + Date.now().toString().slice(-6),
      customerName: 'Test Customer',
      status: 'out_for_delivery',
      statusMessage: 'Your order is out for delivery and will arrive soon!',
      trackingInfo: 'Expected delivery: Today by 5:00 PM',
    };

    const success = await sendOrderStatusEmail(email, sampleStatusData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Order status email sent successfully',
        orderNumber: sampleStatusData.orderNumber,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test order status email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
