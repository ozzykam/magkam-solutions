import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/email-service';

/**
 * Test endpoint for Welcome Email
 * Admin only - for testing email functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const success = await sendWelcomeEmail(email, {
      name: name || 'Test User',
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test welcome email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
