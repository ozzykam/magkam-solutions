import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { Invoice } from '@/types/invoice';
import { generatePrintableInvoice } from '@/lib/templates/printable-invoice';
import { getUserRole, getAuthUserId } from '@/lib/auth-helpers';
import { invoiceAppOrigin, invoiceBusinessInfo, invoiceLinkRef, invoicePaymentUrl, privateInvoiceHeaders } from '@/lib/server/invoice-sharing';

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
      const authUser = await getAdminAuth().getUser(userId);
      isOwner = authUser.email?.toLowerCase() === invoice.client.email.toLowerCase();
    }

    if (!isAdmin && !isOwner) {
      return new NextResponse('Unauthorized - You do not have permission to access this invoice', { status: 403 });
    }

    // Get business information from settings
    const businessInfo = await invoiceBusinessInfo();
    const token = (await invoiceLinkRef(invoiceId).get()).data()?.token;

    // Generate printable HTML
    const html = generatePrintableInvoice(invoice, businessInfo, {
      paymentUrl: token ? invoicePaymentUrl(invoiceAppOrigin(request), invoiceId, token) : undefined,
    });

    // Return HTML response
    return new NextResponse(html, {
      headers: {
        ...privateInvoiceHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Print Invoice API] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
