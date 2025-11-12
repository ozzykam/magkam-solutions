'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  UserCircleIcon,
  ShoppingBagIcon,
  MapPinIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const accountNavigation = [
  {
    name: 'Overview',
    href: '/account',
    icon: UserCircleIcon,
  },
  {
    name: 'Orders',
    href: '/account/orders',
    icon: ShoppingBagIcon,
  },
  {
    name: 'Addresses',
    href: '/account/addresses',
    icon: MapPinIcon,
  },
  {
    name: 'Profile',
    href: '/account/profile',
    icon: UserCircleIcon,
  },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/account') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <nav className="space-y-1 bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 px-3">
                  My Account
                </h2>
                {accountNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${
                          active
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Mobile Menu Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow text-gray-700 hover:bg-gray-50"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
                <span className="font-medium">Account Menu</span>
              </button>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <nav className="mt-2 bg-white rounded-lg shadow p-4 space-y-1">
                  {accountNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          router.push(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                          ${
                            active
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Main Content */}
            <main className="lg:col-span-9">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
