import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updatePaymentStatus, updateOrderStatus, getOrderById } from '@/services/order-service-admin';
import { PaymentStatus, OrderStatus } from '@/types/order';
import { createOrderFulfillment } from '@/services/order-fulfillment-service-admin';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '@/lib/email/email-service';
import { decrementProductStock } from '@/services/product-service-admin';
import { getStoreSettings } from '@/services/business-info-service-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: `Webhook Error: ${error}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCancellation(canceledPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    console.log(`Payment successful for order ${orderId}`);

    // Update payment status in Firestore
    // Note: In newer Stripe API versions, charges are accessed via latest_charge
    const chargeId = typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;

    // Extract payment method details
    let paymentMethodDetails = null;
    let paymentMethod = 'card'; // default
    let cardBrand: string | undefined;
    let cardLast4: string | undefined;

    // Fetch payment method details if available
    if (paymentIntent.payment_method) {
      try {
        const pm = await stripe.paymentMethods.retrieve(
          paymentIntent.payment_method as string
        );

        paymentMethod = pm.type;

        if (pm.card) {
          cardBrand = pm.card.brand;
          cardLast4 = pm.card.last4;
          paymentMethodDetails = {
            type: pm.type,
            card: {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
              funding: pm.card.funding,
            }
          };
        }
      } catch (err) {
        console.error('Error retrieving payment method:', err);
      }
    }

    await updatePaymentStatus(
      orderId,
      PaymentStatus.PAID,
      paymentIntent.id,
      chargeId,
      paymentMethod,
      cardBrand,
      cardLast4,
      paymentMethodDetails
    );

    // Update order status to PAID
    await updateOrderStatus(
      orderId,
      OrderStatus.PAID,
      'Payment confirmed via Stripe webhook',
      'system',
      'Stripe Webhook'
    );

    // Get order to decrement stock
    let order;
    try {
      order = await getOrderById(orderId);

      // Decrement stock for each product in the order
      if (order && order.items) {
        for (const item of order.items) {
          try {
            await decrementProductStock(item.productId, item.quantity);
            console.log(`Decremented stock for product ${item.productId} (${item.productName}) by ${item.quantity}`);
          } catch (stockError) {
            console.error(`Error decrementing stock for product ${item.productId}:`, stockError);
            // Continue with other items even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Error decrementing stock:', error);
      // Don't fail the webhook if stock update fails
    }

    // Create order fulfillment document for grocer processing
    try {
      // Only fetch order again if we don't already have it
      if (!order) {
        order = await getOrderById(orderId);
      }
      if (order) {
        await createOrderFulfillment(order);
        console.log(`Order fulfillment created for order ${orderId}`);
      }
    } catch (fulfillmentError) {
      console.error('Error creating order fulfillment:', fulfillmentError);
      // Don't fail the webhook if fulfillment creation fails
    }

    // Send order confirmation email
    try {
      console.log('💌 [Webhook] Attempting to send order confirmation email...');
      if (!order) {
        order = await getOrderById(orderId);
      }

      if (order) {
        console.log('💌 [Webhook] Order found, preparing email data for:', order.userEmail);
        // Format time slot for display (e.g., "10:00 AM - 12:00 PM")
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
          // Map Order fields to email template format
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

        console.log('💌 [Webhook] Calling sendOrderConfirmationEmail...');
        const emailSent = await sendOrderConfirmationEmail(order.userEmail, emailData);
        if (emailSent) {
          console.log(`✅ [Webhook] Order confirmation email sent successfully to ${order.userEmail}`);
        } else {
          console.error(`❌ [Webhook] Failed to send order confirmation email to ${order.userEmail}`);
        }

        // Send admin notification email
        try {
          console.log('📧 [Webhook] Attempting to send admin notification email...');
          const settings = await getStoreSettings();

          if (settings?.adminNotificationEmail) {
            console.log('📧 [Webhook] Admin notification email configured:', settings.adminNotificationEmail);

            const adminEmailData = {
              orderNumber: order.orderNumber,
              customerName: order.userName,
              customerEmail: order.userEmail,
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
              customerNotes: order.customerNotes,
            };

            const adminEmailSent = await sendAdminOrderNotificationEmail(
              settings.adminNotificationEmail,
              adminEmailData
            );

            if (adminEmailSent) {
              console.log(`✅ [Webhook] Admin notification email sent successfully to ${settings.adminNotificationEmail}`);
            } else {
              console.error(`❌ [Webhook] Failed to send admin notification email`);
            }
          } else {
            console.log('ℹ️ [Webhook] No admin notification email configured, skipping admin notification');
          }
        } catch (adminEmailError) {
          console.error('❌ Error sending admin notification email:', adminEmailError);
          // Don't fail the webhook if admin email fails
        }
      } else {
        console.error('❌ Cannot send email: order is null');
      }
    } catch (emailError) {
      console.error('❌ Error sending order confirmation email:', emailError);
      console.error('Email error details:', JSON.stringify(emailError, null, 2));
      // Don't fail the webhook if email fails
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    console.log(`Payment failed for order ${orderId}`);

    // Update payment status in Firestore
    await updatePaymentStatus(
      orderId,
      PaymentStatus.FAILED,
      paymentIntent.id
    );

    // TODO: Send payment failure notification email
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    console.log(`Payment canceled for order ${orderId}`);

    // Update payment status in Firestore
    await updatePaymentStatus(
      orderId,
      PaymentStatus.FAILED,
      paymentIntent.id
    );

    // Update order status to CANCELLED
    await updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      'Payment cancelled',
      'system',
      'Stripe Webhook'
    );
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}
