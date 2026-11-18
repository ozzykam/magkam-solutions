import { NextResponse } from 'next/server';
import { escapeInvoiceHtml } from '@/lib/templates/printable-invoice';
import { privateInvoiceHeaders } from '@/lib/server/invoice-sharing';

export function invoiceCheckoutError(request: Request, message: string, status: number, headers: Record<string, string> = {}, reference?: string) {
  const responseHeaders = { ...privateInvoiceHeaders, ...headers };
  if (!request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    return NextResponse.json({ error: message, ...(reference ? { reference } : {}) }, { status, headers: responseHeaders });
  }
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Invoice payment unavailable</title>
<style>body{font:16px/1.6 Arial,sans-serif;background:#f1f5f9;color:#172b3a;margin:0;padding:24px}main{max-width:560px;margin:10vh auto;background:white;padding:32px;border-radius:12px}h1{font-size:24px}button{background:#164e63;color:white;border:0;border-radius:6px;padding:12px 18px;font-size:16px;cursor:pointer}.reference{color:#546776;font-size:12px}</style></head>
<body><main><h1>We couldn’t open checkout</h1><p>${escapeInvoiceHtml(message)}</p><p>Return to your invoice to try again, or contact the sender for help.</p><button onclick="history.back()">Return to invoice</button>${reference ? `<p class="reference">Support reference: ${escapeInvoiceHtml(reference)}</p>` : ''}</main></body></html>`, {
    status, headers: { ...responseHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
}
