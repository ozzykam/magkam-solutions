'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, OrderStatus } from '@/types/order';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import {
  ClockIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  PresentationChartLineIcon,
  PercentBadgeIcon,
} from '@heroicons/react/24/solid';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get all orders
      const ordersQuery = query(collection(db, 'orders'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
      const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length;

      const todayOrders = orders.filter(o => o.createdAt.toDate() >= todayStart);
      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        totalRevenue,
        todayOrders: todayOrders.length,
        todayRevenue,
      });

      // Get recent orders (last 10)
      const recentQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const recentSnapshot = await getDocs(recentQuery);
      const recent = recentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setRecentOrders(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          subtitle={`$${stats.todayRevenue.toFixed(2)} revenue`}
          icon={ShoppingBagIcon}
          color="blue"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          subtitle="Awaiting processing"
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle={`${stats.completedOrders} completed`}
          icon={ClipboardDocumentCheckIcon}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          subtitle="All time"
          icon={CurrencyDollarIcon}
          color="purple"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}`}
          subtitle="Per order"
          icon={PresentationChartLineIcon}
          color="indigo"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%`}
          subtitle={`${stats.completedOrders}/${stats.totalOrders} orders`}
          icon={PercentBadgeIcon}
          color="green"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Order #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{order.userName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.createdAt.toDate().toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusVariant(order.status)} size="sm">
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }> | string;
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'indigo';
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  };

  const IconComponent = typeof icon === 'string' ? null : icon;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            {IconComponent ? (
              <IconComponent className="w-8 h-8" />
            ) : (
              <span className="text-2xl">{icon as string}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
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
