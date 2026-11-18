import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { generatePrintableInvoice } from '@/lib/templates/printable-invoice';
import { invoiceAppOrigin, invoiceBusinessInfo, invoicePaymentUrl, privateInvoiceHeaders, validInvoiceId, verifyInvoiceToken } from '@/lib/server/invoice-sharing';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('token');
  try {
    if (!validInvoiceId(id) || !await verifyInvoiceToken(id, token)) {
      return new NextResponse('This invoice link is unavailable. Please request a new link from the sender.', { status: 404, headers: privateInvoiceHeaders });
    }
    const doc = await getAdminFirestore().collection('invoices').doc(id).get();
    if (!doc.exists || [InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED].includes(doc.data()!.status)) {
      return new NextResponse('This invoice is no longer available for payment.', { status: 404, headers: privateInvoiceHeaders });
    }
    const invoice = { ...doc.data(), id: doc.id } as Invoice;
    const html = generatePrintableInvoice(invoice, await invoiceBusinessInfo(), {
      paymentUrl: invoicePaymentUrl(invoiceAppOrigin(request), id, token!),
      checkoutToken: token!,
      paymentSubmitted: request.nextUrl.searchParams.get('payment') === 'submitted',
    });
    return new NextResponse(html, { headers: { ...privateInvoiceHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    console.error('[Public invoice]', error);
    return new NextResponse('Unable to load the invoice. Please try again later.', { status: 500, headers: privateInvoiceHeaders });
  }
}
