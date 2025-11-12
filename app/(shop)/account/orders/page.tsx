'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Image from 'next/image';
import { useToast } from '@/components/ui';
import { getUserOrders } from '@/services/order-service';
import { Order, OrderStatus } from '@/types/order';
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export default function MyOrdersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadOrders = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const ordersData = await getUserOrders(user.uid);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user?.uid) {
      loadOrders();
    }
  }, [user, loadOrders]);

  const filterOrders = useCallback(async () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some(item => item.productName.toLowerCase().includes(query))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'default' as const;
      case OrderStatus.PAID:
        return 'success' as const;
      case OrderStatus.PROCESSING:
        return 'info' as const;
      case OrderStatus.READY_FOR_PICKUP:
        return 'warning' as const;
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'info' as const;
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        return 'success' as const;
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
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
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
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
        return 'Ready for Pickup';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Out for Delivery';
      case OrderStatus.DELIVERED:
        return 'Delivered';
      case OrderStatus.COMPLETED:
        return 'Completed';
      case OrderStatus.CANCELLED:
        return 'Cancelled';
      case OrderStatus.REFUNDED:
        return 'Refunded';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-1">View and track your order history</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by order number or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            {Object.values(OrderStatus).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusDisplayName(status)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">
              {orders.filter(o => o.status === OrderStatus.PROCESSING).length}
            </p>
            <p className="text-sm text-gray-600">Processing</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === OrderStatus.COMPLETED).length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Total Spent</p>
          </div>
        </Card>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start shopping to see your orders here'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => router.push('/products')}>
                Browse Products
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <div className="p-6">
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {getStatusDisplayName(order.status)}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed on {order.createdAt.toDate().toLocaleDateString()} at{' '}
                      {order.createdAt.toDate().toLocaleTimeString()}
                    </p>
                    {order.timeSlotDate && order.timeSlotStartTime && (
                      <p className="text-sm text-gray-600">
                        {order.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}: {new Date(order.timeSlotDate).toLocaleDateString()} at {order.timeSlotStartTime}
                      </p>
                    )}
                    {!order.timeSlotDate && order.estimatedPickupTime && (
                      <p className="text-sm text-gray-600">
                        Pickup: {order.estimatedPickupTime.toDate().toLocaleDateString()} at{' '}
                        {order.estimatedPickupTime.toDate().toLocaleTimeString()}
                      </p>
                    )}
                    {!order.timeSlotDate && order.estimatedDeliveryTime && (
                      <p className="text-sm text-gray-600">
                        Delivery: {order.estimatedDeliveryTime.toDate().toLocaleDateString()} at{' '}
                        {order.estimatedDeliveryTime.toDate().toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{order.items.length} items</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        {item.productImage && (
                          <Image
                            width={64}
                            height={64}
                            src={item.productImage}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    View Details
                  </Button>
                  {order.status === OrderStatus.PENDING && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/checkout?orderId=${order.id}`)}
                    >
                      Complete Payment
                    </Button>
                  )}
                  {order.status === OrderStatus.COMPLETED && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement reorder functionality
                        showToast('Reorder feature coming soon!', 'info');
                      }}
                    >
                      Reorder
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Showing count */}
      {filteredOrders.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      )}
    </div>
  );
}
