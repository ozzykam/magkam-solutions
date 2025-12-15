import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Invoice, InvoiceStatus, PaymentInfo } from '@/types/invoice';
import Stripe from 'stripe';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

// Disable body parsing for webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get invoice ID and amounts from metadata
        const invoiceId = session.metadata?.invoiceId;
        const invoiceAmount = parseFloat(session.metadata?.invoiceAmount || '0');
        const processingFee = parseFloat(session.metadata?.processingFee || '0');

        if (!invoiceId) {
          console.error('No invoiceId in session metadata');
          return NextResponse.json({ received: true });
        }

        // Record payment using Admin SDK (bypasses security rules)
        const firestore = getAdminFirestore();
        const invoiceRef = firestore.collection('invoices').doc(invoiceId);
        const invoiceDoc = await invoiceRef.get();

        if (!invoiceDoc.exists) {
          console.error('[Webhook] Invoice not found:', invoiceId);
          return NextResponse.json({ received: true });
        }

        const invoice = {
          id: invoiceDoc.id,
          ...invoiceDoc.data(),
        } as Invoice;

        // Retrieve payment method details from Stripe
        let cardBrand: string | undefined;
        let cardLast4: string | undefined;

        try {
          const paymentIntentId = session.payment_intent as string;
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

          if (paymentIntent.payment_method) {
            const paymentMethodId = typeof paymentIntent.payment_method === 'string'
              ? paymentIntent.payment_method
              : paymentIntent.payment_method.id;

            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

            if (paymentMethod.card) {
              cardBrand = paymentMethod.card.brand; // 'visa', 'mastercard', etc.
              cardLast4 = paymentMethod.card.last4; // '4242'
              console.log(`[Webhook] Card details: ${cardBrand} ****${cardLast4}`);
            }
          }
        } catch (error) {
          console.error('[Webhook] Error retrieving payment method details:', error);
          // Continue without card details if retrieval fails
        }

        // Create payment record
        const payment: PaymentInfo = {
          stripePaymentIntentId: session.payment_intent as string,
          amount: invoiceAmount, // Invoice amount only, not including processing fee
          processingFee: processingFee, // Processing fee charged (3% for card payments)
          totalPaid: invoiceAmount + processingFee, // Total amount customer actually paid
          paymentMethod: 'card',
          transactionNote: `Stripe card payment${processingFee > 0 ? ` (includes $${processingFee.toFixed(2)} processing fee)` : ''}`,
          paidAt: AdminTimestamp.now() as any,
          cardBrand,
          cardLast4,
        };

        // Calculate new totals
        const updatedPayments = [...invoice.payments, payment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const amountDue = invoice.total - totalPaid;

        // Determine new status
        let newStatus: InvoiceStatus;
        if (amountDue <= 0) {
          newStatus = InvoiceStatus.PAID;
        } else if (totalPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        } else {
          newStatus = invoice.status;
        }

        // Update invoice
        const updates: any = {
          payments: updatedPayments,
          amountPaid: totalPaid,
          amountDue: amountDue,
          status: newStatus,
          updatedAt: AdminTimestamp.now(),
        };

        if (amountDue <= 0) {
          updates.paidAt = AdminTimestamp.now();
        }

        await invoiceRef.update(updates);

        console.log(`[Webhook] Payment recorded for invoice ${invoiceId}: $${invoiceAmount} (processing fee: $${processingFee})`);

        // Send payment notification emails
        try {
          const { getStoreSettings } = await import('@/services/business-info-service');
          const { sendPaymentReceivedEmail, sendCustomerPaymentConfirmation } = await import('@/lib/email/email-service');

          const settings = await getStoreSettings();
          const adminEmail = settings.adminNotificationEmail || settings.email;

          const paidAtFormatted = new Date().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });

          // Send admin notification
          if (adminEmail) {
            const adminEmailData = {
              invoiceNumber: invoice.invoiceNumber,
              customerName: invoice.client.name,
              customerEmail: invoice.client.email,
              customerCompany: invoice.client.company,
              paymentAmount: invoiceAmount,
              remainingBalance: amountDue,
              totalAmount: invoice.total,
              paymentMethod: 'card',
              cardBrand,
              cardLast4,
              paidAt: paidAtFormatted,
              invoiceTitle: invoice.title,
              processingFee: processingFee > 0 ? processingFee : undefined,
            };

            const adminEmailSent = await sendPaymentReceivedEmail(adminEmail, adminEmailData);
            console.log(`[Webhook] Admin notification email ${adminEmailSent ? 'sent' : 'failed'} to ${adminEmail}`);
          } else {
            console.warn('[Webhook] No admin email configured for payment notifications');
          }

          // Send customer confirmation
          const customerEmailData = {
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.client.name,
            paymentAmount: invoiceAmount,
            remainingBalance: amountDue,
            totalAmount: invoice.total,
            paymentMethod: 'card',
            cardBrand,
            cardLast4,
            paidAt: paidAtFormatted,
            invoiceTitle: invoice.title,
            processingFee: processingFee > 0 ? processingFee : undefined,
            lineItems: invoice.lineItems,
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            discountAmount: invoice.discountAmount,
            taxLabel: invoice.taxConfig?.taxLabel,
            discountReason: invoice.discount?.reason,
          };

          const customerEmailSent = await sendCustomerPaymentConfirmation(invoice.client.email, customerEmailData);
          console.log(`[Webhook] Customer confirmation email ${customerEmailSent ? 'sent' : 'failed'} to ${invoice.client.email}`);
        } catch (emailError) {
          // Don't fail the webhook if email fails
          console.error('[Webhook] Error sending payment emails:', emailError);
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('PaymentIntent failed:', paymentIntent.id);

        // If this payment was for an invoice, we might want to update its status
        const invoiceId = paymentIntent.metadata?.invoiceId;
        if (invoiceId) {
          console.log(`Payment failed for invoice ${invoiceId}. Manual intervention may be required.`);
          // Optionally: update invoice status or send notification
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);

        // Get the payment intent from the charge
        const paymentIntentId = charge.payment_intent as string;

        // Find invoices with this payment intent
        const firestore = getAdminFirestore();
        const invoicesSnapshot = await firestore
          .collection('invoices')
          .get();

        for (const invoiceDoc of invoicesSnapshot.docs) {
          const invoice = invoiceDoc.data();
          const hasPayment = invoice.payments?.some(
            (p: any) => p.stripePaymentIntentId === paymentIntentId
          );

          if (hasPayment) {
            console.log(`Refund detected for invoice ${invoiceDoc.id}, payment intent ${paymentIntentId}`);
            // Note: Refund handling should be done through the refund service
            // This is just for logging/notification purposes
          }
        }
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge;
        console.error('Charge failed:', charge.id);
        console.error('Failure message:', charge.failure_message);

        // Log for admin review
        const metadata = charge.metadata;
        if (metadata?.invoiceId) {
          console.error(`Charge failed for invoice ${metadata.invoiceId}: ${charge.failure_message}`);
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.warn('Dispute created:', dispute.id);
        console.warn('Dispute reason:', dispute.reason);
        // Admins should be notified about disputes for manual handling
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
