import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth-helpers';

/**
 * GET - Preview email templates (Admin only)
 * Usage: /api/email-preview/proposal-approved
 *        /api/email-preview/payment-received
 *        /api/email-preview/payment-confirmation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  try {
    // Admin only
    if (!(await isAdmin())) {
      return new NextResponse('Unauthorized - Admin access required', { status: 403 });
    }

    const { template } = await params;

    let html = '';

    switch (template) {
      case 'proposal-approved': {
        const { generateProposalApprovedEmail } = await import('@/lib/email/templates/proposal-approved');

        const sampleData = {
          proposalNumber: 'PROP-2025-001',
          customerName: 'John Smith',
          customerEmail: 'john.smith@example.com',
          customerCompany: 'Acme Corporation',
          lineItems: [
            {
              description: 'Website Design & Development',
              quantity: 1,
              rate: 5000,
              amount: 5000,
            },
            {
              description: 'SEO Optimization (3 months)',
              quantity: 3,
              rate: 500,
              amount: 1500,
            },
            {
              description: 'Content Management Training',
              quantity: 2,
              rate: 250,
              amount: 500,
            },
          ],
          subtotal: 7000,
          taxAmount: 560,
          discountAmount: 500,
          total: 7060,
          taxLabel: 'Sales Tax (8%)',
          discountReason: 'Early bird discount',
          proposalTitle: 'Website Development & SEO Package',
          acceptedAt: new Date().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        };

        html = generateProposalApprovedEmail(sampleData);
        break;
      }

      case 'payment-received': {
        const { generatePaymentReceivedEmail } = await import('@/lib/email/templates/payment-received');

        const sampleData = {
          invoiceNumber: 'INV-2025-001',
          customerName: 'Jane Doe',
          customerEmail: 'jane.doe@example.com',
          customerCompany: 'Tech Solutions Inc.',
          paymentAmount: 5000,
          remainingBalance: 0,
          totalAmount: 5000,
          paymentMethod: 'card',
          cardBrand: 'visa',
          cardLast4: '4242',
          paidAt: new Date().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
          invoiceTitle: 'Custom Software Development',
          processingFee: 150,
        };

        html = generatePaymentReceivedEmail(sampleData);
        break;
      }

      case 'payment-confirmation': {
        const { generatePaymentConfirmationEmail } = await import('@/lib/email/templates/payment-confirmation');

        const sampleData = {
          invoiceNumber: 'INV-2025-002',
          customerName: 'Bob Johnson',
          paymentAmount: 3500,
          remainingBalance: 1500,
          totalAmount: 5000,
          paymentMethod: 'card',
          cardBrand: 'mastercard',
          cardLast4: '5555',
          paidAt: new Date().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
          invoiceTitle: 'E-commerce Platform Development',
          processingFee: 105,
          lineItems: [
            {
              description: 'Frontend Development',
              quantity: 1,
              rate: 2500,
              amount: 2500,
            },
            {
              description: 'Backend API Development',
              quantity: 1,
              rate: 2000,
              amount: 2000,
            },
            {
              description: 'Database Setup',
              quantity: 1,
              rate: 500,
              amount: 500,
            },
          ],
          subtotal: 5000,
          taxAmount: 0,
          discountAmount: 0,
        };

        html = generatePaymentConfirmationEmail(sampleData);
        break;
      }

      case 'welcome':
      case 'order-confirmation':
      case 'order-status':
      case 'back-in-stock': {
        // Legacy templates - show message
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Template Not Available</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              .message {
                background: #f3f4f6;
                padding: 40px;
                border-radius: 8px;
              }
              h1 { color: #374151; }
              p { color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="message">
              <h1>📧 Legacy Template</h1>
              <p>This template (${template}) is a legacy template that was removed.</p>
              <p>Available templates: proposal-approved, payment-received, payment-confirmation</p>
            </div>
          </body>
          </html>
        `;
        break;
      }

      default: {
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Template Not Found</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              .message {
                background: #fee2e2;
                padding: 40px;
                border-radius: 8px;
              }
              h1 { color: #991b1b; }
              p { color: #7f1d1d; }
              .templates {
                margin-top: 20px;
                text-align: left;
                background: white;
                padding: 20px;
                border-radius: 4px;
              }
              .templates a {
                display: block;
                padding: 8px;
                color: #3b82f6;
                text-decoration: none;
              }
              .templates a:hover {
                background: #f3f4f6;
              }
            </style>
          </head>
          <body>
            <div class="message">
              <h1>❌ Template Not Found</h1>
              <p>Template "${template}" does not exist.</p>

              <div class="templates">
                <strong>Available templates:</strong>
                <a href="/api/email-preview/proposal-approved">📋 proposal-approved</a>
                <a href="/api/email-preview/payment-received">💰 payment-received</a>
                <a href="/api/email-preview/payment-confirmation">✅ payment-confirmation</a>
              </div>
            </div>
          </body>
          </html>
        `;
      }
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Email Preview] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
