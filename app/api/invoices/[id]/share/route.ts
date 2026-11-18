import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth-helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { InvoiceStatus } from '@/types/invoice';
import { ensureInvoiceToken, invoiceAppOrigin, invoicePaymentUrl, privateInvoiceHeaders, validInvoiceId } from '@/lib/server/invoice-sharing';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = await params;
  if (!validInvoiceId(id)) return NextResponse.json({ error: 'Invalid invoice' }, { status: 400 });
  try {
    const invoice = await getAdminFirestore().collection('invoices').doc(id).get();
    if (!invoice.exists) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if ([InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED].includes(invoice.data()!.status)) {
      return NextResponse.json({ error: 'Mark the invoice as sent before creating a client link. Cancelled invoices cannot be shared.' }, { status: 409 });
    }
    const token = await ensureInvoiceToken(id);
    return NextResponse.json({ url: invoicePaymentUrl(invoiceAppOrigin(request), id, token) }, { headers: privateInvoiceHeaders });
  } catch (error) {
    console.error('[Invoice share]', error);
    return NextResponse.json({ error: 'Unable to prepare the client link' }, { status: 500 });
  }
}
