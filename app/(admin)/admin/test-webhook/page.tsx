'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui';
import Card from '@/components/ui/Card';

/**
 * TEMPORARY TEST PAGE
 * Test order confirmation emails by order ID
 * DELETE THIS FILE BEFORE PRODUCTION!
 */
export default function TestWebhookPage() {
  const { showToast } = useToast();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestWebhook = async () => {
    if (!orderId) {
      showToast('Please enter an order ID', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          `✅ Email sent successfully! Check ${data.message}`,
          'success'
        );
      } else {
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Test Order Confirmation Email
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manually trigger order confirmation email for testing.
          This simulates what the Stripe webhook should do.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Enter Order ID
        </h2>

        <Input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="e.g., tY8tgkZUkFkCRBb2bFbk"
          label="Order ID (from Firestore)"
          helperText="Enter the order ID from your latest test order"
        />

        <div className="mt-4">
          <Button
            onClick={handleTestWebhook}
            loading={loading}
            disabled={!orderId || loading}
            variant="primary"
            className="w-full"
          >
            Send Order Confirmation Email
          </Button>
        </div>
      </Card>

      <Card className="mt-6 p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-md font-semibold text-yellow-900 mb-2">
          ⚠️ How to Find Order ID
        </h3>
        <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
          <li>Complete a test order on your site</li>
          <li>Check your terminal logs for the order ID</li>
          <li>Or check Firebase Console → Firestore → orders collection</li>
          <li>Paste the ID here and click Send</li>
          <li>Watch your terminal for email logs!</li>
        </ol>
      </Card>

      <Card className="mt-6 p-6 bg-red-50 border-red-200">
        <h3 className="text-md font-semibold text-red-900 mb-2">
          🗑️ IMPORTANT
        </h3>
        <p className="text-sm text-red-800">
          This is a temporary testing page. DELETE this file and
          /app/api/test-webhook/route.ts before deploying to production!
        </p>
      </Card>
    </div>
  );
}
