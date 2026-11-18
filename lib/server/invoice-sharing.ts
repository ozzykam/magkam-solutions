import { randomBytes, timingSafeEqual } from 'node:crypto';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { DEFAULT_STORE_SETTINGS, StoreSettings } from '@/types/business-info';

// Separate, server-only collection: never expose bearer tokens in client-readable invoices.
export const invoiceLinkRef = (id: string) => getAdminFirestore().collection('invoicePaymentLinks').doc(id);
export const validInvoiceId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);

export async function ensureInvoiceToken(id: string) {
  const ref = invoiceLinkRef(id);
  return getAdminFirestore().runTransaction(async transaction => {
    const existing = await transaction.get(ref);
    if (existing.data()?.token) return existing.data()!.token as string;
    const token = randomBytes(32).toString('hex');
    transaction.set(ref, { token });
    return token;
  });
}

export async function verifyInvoiceToken(id: string, token: unknown) {
  if (!validInvoiceId(id) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
  const stored = (await invoiceLinkRef(id).get()).data()?.token;
  return typeof stored === 'string' && stored.length === token.length
    && timingSafeEqual(Buffer.from(stored), Buffer.from(token));
}

export function invoicePaymentUrl(origin: string, id: string, token: string) {
  return `${origin}/pay/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`;
}

export function invoiceAppOrigin(request: Request) {
  // Never accept arbitrary Origin headers as Stripe return destinations.
  return new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
}

export async function invoiceBusinessInfo() {
  const settings = { ...DEFAULT_STORE_SETTINGS, ...(await getAdminFirestore().collection('storeSettings').doc('main').get()).data() } as StoreSettings;
  return {
    businessName: settings.businessName || 'MagKam Solutions', logo: settings.themeSettings?.logo,
    city: settings.address?.city, state: settings.address?.state, zipCode: settings.address?.zipCode,
    phone: settings.phone, email: settings.email, website: settings.website,
  };
}

export const privateInvoiceHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
};
