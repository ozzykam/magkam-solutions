'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Image from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getUserById } from '@/services/user-service';
import { getUserOrders } from '@/services/order-service';
import { User } from '@/types/user';
import { Order, OrderStatus } from '@/types/order';
import {
  UserCircleIcon,
  ShoppingBagIcon,
  MapPinIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function AccountOverviewPage() {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadUserData = useCallback(async () => {
    if (!authUser?.uid) return;
    try {
      const userData = await getUserById(authUser.uid);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [authUser]);

  const loadRecentOrders = useCallback(async () => {
    if (!authUser?.uid) return;
    try {
      const orders = await getUserOrders(authUser.uid);
      // Get 3 most recent orders
      setRecentOrders(orders.slice(0, 3));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser?.uid) {
      loadUserData();
      loadRecentOrders();
    }
  }, [authUser, loadUserData, loadRecentOrders]);

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'default' as const;
      case OrderStatus.PAID:
      case OrderStatus.PROCESSING:
        return 'info' as const;
      case OrderStatus.COMPLETED:
      case OrderStatus.DELIVERED:
        return 'success' as const;
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const defaultAddress = user.addresses?.find((addr) => addr.isDefault) || user.addresses?.[0];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <Image
              width={64}
              height={64}
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-primary-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name || 'User'}!
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover>
          <button
            onClick={() => router.push('/account/orders')}
            className="p-6 text-left w-full"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentOrders.length > 0 ? `${recentOrders.length}+` : '0'}
                </p>
              </div>
            </div>
          </button>
        </Card>

        <Card hover>
          <button
            onClick={() => router.push('/account/addresses')}
            className="p-6 text-left w-full"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPinIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saved Addresses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user.addresses?.length || 0}
                </p>
              </div>
            </div>
          </button>
        </Card>

        <Card hover>
          <button
            onClick={() => router.push('/account/profile')}
            className="p-6 text-left w-full"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <UserCircleIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="text-2xl font-bold text-gray-900">Active</p>
              </div>
            </div>
          </button>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/account/orders')}
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
              View All
            </Button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No orders yet</p>
              <Button onClick={() => router.push('/shop')}>
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                  onClick={() => router.push(`/account/orders/${order.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-900">
                        Order #{order.orderNumber}
                      </p>
                      <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.createdAt.toDate().toLocaleDateString()} • {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${order.total.toFixed(2)}
                    </p>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Default Address */}
      {defaultAddress && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Default Address</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/account/addresses')}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}
              >
                Manage
              </Button>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{defaultAddress.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {defaultAddress.street}
                  {defaultAddress.apartment && `, ${defaultAddress.apartment}`}
                </p>
                <p className="text-sm text-gray-600">
                  {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/shop')}
              leftIcon={<ShoppingBagIcon className="w-5 h-5" />}
            >
              Continue Shopping
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/account/profile')}
              leftIcon={<UserCircleIcon className="w-5 h-5" />}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
