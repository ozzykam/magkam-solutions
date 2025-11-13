'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui';
import Card from '@/components/ui/Card';

/**
 * Email Testing Page (Admin Only)
 *
 * This page allows admins to manually test email sending without
 * going through the entire user flow (registration, checkout, etc.)
 */
export default function TestEmailPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const handleTestWelcomeEmail = async () => {
    if (!testEmail) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setLoading('welcome');
    try {
      const response = await fetch('/api/test-email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          name: 'Test User',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Welcome email sent to ${testEmail}!`, 'success');
      } else {
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error testing welcome email:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleTestOrderConfirmation = async () => {
    if (!testEmail) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setLoading('order');
    try {
      const response = await fetch('/api/test-email/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Order confirmation email sent to ${testEmail}!`, 'success');
      } else {
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error testing order confirmation:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleTestOrderStatus = async () => {
    if (!testEmail) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setLoading('status');
    try {
      const response = await fetch('/api/test-email/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Order status email sent to ${testEmail}!`, 'success');
      } else {
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error testing order status email:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Testing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Test email sending functionality without going through full user flows.
          Emails will be sent using the Resend API.
        </p>
      </div>

      {/* Email Input */}
      <Card className="mb-6 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Email Address</h2>
        <Input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Enter email to receive test emails"
          label="Recipient Email"
          helperText="All test emails will be sent to this address"
        />
      </Card>

      {/* Email Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Welcome Email */}
        <Card className="p-6">
          <div className="flex items-start mb-4">
            <div className="text-4xl mr-4">👋</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Welcome Email</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sent when a new user registers
              </p>
            </div>
          </div>
          <Button
            onClick={handleTestWelcomeEmail}
            loading={loading === 'welcome'}
            disabled={!testEmail || loading !== null}
            variant="primary"
            className="w-full"
          >
            Send Test Welcome Email
          </Button>
        </Card>

        {/* Order Confirmation */}
        <Card className="p-6">
          <div className="flex items-start mb-4">
            <div className="text-4xl mr-4">✅</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order Confirmation</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sent after successful payment
              </p>
            </div>
          </div>
          <Button
            onClick={handleTestOrderConfirmation}
            loading={loading === 'order'}
            disabled={!testEmail || loading !== null}
            variant="primary"
            className="w-full"
          >
            Send Test Order Email
          </Button>
        </Card>

        {/* Order Status Update */}
        <Card className="p-6">
          <div className="flex items-start mb-4">
            <div className="text-4xl mr-4">📦</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order Status Update</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sent when order status changes
              </p>
            </div>
          </div>
          <Button
            onClick={handleTestOrderStatus}
            loading={loading === 'status'}
            disabled={!testEmail || loading !== null}
            variant="primary"
            className="w-full"
          >
            Send Test Status Email
          </Button>
        </Card>
      </div>

      {/* Configuration Info */}
      <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
        <h3 className="text-md font-semibold text-blue-900 mb-2">📋 Email Configuration</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Provider:</strong> Resend</p>
          <p><strong>FROM Address:</strong> {process.env.NEXT_PUBLIC_EMAIL_FROM || 'noreply@magkamsolutions.com'}</p>
          <p><strong>API Status:</strong> {process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
        </div>
      </Card>

      {/* Help Section */}
      <Card className="mt-6 p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-md font-semibold text-yellow-900 mb-2">💡 Troubleshooting</h3>
        <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
          <li>Check that RESEND_API_KEY is set in .env.local</li>
          <li>Verify EMAIL_FROM domain is verified in Resend dashboard</li>
          <li>Check spam folder if emails don&apos;t arrive</li>
          <li>View logs in browser console for error messages</li>
          <li>Check Resend dashboard for delivery status</li>
        </ul>
      </Card>
    </div>
  );
}
