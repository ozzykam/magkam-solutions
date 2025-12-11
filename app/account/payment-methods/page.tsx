'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CreditCardIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

// TODO: This will be integrated with Stripe later
interface PaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  // Placeholder data - will be replaced with Stripe integration
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      isDefault: true,
    },
  ]);

  const [showAddCard, setShowAddCard] = useState(false);

  const getBrandIcon = (brand: string) => {
    return <CreditCardIcon className="w-8 h-8 text-gray-600" />;
  };

  const handleAddPaymentMethod = () => {
    // TODO: Integrate with Stripe Elements
    alert('Stripe payment method integration coming soon!');
    setShowAddCard(false);
  };

  const handleRemovePaymentMethod = (id: string) => {
    const confirm = window.confirm('Are you sure you want to remove this payment method?');
    if (confirm) {
      setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id));
    }
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-1">Manage your saved payment methods</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddCard(true)}>
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Payment Method
        </Button>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCardIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
          <p className="text-gray-600 mb-6">
            Add a payment method to make payments easier
          </p>
          <Button variant="primary" onClick={() => setShowAddCard(true)}>
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Payment Method
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getBrandIcon(method.brand)}
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {method.brand} •••• {method.last4}
                        </h3>
                        {method.isDefault && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <button
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Remove"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Payment Method Dialog */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment Method</h3>
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Stripe integration placeholder</p>
                <p className="text-sm text-gray-500">
                  Stripe Elements will be integrated here for secure card input
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowAddCard(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddPaymentMethod}>
                Add Card
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Secure Payments</h3>
          <p className="text-sm text-blue-800">
            All payment information is securely processed through Stripe. We never store your
            full card details on our servers. Your payment methods are encrypted and protected.
          </p>
        </div>
      </Card>
    </div>
  );
}
