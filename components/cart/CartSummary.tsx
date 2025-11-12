import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  taxRate?: number;
  deliveryFee?: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  itemCount,
  taxRate = 0.08, // 8% default tax rate
  deliveryFee = 0,
}) => {
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 mb-4">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-700">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {/* Delivery Fee */}
        <div className="flex justify-between text-gray-700">
          <span>Delivery Fee</span>
          <span>
            {deliveryFee === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `$${deliveryFee.toFixed(2)}`
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-gray-700">
          <span>Tax (estimated)</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className="border-t border-gray-300 pt-3 mt-3">
          <div className="flex justify-between text-gray-900 font-semibold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Link href="/checkout" className="block">
        <Button variant="primary" size="lg" fullWidth>
          Proceed to Checkout
        </Button>
      </Link>

      {/* Continue Shopping */}
      <Link href="/shop" className="block mt-3">
        <Button variant="ghost" size="lg" fullWidth>
          Continue Shopping
        </Button>
      </Link>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-300">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Free delivery on orders over $50</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Secure checkout with SSL encryption</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Easy returns within 7 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
