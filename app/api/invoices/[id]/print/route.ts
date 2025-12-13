import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Invoice } from '@/types/invoice';
import { generatePrintableInvoice } from '@/lib/templates/printable-invoice';
import { getStoreSettings } from '@/services/business-info-service';
import { getUserRole, getAuthUserId } from '@/lib/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin';

/**
 * GET - Generate printable/downloadable invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;

    if (!invoiceId) {
      return new NextResponse('Invoice ID is required', { status: 400 });
    }

    // Get user info for authorization
    const role = await getUserRole();
    const userId = await getAuthUserId();

    if (!userId) {
      return new NextResponse('Unauthorized - Please log in', { status: 401 });
    }

    // Fetch invoice from Firestore using Admin SDK
    const firestore = getAdminFirestore();
    const invoiceDoc = await firestore.collection('invoices').doc(invoiceId).get();

    if (!invoiceDoc.exists) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const invoice = {
      id: invoiceDoc.id,
      ...invoiceDoc.data(),
    } as Invoice;

    // Authorization: Admin or invoice owner can access
    const isAdmin = role === 'admin' || role === 'super_admin';

    // Check if user owns this invoice by matching their user record to the invoice client email
    let isOwner = false;
    if (!isAdmin) {
      const userDoc = await firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        isOwner = userData?.email?.toLowerCase() === invoice.client.email.toLowerCase();
      }
    }

    if (!isAdmin && !isOwner) {
      return new NextResponse('Unauthorized - You do not have permission to access this invoice', { status: 403 });
    }

    // Get business information from settings
    const settings = await getStoreSettings();
    const address = settings.address;
    const businessInfo = {
      businessName: settings.businessName || 'Your Business',
      logo: settings.themeSettings?.logo,
      city: address?.city,
      state: address?.state,
      zipCode: address?.zipCode,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
    };

    // Generate printable HTML
    const html = generatePrintableInvoice(invoice, businessInfo);

    // Return HTML response
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Print Invoice API] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
