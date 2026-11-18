import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { getAuthUserId } from '@/lib/auth-helpers';
import { canPayInvoice, invoicePaymentAmounts } from '@/lib/invoice-payment';
import { ensureInvoiceToken, invoiceAppOrigin, invoiceLinkRef, invoicePaymentUrl, privateInvoiceHeaders, validInvoiceId, verifyInvoiceToken } from '@/lib/server/invoice-sharing';
import { createHash, randomUUID } from 'node:crypto';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { Invoice } from '@/types/invoice';
import { getRateLimitHeaders } from '@/lib/utils/rate-limit';
import { checkInvoicePaymentRateLimit } from '@/lib/server/invoice-rate-limit';
import { invoiceCheckoutError } from '@/lib/server/invoice-checkout-error';

export async function POST(request: NextRequest) {
  let stage = 'rate_limit';
  const fail = (message: string, status: number, headers: Record<string, string> = {}) => invoiceCheckoutError(request, message, status, headers);
  try {
    // Check rate limit
    const rateLimitResult = await checkInvoicePaymentRateLimit(request);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      return fail('Too many requests. Please try again shortly.', 429, {
        ...rateLimitHeaders,
        'Retry-After': String(Math.max(1, Math.ceil((rateLimitResult.reset - Date.now()) / 1000))),
      });
    }

    const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded');
    let body;
    try { body = isForm ? Object.fromEntries(await request.formData()) : await request.json(); }
    catch { return fail('Invalid request', 400); }
    const { invoiceId, token } = body || {};
    if (!validInvoiceId(invoiceId)) return fail('Invalid invoice', 400);

    stage = 'authorize_invoice';
    const tokenAccess = await verifyInvoiceToken(invoiceId, token);
    const userId = tokenAccess ? null : await getAuthUserId();
    if (!tokenAccess && !userId) return fail('Please sign in or use your client payment link', 401);
    const firestore = getAdminFirestore();
    stage = 'read_invoice';
    const invoiceDoc = await firestore.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) return fail('Invoice not found', 404);
    const invoice = { ...invoiceDoc.data(), id: invoiceDoc.id } as Invoice;
    if (!tokenAccess) {
      const authUser = await getAdminAuth().getUser(userId!);
      if (authUser.email?.toLowerCase() !== invoice.client.email.toLowerCase()) {
        return fail('You do not have access to this invoice.', 403);
      }
    }
    if (!canPayInvoice(invoice)) return fail('This invoice is not available for payment', 409);
    const { amountCents, feeCents, totalCents, rate } = invoicePaymentAmounts(invoice);
    const processingFee = feeCents / 100;
    const amount = totalCents / 100;
    const userEmail = invoice.client.email;
    stage = 'prepare_payment_link';
    const shareToken = await ensureInvoiceToken(invoiceId);
    const returnUrl = invoicePaymentUrl(invoiceAppOrigin(request), invoiceId, shareToken);

    // Bearer-link holders must never see or reuse a client's saved payment methods.
    // Collect a fresh card through Stripe Checkout for each invoice payment.
    // Build line items
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
            description: invoice.title || invoice.description || 'Payment for services',
          },
          unit_amount: amountCents, // Convert to cents
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
            name: invoice.processingFeeConfig?.feeLabel || 'Online Payment Fee',
            description: `${rate}% of the remaining invoice balance`,
          },
          unit_amount: feeCents, // Convert to cents
        },
        quantity: 1,
      });
    }

    // Reserve a stable attempt key transactionally so concurrent clicks reuse a session.
    // A completed session blocks another charge while its webhook is in flight.
    const checkoutRef = invoiceLinkRef(invoiceId);
    const signature = createHash('sha256').update(JSON.stringify({
      amountCents, feeCents, userEmail, returnUrl, invoiceNumber: invoice.invoiceNumber,
      title: invoice.title, description: invoice.description, config: invoice.processingFeeConfig,
    })).digest('hex');
    const previous = (await checkoutRef.get()).data();
    if (previous?.checkoutSessionId) {
      stage = 'retrieve_stripe_session';
      const previousSession = await stripe.checkout.sessions.retrieve(previous.checkoutSessionId);
      if (previousSession.status === 'complete') {
        // Allow a later balance only after the earlier payment has been recorded.
        const recorded = invoice.payments?.some(p => p.stripePaymentIntentId === previousSession.payment_intent);
        if (!recorded) return fail('Payment confirmation is pending. Please refresh the invoice shortly.', 409);
      }
      if (previousSession.status === 'open' && previous.signature === signature && previousSession.url) {
        return isForm ? NextResponse.redirect(previousSession.url, 303) : NextResponse.json({ sessionId: previousSession.id, url: previousSession.url }, { headers: privateInvoiceHeaders });
      }
      if (previousSession.status === 'open') {
        stage = 'expire_stripe_session';
        await stripe.checkout.sessions.expire(previousSession.id);
      }
    }
    stage = 'reserve_checkout';
    const attempt = await firestore.runTransaction(async transaction => {
      const state = (await transaction.get(checkoutRef)).data();
      // A failed/in-progress creation can safely retry with the same Stripe key.
      if (state?.signature === signature && state.attempt
        && (!state.checkoutSessionId || state.checkoutSessionId !== previous?.checkoutSessionId)) return state.attempt as string;
      if (state?.checkoutSessionId && state.checkoutSessionId !== previous?.checkoutSessionId) {
        throw new Error('Checkout changed. Please try again.');
      }
      const nextAttempt = randomUUID();
      transaction.set(checkoutRef, { signature, attempt: nextAttempt, checkoutSessionId: null }, { merge: true });
      return nextAttempt;
    });
    const idempotencyKey = `invoice_${invoiceId}_${attempt}`;

    // Create Stripe checkout session
    stage = 'create_stripe_session';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: lineItems,
      payment_intent_data: {
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      },
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientEmail: invoice.client.email,
        invoiceAmount: (amountCents / 100).toString(),
        processingFee: processingFee?.toString() || '0',
        totalAmount: amount.toString(),
      },
      success_url: `${returnUrl}&payment=submitted`,
      cancel_url: returnUrl,
    }, {
      idempotencyKey,
    });

    stage = 'save_checkout';
    await checkoutRef.set({ checkoutSessionId: session.id }, { merge: true });
    if (isForm && session.url) return NextResponse.redirect(session.url, 303);
    return NextResponse.json(
      { sessionId: session.id, url: session.url },
      { headers: { ...rateLimitHeaders, ...privateInvoiceHeaders } }
    );
  } catch (error) {
    const reference = randomUUID();
    const details = error as { name?: string; type?: string; code?: string; requestId?: string; cause?: { code?: string } } | null;
    console.error('Error creating checkout session:', {
      reference, stage, type: details?.type || details?.name,
      code: details?.code, causeCode: details?.cause?.code, stripeRequestId: details?.requestId,
    });
    return invoiceCheckoutError(request, 'Unable to start payment. Please try again.', stage === 'rate_limit' ? 503 : 500, {}, reference);
  }
}
