'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Image from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui';
import { getOrderById, getOrderStatusHistory } from '@/services/order-service';
import { Order, OrderStatus, OrderStatusHistory } from '@/types/order';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  CreditCardIcon,
  MapPinIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

export default function OrderDetailsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadOrderDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const orderData = await getOrderById(orderId);

      if (!orderData) {
        showToast('Order not found', 'error');
        router.push('/account/orders');
        return;
      }

      // Verify user owns this order
      if (orderData.userId !== user?.uid) {
        showToast('You do not have permission to view this order', 'error');
        router.push('/account/orders');
        return;
      }

      setOrder(orderData);

      // Load status history
      const history = await getOrderStatusHistory(orderId);
      setStatusHistory(history);
    } catch (error) {
      console.error('Error loading order details:', error);
      showToast('Failed to load order details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, user?.uid, router, showToast]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'default' as const;
      case OrderStatus.PAID:
        return 'success' as const;
      case OrderStatus.PROCESSING:
        return 'info' as const;
      case OrderStatus.OUT_FOR_DELIVERY:
      case OrderStatus.READY_FOR_PICKUP:
        return 'warning' as const;
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        return 'success' as const;
      case OrderStatus.CANCELLED:
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <ClockIcon className="w-5 h-5" />;
      case OrderStatus.PAID:
        return <CreditCardIcon className="w-5 h-5" />;
      case OrderStatus.PROCESSING:
        return <TruckIcon className="w-5 h-5" />;
      case OrderStatus.READY_FOR_PICKUP:
      case OrderStatus.OUT_FOR_DELIVERY:
        return <CheckCircleIcon className="w-5 h-5" />;
      case OrderStatus.COMPLETED:
      case OrderStatus.DELIVERED:
        return <CheckCircleIcon className="w-5 h-5" />;
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getStatusDisplayName = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Pending Payment';
      case OrderStatus.PAID:
        return 'Paid';
      case OrderStatus.PROCESSING:
        return 'Processing';
      case OrderStatus.READY_FOR_PICKUP:
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Ready for Pickup';
      case OrderStatus.COMPLETED:
      case OrderStatus.DELIVERED:
        return 'Completed';
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
        <p className="text-gray-600 mb-6">The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        <Button onClick={() => router.push('/account/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push('/account/orders')}
        leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
      >
        Back to Orders
      </Button>

      {/* Order Header */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {order.createdAt.toDate().toLocaleDateString()} at{' '}
                {order.createdAt.toDate().toLocaleTimeString()}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(order.status)} size="lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                {getStatusDisplayName(order.status)}
              </div>
            </Badge>
          </div>

          {/* Order Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {order.status === OrderStatus.PENDING && (
              <Button onClick={() => router.push(`/checkout?orderId=${order.id}`)}>
                Complete Payment
              </Button>
            )}
            {order.status === OrderStatus.COMPLETED && (
              <Button
                variant="outline"
                onClick={() => showToast('Reorder feature coming soon!', 'info')}
              >
                Reorder
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              Print Receipt
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBagIcon className="w-5 h-5" />
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0"
                  >
                    {item.productImage ? (
                      <Image
                        width={80}
                        height={80}
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      {item.productSku && (
                        <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        <span>Price: ${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Status Timeline */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                Order Timeline
              </h2>
              <div className="space-y-4">
                {statusHistory.length === 0 ? (
                  <p className="text-gray-600 text-sm">No status updates yet</p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

                    {statusHistory.map((history) => (
                      <div key={history.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-600">
                            {getStatusIcon(history.status)}
                          </div>
                        </div>

                        {/* Timeline content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getStatusBadgeVariant(history.status)} size="sm">
                              {getStatusDisplayName(history.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-900">{history.note}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {history.timestamp.toDate().toLocaleDateString()} at{' '}
                            {history.timestamp.toDate().toLocaleTimeString()}
                            {history.updatedByName && ` by ${history.updatedByName}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ReceiptPercentIcon className="w-5 h-5" />
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Fee</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  {order.cardBrand && order.cardLast4 && (
                    <div className="text-sm text-gray-600">
                      <span className="capitalize">{order.cardBrand}</span> ending in {order.cardLast4}
                    </div>
                  )}

                  {!order.cardBrand && order.paymentMethod && order.paymentMethod !== 'card' && (
                    <p className="text-sm text-gray-600">
                      Method: <span className="capitalize">{order.paymentMethod}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Fulfillment Information */}
          {(order.estimatedPickupTime || order.estimatedDeliveryTime || order.timeSlotDate) && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {order.fulfillmentType === 'pickup' ? 'Pickup Details' : 'Delivery Details'}
                </h2>
                <div className="space-y-3 text-sm">
                  {/* Time Slot Info */}
                  {order.timeSlotDate && (
                    <div className="flex items-start gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Scheduled Time</p>
                        <p className="text-gray-600">
                          {new Date(order.timeSlotDate).toLocaleDateString()}
                          {order.timeSlotStartTime && order.timeSlotEndTime && (
                            <>
                              <br />
                              {order.timeSlotStartTime} - {order.timeSlotEndTime}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Estimated Time (fallback if no time slot) */}
                  {!order.timeSlotDate && order.estimatedPickupTime && (
                    <div className="flex items-start gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Estimated Pickup</p>
                        <p className="text-gray-600">
                          {order.estimatedPickupTime.toDate().toLocaleDateString()}
                          <br />
                          {order.estimatedPickupTime.toDate().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {!order.timeSlotDate && order.estimatedDeliveryTime && (
                    <div className="flex items-start gap-2">
                      <TruckIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Estimated Delivery</p>
                        <p className="text-gray-600">
                          {order.estimatedDeliveryTime.toDate().toLocaleDateString()}
                          <br />
                          {order.estimatedDeliveryTime.toDate().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {order.pickupLocation && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Pickup Location</p>
                        <p className="text-gray-600">{order.pickupLocation}</p>
                      </div>
                    </div>
                  )}

                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Delivery Address</p>
                        <p className="text-gray-600">
                          {order.deliveryAddress.street}
                          <br />
                          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Customer Notes */}
          {order.customerNotes && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h2>
                <p className="text-sm text-gray-700">{order.customerNotes}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
