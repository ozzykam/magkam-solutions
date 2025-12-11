import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { getInvoiceById } from '@/services/invoice-service';

export async function POST(request: NextRequest) {
  try {
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

    // Fetch the invoice
    console.log('[Stripe Checkout] Fetching invoice:', invoiceId);
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      console.error('[Stripe Checkout] Invoice not found:', invoiceId);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: invoice.client.email,
      line_items: lineItems,
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
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
