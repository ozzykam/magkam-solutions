const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(relative, mocks = {}, cache = new Map()) {
  const filename = path.resolve(__dirname, '..', relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = module.paths;
  const originalRequire = mod.require.bind(mod);
  mod.require = name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('@/') ? load(name.slice(2) + '.ts', mocks, cache) : originalRequire(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
  return mod.exports;
}
const types = load('types/invoice.ts');
const { invoicePaymentAmounts, canPayInvoice } = load('lib/invoice-payment.ts');
const { generatePrintableInvoice } = load('lib/templates/printable-invoice.ts');
const fixture = () => ({
  id: 'invoice1', invoiceNumber: 'INV-2026-001', status: 'sent',
  client: { name: 'Sample Client', email: 'client@example.com' },
  subtotal: 1000, total: 1000, taxAmount: 0, discountAmount: 0, amountPaid: 0, amountDue: 1000,
  lineItems: [{ description: 'Website development', quantity: 1, rate: 1000, amount: 1000 }],
  payments: [], processingFeeConfig: types.NEW_INVOICE_PROCESSING_FEE,
  issueDate: '2026-11-17', dueDate: '2026-12-17', notes: 'PRIVATE INTERNAL NOTE',
});

test('3% is charged on remaining balance, rounded to cents; legacy and waived fees remain zero', () => {
  assert.deepEqual(invoicePaymentAmounts(fixture()), { amountCents: 100000, feeCents: 3000, totalCents: 103000, rate: 3 });
  assert.equal(invoicePaymentAmounts({ ...fixture(), amountDue: 333.33 }).feeCents, 1000);
  assert.equal(invoicePaymentAmounts({ ...fixture(), amountDue: 0.17 }).feeCents, 1);
  assert.equal(invoicePaymentAmounts({ ...fixture(), processingFeeConfig: undefined }).feeCents, 0);
  assert.equal(invoicePaymentAmounts({ ...fixture(), processingFeeConfig: { enabled: false, cardFeePercent: 3 } }).feeCents, 0);
});
test('invalid amounts fail closed and only issued outstanding invoices can be paid', () => {
  for (const amountDue of [NaN, Infinity, -1]) assert.throws(() => invoicePaymentAmounts({ ...fixture(), amountDue }));
  for (const status of ['draft', 'cancelled', 'paid']) assert.equal(canPayInvoice({ ...fixture(), status }), false);
  for (const status of ['sent', 'viewed', 'overdue', 'partially_paid']) assert.equal(canPayInvoice({ ...fixture(), status }), true);
  assert.equal(canPayInvoice({ ...fixture(), amountDue: 0 }), false);
});
test('print includes fee breakdown and clickable client URL, excludes internal notes and unsafe HTML', () => {
  const invoice = fixture();
  invoice.client.name = '<script>alert(1)</script>';
  invoice.lineItems[0].description = '<img src=x onerror=alert(1)>';
  invoice.terms = 'Payment <within> 30 days';
  const html = generatePrintableInvoice(invoice, { businessName: 'Example & Co', logo: 'javascript:alert(1)' }, { paymentUrl: 'https://example.com/pay/invoice1?token=abc' });
  assert.match(html, /\$1,030\.00/); assert.match(html, /Online payment fee \(3%\)/);
  assert.match(html, /href="https:\/\/example.com\/pay\/invoice1\?token=abc"/);
  assert.match(html, /&lt;script&gt;/); assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /PRIVATE INTERNAL NOTE|javascript:|<script>/);
  assert.match(html, /@media print/);
});
test('paid, cancelled and draft printouts have correct labels and no checkout form', () => {
  for (const status of ['draft', 'cancelled', 'paid']) {
    const invoice = { ...fixture(), status, ...(status === 'paid' ? { amountDue: 0, amountPaid: 1000 } : {}) };
    const html = generatePrintableInvoice(invoice, { businessName: 'Example' }, { paymentUrl: 'https://example.com/pay/1', checkoutToken: 'a'.repeat(64) });
    assert.match(html, new RegExp(status.toUpperCase())); assert.doesNotMatch(html, /<form/);
  }
});

function harness({ authenticated = false, redis } = {}) {
  const records = new Map([['invoices/invoice1', fixture()], ['users/user1', { email: 'client@example.com' }]]);
  const snapshot = key => ({ exists: records.has(key), id: key.split('/').at(-1), data: () => structuredClone(records.get(key)) });
  const ref = key => ({ key, get: async () => snapshot(key), set: async (data, options) => records.set(key, { ...(options?.merge ? records.get(key) : {}), ...data }), update: async data => records.set(key, { ...records.get(key), ...data }) });
  let transactionQueue = Promise.resolve();
  const db = { collection: name => ({ doc: id => ref(`${name}/${id}`) }), runTransaction: work => {
    const result = transactionQueue.then(() => work({ get: r => r.get(), set: (r, data, options) => r.set(data, options), update: (r, data) => r.update(data) }));
    transactionQueue = result.catch(() => {}); return result;
  } };
  const sessions = new Map(); const keys = new Map(); const calls = [];
  const stripe = { checkout: { sessions: {
    create: async (params, options) => {
      if (keys.has(options.idempotencyKey)) return keys.get(options.idempotencyKey);
      calls.push(params);
      const session = { id: `cs_${calls.length}`, url: `https://checkout.stripe.com/session${calls.length}`, status: 'open' };
      sessions.set(session.id, session); keys.set(options.idempotencyKey, session); return session;
    },
    retrieve: async id => sessions.get(id),
    expire: async id => { sessions.get(id).status = 'expired'; },
  } }, webhooks: { constructEvent: body => JSON.parse(body) }, paymentIntents: { retrieve: async () => ({}) } };
  const mocks = {
    '@/lib/firebase/admin': { getAdminFirestore: () => db, getAdminAuth: () => ({ getUser: async () => records.get('users/user1') }) },
    '@/lib/auth-helpers': { getAuthUserId: async () => authenticated ? 'user1' : null, isAdmin: async () => authenticated },
    '@/lib/stripe/server': { stripe },
    '@/lib/utils/rate-limit': { paymentRateLimiter: redis, getClientIdentifier: () => 'test', getRateLimitHeaders: () => ({}) },
    '@/services/business-info-service': { getStoreSettings: async () => ({}) },
    '@/lib/email/email-service': { sendCustomerPaymentConfirmation: async () => true, sendPaymentReceivedEmail: async () => true },
    'firebase-admin/firestore': { Timestamp: { now: () => '2026-11-17' } },
  };
  const route = load('app/api/stripe/create-checkout-session/route.ts', mocks);
  const sharing = load('lib/server/invoice-sharing.ts', mocks);
  const request = body => new Request('https://example.com/api/stripe/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { records, sessions, calls, mocks, route, sharing, request };
}
test('payment link tokens are stable, unguessable, scoped to one invoice, and validated', async () => {
  const h = harness();
  const token = await h.sharing.ensureInvoiceToken('invoice1');
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(await h.sharing.ensureInvoiceToken('invoice1'), token);
  assert.equal(await h.sharing.verifyInvoiceToken('invoice1', token), true);
  assert.equal(await h.sharing.verifyInvoiceToken('invoice2', token), false);
  assert.equal(await h.sharing.verifyInvoiceToken('invoice1', 'bad'), false);
});
test('checkout rejects email-only authorization and arbitrary invoice ids', async () => {
  const h = harness();
  assert.equal((await h.route.POST(h.request({ invoiceId: 'invoice1', userEmail: 'client@example.com', amount: 1 }))).status, 401);
  assert.equal((await h.route.POST(h.request({ invoiceId: '../bad' }))).status, 400);
  assert.equal(h.calls.length, 0);
});
test('guest checkout ignores supplied prices, discloses fee, and never attaches saved payment methods', async () => {
  const h = harness(); const token = await h.sharing.ensureInvoiceToken('invoice1');
  const response = await h.route.POST(h.request({ invoiceId: 'invoice1', token, amount: 0.01, processingFee: 0 }));
  assert.equal(response.status, 200);
  assert.deepEqual(h.calls[0].line_items.map(item => item.price_data.unit_amount), [100000, 3000]);
  assert.equal(h.calls[0].metadata.invoiceAmount, '1000'); assert.equal(h.calls[0].metadata.processingFee, '30');
  assert.equal(h.calls[0].customer, undefined); assert.equal(h.calls[0].payment_intent_data.setup_future_usage, undefined);
  assert.match(h.calls[0].success_url, /\/pay\/invoice1\?token=/);
});
test('authenticated invoice owners can pay, unrelated accounts cannot', async () => {
  const h = harness({ authenticated: true });
  assert.equal((await h.route.POST(h.request({ invoiceId: 'invoice1' }))).status, 200);
  h.records.set('users/user1', { email: 'someone-else@example.com' });
  assert.equal((await h.route.POST(h.request({ invoiceId: 'invoice1' }))).status, 403);
});
test('checkout reuses open sessions, renews expired sessions and blocks pending confirmations', async () => {
  const h = harness(); const token = await h.sharing.ensureInvoiceToken('invoice1');
  const pay = () => h.route.POST(h.request({ invoiceId: 'invoice1', token }));
  await pay(); await pay(); assert.equal(h.calls.length, 1);
  h.sessions.get('cs_1').status = 'expired'; await pay(); assert.equal(h.calls.length, 2);
  h.sessions.get('cs_2').status = 'complete'; h.sessions.get('cs_2').payment_intent = 'pi_pending';
  assert.equal((await pay()).status, 409); assert.equal(h.calls.length, 2);
});
test('concurrent checkout submissions create only one Stripe session', async () => {
  const h = harness(); const token = await h.sharing.ensureInvoiceToken('invoice1');
  const responses = await Promise.all([1, 2].map(() => h.route.POST(h.request({ invoiceId: 'invoice1', token }))));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(h.calls.length, 1);
});
test('form checkout redirects to Stripe, and draft/cancelled/paid invoices reject payment', async () => {
  const h = harness(); const token = await h.sharing.ensureInvoiceToken('invoice1');
  const form = new Request('https://example.com/api/stripe/create-checkout-session', { method: 'POST', body: new URLSearchParams({ invoiceId: 'invoice1', token }) });
  const response = await h.route.POST(form); assert.equal(response.status, 303); assert.match(response.headers.get('location'), /^https:\/\/checkout.stripe.com/);
  for (const status of ['draft', 'cancelled', 'paid']) {
    h.records.get('invoices/invoice1').status = status;
    assert.equal((await h.route.POST(h.request({ invoiceId: 'invoice1', token }))).status, 409);
  }
});
test('webhook records base and fee separately, ignores unpaid sessions, deduplicates retries', async () => {
  const h = harness(); const webhook = load('app/api/stripe/webhook/route.ts', h.mocks);
  const session = { metadata: { invoiceId: 'invoice1', invoiceAmount: '1000', processingFee: '30' }, amount_total: 103000, currency: 'usd', payment_status: 'unpaid', payment_intent: 'pi_test' };
  const deliver = () => webhook.POST(new Request('https://example.com/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 'test' }, body: JSON.stringify({ type: 'checkout.session.completed', data: { object: session } }) }));
  assert.equal((await deliver()).status, 200); assert.equal(h.records.get('invoices/invoice1').payments.length, 0);
  session.payment_status = 'paid';
  assert.equal((await deliver()).status, 200); assert.equal((await deliver()).status, 200);
  const invoice = h.records.get('invoices/invoice1');
  assert.equal(invoice.payments.length, 1); assert.equal(invoice.amountPaid, 1000); assert.equal(invoice.amountDue, 0);
  assert.equal(invoice.payments[0].totalPaid, 1030); assert.equal(invoice.payments[0].processingFee, 30);
  assert.equal(invoice.status, 'paid');
});
test('webhook rejects mismatched Stripe totals without recording a payment', async () => {
  const h = harness(); const webhook = load('app/api/stripe/webhook/route.ts', h.mocks);
  const response = await webhook.POST(new Request('https://example.com/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 'test' }, body: JSON.stringify({ type: 'checkout.session.completed', data: { object: { metadata: { invoiceId: 'invoice1', invoiceAmount: '1000', processingFee: '30' }, amount_total: 1, currency: 'usd', payment_status: 'paid', payment_intent: 'pi_bad' } } }) }));
  assert.equal(response.status, 500); assert.equal(h.records.get('invoices/invoice1').payments.length, 0);
});

test('public invoice requires its token, hides internal notes, and stops serving cancelled invoices', async () => {
  const { NextRequest } = require('next/server');
  const h = harness(); const page = load('app/pay/[id]/route.ts', h.mocks);
  const token = await h.sharing.ensureInvoiceToken('invoice1');
  const get = tokenValue => page.GET(new NextRequest(`https://example.com/pay/invoice1?token=${tokenValue}`), { params: Promise.resolve({ id: 'invoice1' }) });
  assert.equal((await get('incorrect')).status, 404);
  const response = await get(token); assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  const html = await response.text(); assert.match(html, /Pay \$1,030\.00 securely/); assert.doesNotMatch(html, /PRIVATE INTERNAL NOTE/);
  h.records.get('invoices/invoice1').status = 'cancelled';
  assert.equal((await get(token)).status, 404);
});
test('only admins can generate client links, and drafts must first be issued', async () => {
  const h = harness(); const share = load('app/api/invoices/[id]/share/route.ts', h.mocks);
  assert.equal((await share.POST(h.request({}), { params: Promise.resolve({ id: 'invoice1' }) })).status, 403);
  const admin = harness({ authenticated: true }); const adminShare = load('app/api/invoices/[id]/share/route.ts', admin.mocks);
  const response = await adminShare.POST(admin.request({}), { params: Promise.resolve({ id: 'invoice1' }) });
  assert.equal(response.status, 200); assert.match((await response.json()).url, /\/pay\/invoice1\?token=[a-f0-9]{64}$/);
  admin.records.get('invoices/invoice1').status = 'draft';
  assert.equal((await adminShare.POST(admin.request({}), { params: Promise.resolve({ id: 'invoice1' }) })).status, 409);
});

test('Redis DNS failure falls back to Firestore and checkout still reaches Stripe', async () => {
  const h = harness({ redis: { limit: async () => { throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } }); } } });
  const token = await h.sharing.ensureInvoiceToken('invoice1');
  const response = await h.route.POST(h.request({ invoiceId: 'invoice1', token }));
  assert.equal(response.status, 200); assert.equal(h.calls.length, 1);
  const counters = [...h.records.entries()].filter(([key]) => key.startsWith('invoiceCheckoutRateLimits/'));
  assert.equal(counters.length, 1); assert.equal(counters[0][1].requests.length, 1);
  assert.match(counters[0][0], /\/[a-f0-9]{64}$/);
});
test('shared Firestore fallback enforces a rolling limit under concurrency and resets after expiry', async () => {
  const h = harness();
  const { consumeFirestoreInvoiceLimit } = load('lib/server/invoice-rate-limit.ts', h.mocks);
  const results = await Promise.all(Array.from({ length: 15 }, () => consumeFirestoreInvoiceLimit('test-ip', 1000000)));
  assert.equal(results.filter(result => result.success).length, 10);
  assert.equal(results.filter(result => !result.success).length, 5);
  const limited = await consumeFirestoreInvoiceLimit('test-ip', 1059999);
  assert.equal(limited.success, false); assert.equal(limited.reset, 1060000);
  const renewed = await consumeFirestoreInvoiceLimit('test-ip', 1060000);
  assert.equal(renewed.success, true); assert.equal(renewed.remaining, 9);
  assert.equal((await consumeFirestoreInvoiceLimit('another-ip', 1059999)).success, true);
});
test('a healthy Redis denial remains a denial and does not invoke the fallback', async () => {
  const h = harness({ redis: { limit: async () => ({ success: false, limit: 10, remaining: 0, reset: Date.now() + 30000 }) } });
  const response = await h.route.POST(h.request({ invoiceId: 'invoice1' }));
  assert.equal(response.status, 429); assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal([...h.records.keys()].some(key => key.startsWith('invoiceCheckoutRateLimits/')), false);
  assert.equal(h.calls.length, 0);
});
test('Upstash timeout responses and hanging requests use the shared fallback', async () => {
  for (const redis of [
    { limit: async () => ({ success: true, reason: 'timeout' }) },
    { limit: () => new Promise(() => {}) },
  ]) {
    const h = harness({ redis });
    const { checkInvoicePaymentRateLimit } = load('lib/server/invoice-rate-limit.ts', h.mocks);
    const result = await checkInvoicePaymentRateLimit(h.request({}));
    assert.equal(result.success, true); assert.equal(result.remaining, 9);
    assert.equal([...h.records.keys()].some(key => key.startsWith('invoiceCheckoutRateLimits/')), true);
  }
});
test('if both limiters fail, browser clients get a private HTML error and Stripe is never called', async () => {
  const h = harness({ redis: { limit: async () => { throw new Error('Redis unavailable'); } } });
  h.mocks['@/lib/firebase/admin'] = { getAdminFirestore: () => { throw new Error('Private credentials must not appear in the response'); } };
  const route = load('app/api/stripe/create-checkout-session/route.ts', h.mocks);
  const form = new Request('https://example.com/api/stripe/create-checkout-session', { method: 'POST', body: new URLSearchParams({ invoiceId: 'invoice1', token: 'a'.repeat(64) }) });
  const response = await route.POST(form);
  assert.equal(response.status, 503); assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const html = await response.text(); assert.match(html, /Return to invoice/); assert.match(html, /Support reference:/);
  assert.doesNotMatch(html, /Private credentials|Redis unavailable/);
  assert.equal(h.calls.length, 0);
  const json = await route.POST(h.request({ invoiceId: 'invoice1' }));
  assert.equal(json.status, 503); assert.match(json.headers.get('content-type'), /application\/json/);
  const data = await json.json(); assert.equal(data.error, 'Unable to start payment. Please try again.'); assert.ok(data.reference);
});

// Generate a harmless print fixture for manual layout review when requested.
if (process.argv.includes('--preview')) {
  fs.mkdirSync(path.resolve(__dirname, '../.next/invoice-preview'), { recursive: true });
  fs.writeFileSync(path.resolve(__dirname, '../.next/invoice-preview/invoice.html'), generatePrintableInvoice(fixture(), { businessName: 'MagKam Solutions', email: 'billing@example.com' }, { paymentUrl: 'https://example.com/pay/invoice1?token=' + 'a'.repeat(64) }));
}
