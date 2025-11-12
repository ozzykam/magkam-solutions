import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email/email-service';
import { getOrderById } from '@/services/order-service';

/**
 * TEMPORARY TEST ENDPOINT
 * Manually trigger order confirmation email for a specific order
 * DELETE THIS FILE BEFORE PRODUCTION!
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    console.log('💌 [Test Webhook] Fetching order:', orderId);
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('💌 [Test Webhook] Order found:', order.orderNumber);
    console.log('💌 [Test Webhook] Sending email to:', order.userEmail);

    // Format time slot for display
    const formatTimeSlot = (startTime?: string, endTime?: string): string | undefined => {
      if (!startTime || !endTime) return undefined;
      return `${startTime} - ${endTime}`;
    };

    const emailData = {
      orderNumber: order.orderNumber,
      customerName: order.userName,
      items: order.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price * item.quantity,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee || 0,
      total: order.total,
      fulfillmentType: order.fulfillmentType,
      deliveryDate: order.fulfillmentType === 'delivery' ? order.timeSlotDate : undefined,
      deliveryTime: order.fulfillmentType === 'delivery'
        ? formatTimeSlot(order.timeSlotStartTime, order.timeSlotEndTime)
        : undefined,
      pickupDate: order.fulfillmentType === 'pickup' ? order.timeSlotDate : undefined,
      pickupTime: order.fulfillmentType === 'pickup'
        ? formatTimeSlot(order.timeSlotStartTime, order.timeSlotEndTime)
        : undefined,
      deliveryAddress: order.deliveryAddress
        ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`
        : undefined,
    };

    const emailSent = await sendOrderConfirmationEmail(order.userEmail, emailData);

    if (emailSent) {
      console.log('✅ [Test Webhook] Email sent successfully');
      return NextResponse.json({
        success: true,
        message: `Email sent to ${order.userEmail}`,
        orderNumber: order.orderNumber,
      });
    } else {
      console.error('❌ [Test Webhook] Failed to send email');
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [Test Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
