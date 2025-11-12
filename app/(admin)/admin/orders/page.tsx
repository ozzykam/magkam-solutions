'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, OrderStatus, FulfillmentType } from '@/types/order';
import { formatTimeSlot, formatSlotDate } from '@/types/business-info';
import { getFulfillmentByOrderId, createOrderFulfillment } from '@/services/order-fulfillment-service';
import { FulfillmentStatus } from '@/types/order-fulfillment';
import { getOrderById } from '@/services/order-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Input from '@/components/ui/Input';
import { ChevronDownIcon, ChevronUpIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [fulfillmentStatuses, setFulfillmentStatuses] = useState<Record<string, FulfillmentStatus | null>>({});

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(ordersQuery);
      const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setOrders(ordersData);

      // Load fulfillment statuses for paid orders
      const statuses: Record<string, FulfillmentStatus | null> = {};
      await Promise.all(
        ordersData
          .filter(order => order.status === OrderStatus.PAID || order.paymentStatus === 'paid')
          .map(async (order) => {
            try {
              const fulfillment = await getFulfillmentByOrderId(order.id);
              statuses[order.id] = fulfillment?.status || null;
            } catch (error) {
              console.error(`Error loading fulfillment for order ${order.id}:`, error);
              statuses[order.id] = null;
            }
          })
      );
      setFulfillmentStatuses(statuses);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = useCallback( async () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        o =>
          o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setOrders(orders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));

      // If manually marking as PAID, create fulfillment document (mimics webhook behavior)
      if (newStatus === OrderStatus.PAID) {
        try {
          const order = await getOrderById(orderId);
          if (order) {
            const existingFulfillment = await getFulfillmentByOrderId(orderId);
            if (!existingFulfillment) {
              await createOrderFulfillment(order);
              console.log('Fulfillment created for order', orderId);
              // Reload to show fulfillment button
              loadOrders();
            }
          }
        } catch (fulfillmentError) {
          console.error('Error creating fulfillment:', fulfillmentError);
          // Don't fail the status update if fulfillment creation fails
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleProcessFulfillment = async (orderId: string) => {
    try {
      const fulfillment = await getFulfillmentByOrderId(orderId);
      if (fulfillment) {
        router.push(`/admin/fulfillment/${fulfillment.id}`);
      } else {
        alert('No fulfillment found for this order');
      }
    } catch (error) {
      console.error('Error loading fulfillment:', error);
      alert('Failed to load fulfillment');
    }
  };

  const getFulfillmentButtonText = (orderId: string) => {
    const status = fulfillmentStatuses[orderId];
    if (status === FulfillmentStatus.PENDING) {
      return 'Start Processing';
    } else if (status === FulfillmentStatus.IN_PROGRESS) {
      return 'Resume Processing';
    } else if (status === FulfillmentStatus.COMPLETED) {
      return 'View Fulfillment';
    }
    return 'Process Order';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage customer orders</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Search Orders"
              placeholder="Search by order #, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Orders</option>
                <option value={OrderStatus.PENDING}>Pending Payment</option>
                <option value={OrderStatus.PAID}>Paid</option>
                <option value={OrderStatus.PROCESSING}>Processing</option>
                <option value={OrderStatus.READY_FOR_PICKUP}>Ready for Pickup</option>
                <option value={OrderStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
                <option value={OrderStatus.DELIVERED}>Delivered</option>
                <option value={OrderStatus.COMPLETED}>Completed</option>
                <option value={OrderStatus.CANCELLED}>Cancelled</option>
                <option value={OrderStatus.REFUNDED}>Refunded</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <div className="p-12 text-center text-gray-500">
              No orders found
            </div>
          </Card>
        ) : (
          filteredOrders.map(order => {
            const isExpanded = expandedOrders.has(order.id);

            // Parse name (assumes format: "FirstName LastName")
            const nameParts = order.userName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            const displayName = lastName ? `${lastName}, ${firstName}` : firstName;

            return (
              <Card key={order.id}>
                <div className="relative">
                  <Badge variant={getStatusVariant(order.status)} size="sm" className="absolute left-[-10px] top-[-10px]">
                    {order.status}
                  </Badge>
                  {/* Accordion Header - Always Visible - Clickable */}
                  <button
                    onClick={() => toggleOrderExpanded(order.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-left">
                        <div> 
                          <span className="text-base font-semibold text-gray-900">{displayName}</span> (<span className="text-sm">{order.orderNumber}</span>)
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.createdAt.toDate().toLocaleDateString()} at{' '}
                          {order.createdAt.toDate().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded Details - Collapsible */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                      {/* Customer & Fulfillment Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Customer</p>
                          <p className="text-sm text-gray-900">{order.userName}</p>
                          <p className="text-sm text-gray-600">{order.userEmail}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">Fulfillment</p>
                          <p className="text-sm text-gray-900">{order.fulfillmentType}</p>
                          {order.fulfillmentType === FulfillmentType.DELIVERY && order.deliveryAddress && (
                            <p className="text-sm text-gray-600">
                              {order.deliveryAddress.street}, {order.deliveryAddress.city}
                            </p>
                          )}
                          {order.fulfillmentType === FulfillmentType.PICKUP && order.pickupLocation && (
                            <p className="text-sm text-gray-600">{order.pickupLocation}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">Time Slot</p>
                          {order.timeSlotDate && order.timeSlotStartTime && order.timeSlotEndTime ? (
                            <>
                              <p className="text-sm text-gray-900">
                                {formatSlotDate(order.timeSlotDate)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatTimeSlot(order.timeSlotStartTime, order.timeSlotEndTime)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">No time slot</p>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Items ({order.items.length})
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-900">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="text-gray-600">${item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Totals */}
                      <div>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                          </div>
                          {order.deliveryFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Delivery Fee</span>
                              <span className="text-gray-900">${order.deliveryFee.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Information */}
                      {order.paymentStatus === 'paid' && (order.cardBrand || order.paymentMethod) && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-900">Payment Method:</p>
                          <div className="text-sm text-green-800 mt-1">
                            {order.cardBrand && order.cardLast4 ? (
                              <span>
                                <span className="capitalize">{order.cardBrand}</span> ending in {order.cardLast4}
                              </span>
                            ) : order.paymentMethod ? (
                              <span className="capitalize">{order.paymentMethod}</span>
                            ) : (
                              'Card'
                            )}
                          </div>
                        </div>
                      )}

                      {/* Customer Notes */}
                      {order.customerNotes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-yellow-900">Customer Notes:</p>
                          <p className="text-sm text-yellow-800 mt-1">{order.customerNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons - Always Visible at Bottom */}
                  <div className="border-t border-gray-200 p-4 pb-0 flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900">
                      ${order.total.toFixed(2)}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {/* Fulfillment Button - Show for paid orders */}
                      {(order.status === OrderStatus.PAID || order.paymentStatus === 'paid') && fulfillmentStatuses[order.id] !== undefined && (
                        <Button
                          size="sm"
                          variant={fulfillmentStatuses[order.id] === FulfillmentStatus.COMPLETED ? 'outline' : 'primary'}
                          onClick={() => handleProcessFulfillment(order.id)}
                          leftIcon={<ClipboardDocumentCheckIcon className="h-4 w-4" />}
                        >
                          {getFulfillmentButtonText(order.id)}
                        </Button>
                      )}

                      {order.status === OrderStatus.PENDING && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateOrderStatus(order.id, OrderStatus.PAID)}
                        >
                          Confirm Payment
                        </Button>
                      )}
                      {order.status === OrderStatus.PAID && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateOrderStatus(order.id, OrderStatus.PROCESSING)}
                        >
                          Start Processing
                        </Button>
                      )}
                      {order.status === OrderStatus.PROCESSING && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateOrderStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === OrderStatus.READY_FOR_PICKUP && order.fulfillmentType === FulfillmentType.DELIVERY && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                        >
                          Out for Delivery
                        </Button>
                      )}
                      {(order.status === OrderStatus.READY_FOR_PICKUP || order.status === OrderStatus.OUT_FOR_DELIVERY || order.status === OrderStatus.DELIVERED) && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateOrderStatus(order.id, OrderStatus.COMPLETED)}
                        >
                          Complete
                        </Button>
                      )}
                      {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.COMPLETED && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, OrderStatus.CANCELLED)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  );
}

function getStatusVariant(status: OrderStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case OrderStatus.PENDING:
      return 'default';
    case OrderStatus.PAID:
    case OrderStatus.PROCESSING:
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'primary';
    case OrderStatus.READY_FOR_PICKUP:
    case OrderStatus.DELIVERED:
      return 'warning';
    case OrderStatus.COMPLETED:
      return 'success';
    case OrderStatus.CANCELLED:
    case OrderStatus.REFUNDED:
      return 'error';
    default:
      return 'default';
  }
}
