import React from 'react';
import Image from 'next/image';
import { CartItem } from '@/types/cart';
import { FulfillmentType } from '@/types/order';
import { Address } from '@/types/user';
import { formatTimeSlot, formatSlotDate } from '@/types/business-info';

interface OrderReviewProps {
  items: CartItem[];
  subtotal: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: Address;
  deliveryFee: number;
  tax: number;
  total: number;
  timeSlot?: { date: string; startTime: string; endTime?: string };
}

const OrderReview: React.FC<OrderReviewProps> = ({
  items,
  subtotal,
  fulfillmentType,
  deliveryAddress,
  deliveryFee,
  tax,
  total,
  timeSlot,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Review Your Order</h3>

      {/* Fulfillment Details */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          {fulfillmentType === FulfillmentType.DELIVERY ? 'Delivery Address' : 'Pickup Location'}
        </h4>
        {fulfillmentType === FulfillmentType.DELIVERY && deliveryAddress ? (
          <div className="text-sm text-gray-600">
            <p>{deliveryAddress.street}</p>
            {deliveryAddress.apartment && <p>{deliveryAddress.apartment}</p>}
            <p>
              {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
            </p>
            <p>{deliveryAddress.country}</p>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p>Local Market - Main Store</p>
            <p>123 Market Street</p>
            <p>San Francisco, CA 94102</p>
          </div>
        )}

        {/* Time Slot */}
        {timeSlot && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">Scheduled Time</p>
            <p className="text-sm text-gray-600">
              {formatSlotDate(timeSlot.date)}
            </p>
            <p className="text-sm text-gray-600">
              {timeSlot.endTime
                ? formatTimeSlot(timeSlot.startTime, timeSlot.endTime)
                : formatTimeSlot(timeSlot.startTime, timeSlot.startTime.split(':').map((n, i) => i === 0 ? String((Number(n) + 1) % 24).padStart(2, '0') : n).join(':'))}
            </p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Order Items ({items.length})</h4>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={item.image || '/placeholder-product.jpg'}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.productName}
                </p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                ${item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Order Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {fulfillmentType === FulfillmentType.DELIVERY ? 'Delivery Fee' : 'Pickup Fee'}
            </span>
            <span className={deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}>
              {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">${tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-semibold text-gray-900 text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Payment on next step</p>
            <p>You&apos;ll be redirected to our secure payment page to complete your purchase.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReview;
