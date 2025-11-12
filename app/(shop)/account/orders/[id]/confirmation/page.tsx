'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Badge, {BadgeVariant} from '@/components/ui/Badge';
import { getOrderById } from '@/services/order-service';
import { Order, FulfillmentType, getOrderStatusInfo } from '@/types/order';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await getOrderById(orderId);
        if (!orderData) {
          setError('Order not found');
        } else {
          setOrder(orderData);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading order...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This order does not exist'}</p>
            <Link href="/shop">
              <Button variant="primary">Continue Shopping</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusInfo = getOrderStatusInfo(order.status);

  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-grow bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed</h1>
            <p className="text-gray-600">
              Thank you for your order. We&apos;ve received it and will process it shortly.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Placed on {order.createdAt.toDate().toLocaleDateString()}
                </p>
              </div>
              <Badge variant={statusInfo.color as BadgeVariant}>{statusInfo.label}</Badge>
            </div>

            {/* Fulfillment Info */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                {order.fulfillmentType === FulfillmentType.DELIVERY ? 'Delivery Address' : 'Pickup Location'}
              </h3>
              {order.fulfillmentType === FulfillmentType.DELIVERY && order.deliveryAddress ? (
                <div className="text-sm text-gray-600">
                  <p>{order.deliveryAddress.street}</p>
                  {order.deliveryAddress.apartment && <p>{order.deliveryAddress.apartment}</p>}
                  <p>
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <p>{order.pickupLocation}</p>
                  <p className="text-green-600 mt-2">
                    Estimated ready time: {order.estimatedPickupTime?.toDate().toLocaleString() || '2 hours'}
                  </p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.productImage || '/placeholder-product.jpg'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.vendorName} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${item.subtotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {order.fulfillmentType === FulfillmentType.DELIVERY ? 'Delivery Fee' : 'Pickup Fee'}
                  </span>
                  <span className={order.deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}>
                    {order.deliveryFee === 0 ? 'FREE' : `$${order.deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900 text-lg">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/shop" className="flex-1">
              <Button variant="primary" fullWidth>
                Continue Shopping
              </Button>
            </Link>
            <Link href="/orders" className="flex-1">
              <Button variant="outline" fullWidth>
                View All Orders
              </Button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">What&apos;s Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You&apos;ll receive an email confirmation shortly</li>
              <li>• We&apos;ll notify you when your order is being prepared</li>
              <li>
                • {order.fulfillmentType === FulfillmentType.DELIVERY
                  ? 'Track your delivery status in your orders page'
                  : "You'll get a notification when your order is ready for pickup"}
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
