import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { ProposalStatus } from '@/types/invoice';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { sendProposalApprovedEmail } from '@/lib/email/email-service';
import { getStoreSettings } from '@/services/business-info-service';

/**
 * POST - Accept a proposal (customer endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const { proposalId, userEmail } = await request.json();

    if (!proposalId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Admin SDK to bypass security rules
    const firestore = getAdminFirestore();
    const proposalRef = firestore.collection('proposals').doc(proposalId);
    const proposalDoc = await proposalRef.get();

    if (!proposalDoc.exists) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const proposal = proposalDoc.data();

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal data is invalid' },
        { status: 400 }
      );
    }

    // Verify the proposal belongs to this user
    if (proposal.client?.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update proposal status using Admin SDK
    const now = AdminTimestamp.now();
    await proposalRef.update({
      status: ProposalStatus.ACCEPTED,
      respondedAt: now,
      updatedAt: now,
    });

    console.log('[Accept Proposal API] Proposal status updated to ACCEPTED');

    // Send email notification to admin
    try {
      // Get admin email from business settings
      const settings = await getStoreSettings();
      const adminEmail = settings.adminNotificationEmail || settings.email;

      console.log('[Accept Proposal API] Admin email:', adminEmail || 'NOT CONFIGURED');

      if (adminEmail) {
        // Prepare email data
        const emailData = {
          proposalNumber: proposal.proposalNumber,
          customerName: proposal.client.name,
          customerEmail: proposal.client.email,
          customerCompany: proposal.client.company,
          lineItems: proposal.lineItems,
          subtotal: proposal.subtotal,
          taxAmount: proposal.taxAmount,
          discountAmount: proposal.discountAmount,
          total: proposal.total,
          taxLabel: proposal.taxConfig?.taxLabel,
          discountReason: proposal.discount?.reason,
          proposalTitle: proposal.title,
          acceptedAt: now.toDate().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        };

        // Send email
        const emailSent = await sendProposalApprovedEmail(adminEmail, emailData);
        console.log('[Accept Proposal API] Email sent:', emailSent ? 'SUCCESS' : 'FAILED');
      } else {
        console.warn('[Accept Proposal API] No admin email configured');
      }
    } catch (emailError) {
      // Don't fail the proposal acceptance if email fails
      console.error('[Accept Proposal API] Email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      proposalNumber: proposal?.proposalNumber,
    });
  } catch (error) {
    console.error('[Accept Proposal API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept proposal';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
