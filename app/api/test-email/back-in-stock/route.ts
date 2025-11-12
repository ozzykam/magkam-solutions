import { NextRequest, NextResponse } from 'next/server';
import { sendBackInStockEmail } from '@/lib/email/email-service';

/**
 * Test endpoint for Back-in-Stock Email
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

    // Sample product data for testing
    const sampleProductData = {
      customerName: 'Test Customer',
      productName: 'Organic Avocados',
      productSlug: 'organic-avocados',
      productImage: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
      productPrice: 6.99,
      currentStock: 50,
    };

    const success = await sendBackInStockEmail(email, sampleProductData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Back-in-stock email sent successfully',
        productName: sampleProductData.productName,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test back-in-stock email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
