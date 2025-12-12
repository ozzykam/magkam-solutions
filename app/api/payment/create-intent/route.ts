import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  paymentRateLimiter,
  getClientIdentifier,
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/utils/rate-limit';

// Initialize Stripe lazily to avoid build-time errors
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover',
  });
}

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

    const body = await request.json();
    const { amount, orderId, customerEmail, customerName } = body;

    // Validate required fields
    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount and orderId' },
        { status: 400 }
      );
    }

    // Validate amount (must be at least $0.50)
    if (amount < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least $0.50' },
        { status: 400 }
      );
    }

    // Get Stripe instance
    const stripe = getStripe();

    // Generate idempotency key to prevent duplicate charges
    // Using orderId ensures retry safety for the same order
    const idempotencyKey = `payment_intent_${orderId}_${Math.round(amount)}`;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
      },
      description: `Order #${orderId}`,
      receipt_email: customerEmail,
    }, {
      idempotencyKey,
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      { headers: rateLimitHeaders }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
