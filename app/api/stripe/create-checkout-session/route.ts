import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Invoice } from '@/types/invoice';
import {
  paymentRateLimiter,
  getClientIdentifier,
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/utils/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(paymentRateLimiter, identifier);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const { invoiceId, userEmail, amount, processingFee } = await request.json();

    console.log('[Stripe Checkout] Request received:', {
      invoiceId,
      userEmail,
      amount,
      processingFee
    });

    if (!invoiceId || !userEmail || !amount) {
      console.error('[Stripe Checkout] Missing required fields:', { invoiceId, userEmail, amount });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch the invoice using Admin SDK (bypasses security rules)
    console.log('[Stripe Checkout] Fetching invoice:', invoiceId);
    const firestore = getAdminFirestore();
    const invoiceDoc = await firestore.collection('invoices').doc(invoiceId).get();

    if (!invoiceDoc.exists) {
      console.error('[Stripe Checkout] Invoice not found:', invoiceId);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = {
      id: invoiceDoc.id,
      ...invoiceDoc.data(),
    } as Invoice;

    console.log('[Stripe Checkout] Invoice found:', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientEmail: invoice.client.email,
      amountDue: invoice.amountDue,
      status: invoice.status
    });

    // Verify the user has access to this invoice
    if (invoice.client.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if invoice is already paid
    if (invoice.amountDue <= 0) {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Get or create Stripe Customer for this user
    console.log('[Stripe Checkout] Getting/creating Stripe Customer for:', userEmail);
    let customerId: string | undefined;

    // First, try to get customer ID from Firestore user record
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '==', userEmail.toLowerCase())
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      customerId = userData.stripeCustomerId;

      // Validate the customer ID exists in Stripe (handles test/live mode mismatch)
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
          console.log('[Stripe Checkout] Validated existing Stripe customer:', customerId);
        } catch (error: any) {
          if (error.code === 'resource_missing') {
            console.log('[Stripe Checkout] Customer ID invalid (likely test mode in live mode), clearing...');
            // Clear invalid customer ID
            await firestore.collection('users').doc(usersSnapshot.docs[0].id).update({
              stripeCustomerId: null,
            });
            customerId = undefined;
          } else {
            throw error;
          }
        }
      }
    }

    // If no customer ID in Firestore, search Stripe by email
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: userEmail.toLowerCase(),
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('[Stripe Checkout] Found existing Stripe customer:', customerId);
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: userEmail.toLowerCase(),
          name: invoice.client.name,
          metadata: {
            firebaseUid: usersSnapshot.docs[0]?.id || 'unknown',
          },
        });
        customerId = customer.id;
        console.log('[Stripe Checkout] Created new Stripe customer:', customerId);
      }

      // Save customer ID to Firestore if we have a user record
      if (!usersSnapshot.empty) {
        await firestore.collection('users').doc(usersSnapshot.docs[0].id).update({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        });
        console.log('[Stripe Checkout] Saved Stripe customer ID to Firestore');
      }
    } else {
      console.log('[Stripe Checkout] Using existing Stripe customer from Firestore:', customerId);
    }

    // Build line items
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
            description: invoice.title || invoice.description || 'Payment for services',
          },
          unit_amount: Math.round(invoice.amountDue * 100), // Convert to cents
        },
        quantity: 1,
      },
    ];

    // Add processing fee as separate line item if present
    if (processingFee && processingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Credit Card Processing Fee',
            description: '3% processing fee',
          },
          unit_amount: Math.round(processingFee * 100), // Convert to cents
        },
        quantity: 1,
      });
    }

    // Generate idempotency key to prevent duplicate checkout sessions
    // Using invoiceId and amount ensures retry safety for the same invoice payment
    const idempotencyKey = `checkout_${invoiceId}_${Math.round(amount * 100)}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: customerId, // Use Stripe Customer ID instead of email
      line_items: lineItems,
      payment_intent_data: {
        setup_future_usage: 'on_session', // Save payment method for future use
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      },
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientEmail: invoice.client.email,
        invoiceAmount: invoice.amountDue.toString(),
        processingFee: processingFee?.toString() || '0',
        totalAmount: amount.toString(),
      },
      success_url: `${request.headers.get('origin')}/account/invoices/${invoiceId}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/account/invoices/${invoiceId}?payment=cancelled`,
    }, {
      idempotencyKey,
    });

    return NextResponse.json(
      { sessionId: session.id, url: session.url },
      { headers: rateLimitHeaders }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
