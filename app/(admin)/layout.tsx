'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { UserRole } from '@/types';
import { getUnreadMessageCount } from '@/services/contact-message-service';
import {
  ShoppingCartIcon,
  UsersIcon,
  Cog6ToothIcon,
  TagIcon,
  CubeIcon,
  ChartBarIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentCheckIcon,
  Bars3Icon,
  XMarkIcon,
  EnvelopeIcon,
  HashtagIcon,
  PencilSquareIcon,
  PresentationChartLineIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Redirect if not admin or loading finished
    if (!loading && (!user || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role))) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load unread message count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadMessageCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    if (user) {
      loadUnreadCount();

      // Poll every 30 seconds for updates
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Show nothing while loading or if not admin
  if (loading || !user || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link href="/admin" className="text-xl font-bold text-primary-600">
            Admin Panel
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin" icon={ChartBarIcon}>
                Dashboard
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/messages" icon={EnvelopeIcon} badge={unreadCount > 0 ? unreadCount : undefined}>
                Messages
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/products" icon={CubeIcon}>
                Products
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/categories" icon={TagIcon}>
                Product Categories
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/orders" icon={ShoppingCartIcon}>
                Orders
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/content" icon={PencilSquareIcon}>
                Content Management
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/content-categories" icon={PencilSquareIcon}>
                Content Categories
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/fulfillment" icon={ClipboardDocumentCheckIcon}>
                Order Fulfillment
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/timeslots" icon={ClockIcon}>
                Time Slots
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/users" icon={UsersIcon}>
                Users
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/vendors" icon={BuildingStorefrontIcon}>
                Vendors
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/tags" icon={HashtagIcon}>
                Tags
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/seo" icon={BuildingStorefrontIcon}>
                SEO Management
              </NavLink>
            </div>

            {/* Analytics Section */}
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Analytics
              </p>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/analytics" icon={PresentationChartLineIcon}>
                Analytics Dashboard
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/analytics/performance" icon={RocketLaunchIcon}>
                Performance Metrics
              </NavLink>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/analytics/settings" icon={Cog6ToothIcon}>
                Analytics Settings
              </NavLink>
            </div>

            {/* Settings Section */}
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System
              </p>
            </div>
            <div onClick={() => setIsSidebarOpen(false)}>
              <NavLink href="/admin/settings" icon={Cog6ToothIcon}>
                General Settings
              </NavLink>
            </div>
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 w-full block text-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  badge?: number;
}

function NavLink({ href, icon: Icon, children, badge }: NavLinkProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive || isHovered
          ? 'bg-green-50 text-green-700'
          : 'text-gray-700'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}

    >
      <Icon
        className={`h-5 w-5 transition-colors ${
          isActive || isHovered ? 'text-green-600' : 'text-gray-600'
        }`}
      />
      <span className="flex-1">{children}</span>
      {badge !== undefined && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
