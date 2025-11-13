'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
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
  const [stats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
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

