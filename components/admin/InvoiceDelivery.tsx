'use client';

import { useState } from 'react';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { invoicePaymentAmounts } from '@/lib/invoice-payment';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function InvoiceDelivery({ invoice }: { invoice: Invoice }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const shareable = ![InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED].includes(invoice.status);
  const amounts = invoicePaymentAmounts(invoice);
  const money = (cents: number) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  async function prepare(action: 'print' | 'copy') {
    // Open synchronously so browsers do not block the print window after the request.
    const printWindow = action === 'print' ? window.open('about:blank', '_blank') : null;
    if (printWindow) printWindow.opener = null;
    setBusy(true);
    setMessage('');
    try {
      if (shareable) {
        const response = await fetch(`/api/invoices/${invoice.id}/share`, { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to create payment link');
        setUrl(data.url);
        if (action === 'copy') {
          try { await navigator.clipboard.writeText(data.url); setMessage('Client payment link copied.'); }
          catch { setMessage('Select and copy the client payment link below.'); }
        }
      }
      if (action === 'print') {
        if (printWindow) printWindow.location.href = `/api/invoices/${invoice.id}/print`;
        else setMessage('Allow pop-ups, then click Print / Save as PDF again.');
      }
    } catch (error) {
      printWindow?.close();
      setMessage(error instanceof Error ? error.message : 'Unable to prepare invoice');
    } finally { setBusy(false); }
  }

  return <Card className="p-6">
    <h2 className="text-lg font-semibold text-gray-900">Send this invoice to your client</h2>
    <p className="text-sm text-gray-600 mt-2">Save the printable invoice as a PDF and attach it to your email. The client can follow its payment link and pay through Stripe without creating an account.</p>
    {invoice.amountDue > 0 && <p className="text-sm text-gray-700 mt-2">Balance: <strong>{money(amounts.amountCents)}</strong> · Online fee ({amounts.rate}%): <strong>{money(amounts.feeCents)}</strong> · Online total: <strong>{money(amounts.totalCents)}</strong></p>}
    {!shareable && <p className="text-sm text-amber-800 mt-2">{invoice.status === InvoiceStatus.DRAFT ? 'Mark this invoice as sent to enable the client payment link. You can preview the draft PDF now.' : 'This invoice is cancelled; online payment is unavailable.'}</p>}
    <div className="flex flex-wrap gap-3 mt-4">
      <Button variant="secondary" disabled={busy} onClick={() => prepare('print')}>Print / Save as PDF</Button>
      <Button variant="primary" disabled={busy || !shareable} onClick={() => prepare('copy')}>Copy client payment link</Button>
    </div>
    {url && <label className="block text-sm text-gray-600 mt-4">Client payment link (anyone with this link can view this invoice)
      <input className="mt-1 w-full border rounded p-2 text-sm" readOnly value={url} onFocus={event => event.target.select()} />
    </label>}
    {message && <p role="status" className="mt-3 text-sm text-gray-700">{message}</p>}
  </Card>;
}
