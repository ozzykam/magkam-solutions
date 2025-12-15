/**
 * Proposal Approved Email Template (Resend)
 * Sent to admin when a customer approves a proposal
 *
 * Notes:
 * - Escapes all dynamic text to prevent broken markup/injection
 * - Uses table-first layout (more reliable across Gmail/Outlook)
 * - Avoids relying on gradients/shadows/border-radius for core layout
 * - Uses a bulletproof-ish button (table-wrapped CTA)
 * - Moves padding off <table> (put padding on <td>)
 * - Uses Intl.NumberFormat for currency
 */

export interface ProposalApprovedData {
  proposalNumber: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  taxLabel?: string;
  discountReason?: string;
  proposalTitle?: string;
  acceptedAt: string;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeText(value: unknown): string {
  return escapeHtml(String(value ?? ""));
}

/** Ensure we don’t generate accidental `//` */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function currencyFormatter(): Intl.NumberFormat {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
}

export function generateProposalApprovedEmail(
  data: ProposalApprovedData,
  opts?: {
    /** If omitted, falls back to process.env.NEXT_PUBLIC_APP_URL */
    appUrl?: string;
  }
): string {
  const usd = currencyFormatter();

  const baseUrl = normalizeBaseUrl(
    opts?.appUrl || process.env.NEXT_PUBLIC_APP_URL || ""
  );

  // If baseUrl is missing, keep the CTA harmless instead of emitting "undefined/..."
  const adminUrl = baseUrl
    ? `${baseUrl}/admin/proposals/${encodeURIComponent(data.proposalNumber)}`
    : "#";

  const itemsHtml = data.lineItems
    .map((item) => {
      const desc = safeText(item.description);
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const amount = Number(item.amount) || 0;

      return `
        <tr>
          <td style="padding:12px; border-bottom:1px solid #e5e7eb; background-color:#ffffff;">
            <p style="margin:0; font-weight:600; color:#111827; font-size:15px; line-height:20px;">
              ${desc}
            </p>
            <p style="margin:4px 0 0 0; font-size:14px; color:#6b7280; line-height:20px;">
              Quantity: ${qty} × ${usd.format(rate)}
            </p>
          </td>
          <td style="padding:12px; text-align:right; border-bottom:1px solid #e5e7eb; color:#111827; background-color:#ffffff; font-weight:600; white-space:nowrap;">
            ${usd.format(amount)}
          </td>
        </tr>
      `;
    })
    .join("");

  const discountHtml =
    data.discountAmount > 0
      ? `
        <tr>
          <td style="padding:10px 16px; color:#047857; font-size:15px; line-height:20px;">
            Discount${
              data.discountReason ? ` (${safeText(data.discountReason)})` : ""
            }
          </td>
          <td style="padding:10px 16px; text-align:right; color:#047857; font-size:15px; font-weight:600; white-space:nowrap;">
            -${usd.format(Number(data.discountAmount) || 0)}
          </td>
        </tr>
      `
      : "";

  const taxHtml =
    data.taxAmount > 0
      ? `
        <tr>
          <td style="padding:10px 16px; color:#6b7280; font-size:15px; line-height:20px;">
            ${safeText(data.taxLabel || "Tax")}
          </td>
          <td style="padding:10px 16px; text-align:right; color:#111827; font-size:15px; font-weight:600; white-space:nowrap;">
            ${usd.format(Number(data.taxAmount) || 0)}
          </td>
        </tr>
      `
      : "";

  const preheader = `Proposal ${safeText(data.proposalNumber)} approved by ${safeText(
    data.customerName
  )}.`;

  const domainLabel = baseUrl
    ? safeText(baseUrl.replace(/^https?:\/\//, ""))
    : "your app";

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Proposal Approved - ${safeText(data.proposalNumber)}</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all; color:transparent; font-size:0; line-height:0;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; max-width:650px; background-color:#ffffff;">
          <!-- Header (avoid gradient dependence; bgcolor fallback is reliable) -->
          <tr>
            <td bgcolor="#059669" style="padding:32px 24px; text-align:center; background-color:#059669;">
              <h1 style="margin:0; color:#ffffff; font-family:Arial, sans-serif; font-size:28px; line-height:34px; font-weight:800;">
                ✅ PROPOSAL APPROVED!
              </h1>
              <p style="margin:10px 0 0 0; color:#d1fae5; font-family:Arial, sans-serif; font-size:16px; line-height:22px; font-weight:600;">
                Customer Accepted — Ready to Convert to Invoice
              </p>
            </td>
          </tr>

          <!-- Body padding wrapper -->
          <tr>
            <td style="padding:28px 24px; font-family:Arial, sans-serif; color:#111827;">
              <!-- Success Banner (table-based) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px;">
                <tr>
                  <td bgcolor="#d1fae5" style="padding:16px 16px; border:2px solid #10b981; text-align:center;">
                    <p style="margin:0; color:#065f46; font-size:16px; line-height:22px; font-weight:700;">
                      🎉 ${safeText(data.customerName)} has approved the proposal!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Proposal Number block -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 auto 20px auto;">
                <tr>
                  <td bgcolor="#ecfdf5" style="padding:14px 18px; border:3px solid #10b981; text-align:center;">
                    <p style="margin:0 0 6px 0; font-size:12px; line-height:16px; color:#065f46; text-transform:uppercase; letter-spacing:1px; font-weight:700;">
                      Proposal Number
                    </p>
                    <p style="margin:0; font-size:24px; line-height:28px; font-weight:800; color:#059669;">
                      ${safeText(data.proposalNumber)}
                    </p>
                  </td>
                </tr>
              </table>

              ${
                data.proposalTitle
                  ? `
                <h2 style="margin:0 0 18px 0; text-align:center; font-size:18px; line-height:24px; font-weight:800; color:#111827;">
                  ${safeText(data.proposalTitle)}
                </h2>
              `
                  : ""
              }

              <!-- Customer Info (table-based) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:22px;">
                <tr>
                  <td bgcolor="#f9fafb" style="padding:16px; border:1px solid #e5e7eb;">
                    <h3 style="margin:0 0 10px 0; font-size:16px; line-height:22px; font-weight:800; color:#111827;">
                      👤 Customer Information
                    </h3>

                    <p style="margin:6px 0; color:#374151; font-size:14px; line-height:20px;">
                      <strong>Name:</strong> ${safeText(data.customerName)}
                    </p>

                    <p style="margin:6px 0; color:#374151; font-size:14px; line-height:20px;">
                      <strong>Email:</strong>
                      <a href="mailto:${safeText(data.customerEmail)}" style="color:#059669; text-decoration:none;">
                        ${safeText(data.customerEmail)}
                      </a>
                    </p>

                    ${
                      data.customerCompany
                        ? `
                      <p style="margin:6px 0; color:#374151; font-size:14px; line-height:20px;">
                        <strong>Company:</strong> ${safeText(data.customerCompany)}
                      </p>
                    `
                        : ""
                    }

                    <p style="margin:6px 0; color:#374151; font-size:14px; line-height:20px;">
                      <strong>Approved At:</strong> ${safeText(data.acceptedAt)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Approved Items heading -->
              <h2 style="margin:0 0 12px 0; font-size:18px; line-height:24px; font-weight:800; color:#111827;">
                📋 Approved Items
              </h2>

              <!-- Items table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; border:1px solid #e5e7eb;">
                <tr>
                  <th align="left" bgcolor="#f3f4f6" style="padding:12px; font-size:13px; line-height:18px; font-weight:800; color:#374151; border-bottom:2px solid #e5e7eb;">
                    Description
                  </th>
                  <th align="right" bgcolor="#f3f4f6" style="padding:12px; font-size:13px; line-height:18px; font-weight:800; color:#374151; border-bottom:2px solid #e5e7eb;">
                    Amount
                  </th>
                </tr>
                ${itemsHtml}
              </table>

              <!-- Summary wrapper (padding on td, not table) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:18px;">
                <tr>
                  <td bgcolor="#f9fafb" style="padding:16px; border:1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:8px 0; color:#6b7280; font-size:14px; line-height:20px;">Subtotal</td>
                        <td style="padding:8px 0; text-align:right; color:#111827; font-size:14px; line-height:20px; font-weight:700; white-space:nowrap;">
                          ${usd.format(Number(data.subtotal) || 0)}
                        </td>
                      </tr>

                      ${discountHtml}
                      ${taxHtml}

                      <tr>
                        <td colspan="2" style="padding-top:12px; border-top:3px solid #10b981;"></td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 0 0; font-size:18px; line-height:24px; font-weight:900; color:#111827;">
                          TOTAL
                        </td>
                        <td style="padding:10px 0 0 0; text-align:right; font-size:18px; line-height:24px; font-weight:900; color:#059669; white-space:nowrap;">
                          ${usd.format(Number(data.total) || 0)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:22px;">
                <tr>
                  <td align="center" style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 auto;">
                      <tr>
                        <td bgcolor="#10b981" style="background-color:#10b981;">
                          <a href="${adminUrl}"
                             style="display:inline-block; padding:14px 24px; font-family:Arial, sans-serif; font-size:15px; line-height:20px; font-weight:800; color:#ffffff; text-decoration:none;">
                            View Proposal in Admin
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:12px 0 0 0; color:#6b7280; font-size:13px; line-height:18px;">
                      💡 Next step: Convert this proposal to an invoice
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:18px;">
                <tr>
                  <td bgcolor="#fffbeb" style="padding:14px 16px; border-left:4px solid #f59e0b;">
                    <p style="margin:0 0 8px 0; color:#78350f; font-size:13px; line-height:18px; font-weight:800;">
                      📌 Recommended Next Steps:
                    </p>
                    <ol style="margin:0; padding-left:18px; color:#78350f; font-size:13px; line-height:18px;">
                      <li style="margin-bottom:6px;">Review the approved proposal details</li>
                      <li style="margin-bottom:6px;">Convert the proposal to an invoice</li>
                      <li style="margin-bottom:6px;">Send the invoice to the customer for payment</li>
                      <li style="margin-bottom:0;">Begin work once payment is received</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#1f2937" style="padding:18px 16px; background-color:#1f2937; text-align:center;">
              <p style="margin:0 0 6px 0; color:#d1d5db; font-family:Arial, sans-serif; font-size:12px; line-height:16px; font-weight:700;">
                Admin Notification — ${domainLabel}
              </p>
              <p style="margin:0; color:#9ca3af; font-family:Arial, sans-serif; font-size:12px; line-height:16px;">
                This is an automated notification. Do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Container -->
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
