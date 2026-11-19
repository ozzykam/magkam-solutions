# Sending invoices and collecting payment

The app uses Next.js, Firebase Authentication/Firestore, and Stripe Checkout. `/admin` is the CRM dashboard (projects, prospects, tasks, activity, and invoice totals). `/admin/invoices` manages invoice drafts, issued invoices, balances, and manually recorded payments. Customer accounts can still view their invoices under `/account/invoices`.

## Send a PDF without requiring a client account

1. Open `/admin/invoices`, create an invoice, and enter the client's billing details, line items, dates, and payment terms. A client account is not required.
2. Choose whether to include the 3% online payment fee. It is enabled for new invoices; existing invoices keep their saved settings, and older invoices without a fee configuration have no fee. Draft invoices can be edited to change the setting.
3. Review the draft using **Print / Save as PDF**. When ready, click **Mark as Sent**. This changes its status; it does not send an email.
4. Click **Print / Save as PDF**, then choose **Save as PDF** in the browser's print dialog. The issued invoice includes the client payment link. Turn off browser headers and footers for a cleaner PDF.
5. Attach the PDF to your own client email, or use **Copy client payment link** and paste that link into your message.

The client opens `https://www.magkamsolutions.com/pay/INVOICE_ID?token=GENERATED_TOKEN`, reviews the invoice, and clicks **Pay securely with Stripe**. Copy the complete generated link; the invoice ID alone does not grant access. Anyone holding that link can view that invoice, so share it only with the intended recipient. Draft and cancelled invoices cannot be viewed or paid through these links.

The link stays stable and creates/reuses a Stripe Checkout session when the client pays. It does not expire with the underlying Checkout session. After payment, the client returns to the same invoice page; the signed Stripe webhook updates its balance. A success redirect alone never marks an invoice paid.

Stripe Checkout collects the payer's chosen email address, which can differ from the invoice's billing email. The payment is matched using the invoice ID; the invoice's billing email and account access remain unchanged. The app's invoice confirmation email still goes to the billing email. After deploying this change, reopen the invoice payment link and click the payment button to replace an older checkout session that had a fixed email; no replacement PDF is needed.

## Fee and payment options

- A $1,000 remaining balance with the 3% setting enabled shows a $30 online fee and a $1,030 online total. The fee is calculated on the remaining balance, after invoice discounts, tax, and previously recorded payments, and rounded to cents.
- Stripe checkout currently accepts cards. It does not offer ACH. Guest checkout collects a fresh payment method and does not expose a client's saved cards.
- Cash, check, and bank transfer can be arranged separately. Use **Record Payment** to record the invoice amount received; do not include an online fee in the invoice principal.
- The fee is recorded separately from invoice revenue. The PDF, checkout metadata, and payment history distinguish principal from fee.
- A percentage-based card fee is generally a surcharge rather than a convenience fee. Confirm applicable Stripe/card-network and jurisdiction requirements before enabling it in production. The current Checkout integration does not distinguish credit from debit/prepaid cards for fee assessment; the per-invoice switch is not a compliance engine. See [Stripe's surcharge guidance](https://stripe.com/resources/more/credit-card-surcharges-explained-what-businesses-need-to-know).

Existing account flow: visit `https://www.magkamsolutions.com/account/invoices`, sign in with the invoice's client email, select the invoice, and click **Pay with Card**. The direct account URL is `/account/invoices/INVOICE_ID`.

## Deployment and verification

- Invoice checkout uses Upstash rate limiting when available and falls back to a shared Firestore rolling limit of 10 requests per minute per client IP if Redis is missing, unreachable, or times out. The server-only `invoiceCheckoutRateLimits` collection stores hashed identifiers and at most 10 recent timestamps per document. An optional TTL policy on `expiresAt` can clean up inactive counters; it is not required for the limiter to work. If both backends fail, checkout returns 503 without starting a payment. Other endpoints still use their existing Redis behavior.
- Browser form errors show a readable page with a support reference; JSON callers retain JSON errors. Runtime logs include that reference and the failing stage (for example, `rate_limit` or `create_stripe_session`) without logging payment links or credentials.
- Existing security finding: the `/users/{userId}` rules allow users to create/update their own `role`, while `isAdmin()` trusts that field. This predates these invoice changes. Protect role assignment and other privileged profile fields before production rollout; tightening invoice rules alone does not close that broader privilege-escalation path.
- Deploy the Next.js app and the updated `firestore.rules` together. Invoice clients may only mark an issued invoice viewed; they cannot change prices, balances, payment history, or fee settings. The separate `invoicePaymentLinks` collection is server-only.
- Set `NEXT_PUBLIC_APP_URL` to the canonical deployed origin, preferably `https://www.magkamsolutions.com`. For local testing use `http://localhost:3002` (or the actual development port), so generated links and Stripe return URLs target the local app.
- Keep `FIREBASE_SERVICE_ACCOUNT_KEY`, Stripe keys, and `STRIPE_WEBHOOK_SECRET` configured on the server.
- Invoice payments require Stripe's **`checkout.session.completed`** event at **`https://www.magkamsolutions.com/api/stripe/webhook`**. The older general-commerce guide's `/api/webhooks/stripe` path is a separate flow. The handler also supports `checkout.session.async_payment_succeeded`; unpaid sessions do not record payments.
- `pnpm test:invoices` exercises fee rounding, authorization, token scope, HTML escaping, status restrictions, checkout session reuse/concurrency, and webhook validation/deduplication using isolated mocks. `pnpm typecheck` checks TypeScript.
- Before production use, complete a Stripe test-mode checkout and confirm its signed webhook updates the balance. Browser print layout and saved PDF links should also be checked with a representative invoice, including a multi-page invoice.

No email is sent when generating a PDF or copying a link. Existing payment notification emails still run after the webhook records a successful payment.
