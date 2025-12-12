import { NextRequest, NextResponse } from 'next/server';
import { sendProposalApprovedEmail } from '@/lib/email/email-service';
import { isAdmin } from '@/lib/auth-helpers';

/**
 * Test endpoint for proposal approval email
 * Admin only - for testing email functionality
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('[Test Proposal Email] Sending test email to:', email);

    // Sample proposal data for testing
    const sampleProposalData = {
      proposalNumber: 'PROP-TEST-' + Date.now().toString().slice(-6),
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerCompany: 'Test Company Inc.',
      lineItems: [
        {
          description: 'Website Design & Development',
          quantity: 1,
          rate: 5000,
          amount: 5000,
        },
        {
          description: 'SEO Optimization',
          quantity: 3,
          rate: 500,
          amount: 1500,
        },
      ],
      subtotal: 6500,
      taxAmount: 520,
      discountAmount: 500,
      total: 6520,
      taxLabel: 'Sales Tax (8%)',
      discountReason: 'Early bird discount',
      proposalTitle: 'Website Development Proposal',
      acceptedAt: new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };

    const success = await sendProposalApprovedEmail(email, sampleProposalData);

    if (success) {
      console.log('[Test Proposal Email] ✅ Email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Proposal approval email sent successfully',
        proposalNumber: sampleProposalData.proposalNumber,
      });
    } else {
      console.error('[Test Proposal Email] ❌ Failed to send email');
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Test Proposal Email] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
