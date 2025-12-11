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

        // Create payment record
        const payment: PaymentInfo = {
          stripePaymentIntentId: session.payment_intent as string,
          amount: invoiceAmount, // Invoice amount only, not including processing fee
          paymentMethod: 'card',
          transactionNote: `Stripe payment - Session ${session.id}${processingFee > 0 ? ` (includes $${processingFee.toFixed(2)} processing fee)` : ''}`,
          paidAt: AdminTimestamp.now() as any,
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
