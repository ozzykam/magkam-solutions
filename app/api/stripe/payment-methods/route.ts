import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getUserRole, getAuthUserId } from '@/lib/auth-helpers';

/**
 * GET - Retrieve customer's saved payment methods from Stripe
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user role to verify authorization
    const role = await getUserRole();

    // Check authorization: must be the user themselves or an admin
    const firestore = getAdminFirestore();
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = usersSnapshot.docs[0].data();

    // Authorization check
    if (role !== 'admin' && role !== 'super_admin') {
      // If not admin, check if requesting their own data
      const requestUserId = await getAuthUserId();
      if (!requestUserId || userData.uid !== requestUserId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Get or create Stripe customer
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      // Search for existing customer by email
      const customers = await stripe.customers.list({
        email: email.toLowerCase(),
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save to Firestore for future use
        await firestore.collection('users').doc(userData.uid).update({
          stripeCustomerId: customerId,
        });
      } else {
        // No customer exists yet
        return NextResponse.json({ paymentMethods: [] });
      }
    }

    // Retrieve payment methods
    let paymentMethods;
    try {
      paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
    } catch (error: any) {
      // Handle case where customer ID is from test mode but we're in live mode
      if (error.code === 'resource_missing' && error.param === 'customer') {
        console.log('[Payment Methods API] Customer not found (likely test mode ID in live mode), clearing and recreating...');

        // Clear the invalid customer ID from Firestore
        if (!usersSnapshot.empty) {
          await firestore.collection('users').doc(usersSnapshot.docs[0].id).update({
            stripeCustomerId: null,
          });
        }

        // Create a new customer in live mode
        const customer = await stripe.customers.create({
          email: email.toLowerCase(),
          metadata: {
            firebaseUid: usersSnapshot.docs[0]?.id || 'unknown',
          },
        });
        customerId = customer.id;

        // Save new customer ID
        if (!usersSnapshot.empty) {
          await firestore.collection('users').doc(usersSnapshot.docs[0].id).update({
            stripeCustomerId: customerId,
          });
        }

        // Try again with new customer ID
        paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        });
      } else {
        throw error;
      }
    }

    // Get default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = !customer.deleted && customer.invoice_settings?.default_payment_method
      ? customer.invoice_settings.default_payment_method
      : null;

    // Format response
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: 'card',
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '0000',
      expMonth: pm.card?.exp_month || 0,
      expYear: pm.card?.exp_year || 0,
      isDefault: pm.id === defaultPaymentMethodId,
    }));

    return NextResponse.json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error('[Payment Methods API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment methods' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a payment method from Stripe
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Get user role to verify authorization
    const role = await getUserRole();

    if (!role) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Retrieve the payment method to verify ownership
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod.customer) {
      return NextResponse.json(
        { error: 'Payment method has no associated customer' },
        { status: 400 }
      );
    }

    // Get customer to verify ownership
    const customer = await stripe.customers.retrieve(paymentMethod.customer as string);

    if (customer.deleted) {
      return NextResponse.json(
        { error: 'Customer has been deleted' },
        { status: 404 }
      );
    }

    // Verify user owns this payment method (unless admin)
    if (role !== 'admin' && role !== 'super_admin') {
      const firestore = getAdminFirestore();
      const usersSnapshot = await firestore
        .collection('users')
        .where('stripeCustomerId', '==', customer.id)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Payment Methods API] Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
