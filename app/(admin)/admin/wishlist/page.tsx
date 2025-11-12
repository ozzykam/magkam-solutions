'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui';
import { WishlistAnalytics } from '@/types/wishlist';
import { getWishlistAnalytics } from '@/services/wishlist-service';

export default function AdminWishlistPage() {
  const toast = useToast();
  const [analytics, setAnalytics] = useState<WishlistAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);


  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWishlistAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading wishlist analytics:', error);
      toast?.error('Failed to load wishlist analytics');
    } finally {
      setLoading(false);
    }
  }, [toast]);

    useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleSendNotifications = async (productId: string, productName: string, pendingCount: number) => {
    if (pendingCount === 0) {
      toast?.error('No users waiting for notifications');
      return;
    }

    if (!confirm(`Send restock notifications to ${pendingCount} user(s) for "${productName}"?`)) {
      return;
    }

    try {
      setSending(productId);

      const response = await fetch('/api/wishlist/send-restock-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notifications');
      }

      toast?.success(data.message);

      // Refresh analytics
      await loadAnalytics();
    } catch (error) {
      console.error('Error sending notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notifications';
      toast?.error(errorMessage);
    } finally {
      setSending(null);
    }
  };

  const filteredAnalytics = analytics.filter((item) => {
    if (filter === 'in-stock') return item.isInStock;
    if (filter === 'out-of-stock') return !item.isInStock;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Wishlist Analytics</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wishlist Analytics</h1>
        <p className="text-gray-600">
          See which products are most wishlisted and manage restock notifications
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Total Products</div>
          <div className="text-3xl font-bold text-gray-900">{analytics.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Total Wishlisted</div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.reduce((sum, item) => sum + item.totalWishlisted, 0)}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Awaiting Restock</div>
          <div className="text-3xl font-bold text-orange-600">
            {analytics.reduce((sum, item) => sum + item.waitingForRestock, 0)}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Pending Notifications</div>
          <div className="text-3xl font-bold text-red-600">
            {analytics.reduce((sum, item) => sum + item.notificationsPending, 0)}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({analytics.length})
        </Button>
        <Button
          variant={filter === 'out-of-stock' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('out-of-stock')}
        >
          Out of Stock ({analytics.filter(i => !i.isInStock).length})
        </Button>
        <Button
          variant={filter === 'in-stock' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('in-stock')}
        >
          In Stock ({analytics.filter(i => i.isInStock).length})
        </Button>
      </div>

      {/* Products List */}
      {filteredAnalytics.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No wishlisted products yet
          </h2>
          <p className="text-gray-600">
            Products will appear here once customers add them to their wishlists
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnalytics.map((item) => (
            <Card key={item.productId} className="p-6">
              <div className="flex gap-6">
                {/* Product Image */}
                <Link href={`/products/${item.productSlug}`} className="flex-shrink-0">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={item.productImage || '/images/placeholder-product.png'}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Product Info */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {item.productName}
                      </Link>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isInStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.isInStock
                            ? `In Stock (${item.currentStock})`
                            : 'Out of Stock'}
                        </span>
                        <span className="text-sm text-gray-600">
                          💝 {item.totalWishlisted} {item.totalWishlisted === 1 ? 'user' : 'users'}
                        </span>
                        {item.waitingForRestock > 0 && (
                          <span className="text-sm text-orange-600">
                            ⏰ {item.waitingForRestock} waiting for restock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.isInStock && item.notificationsPending > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            handleSendNotifications(
                              item.productId,
                              item.productName,
                              item.notificationsPending
                            )
                          }
                          disabled={sending === item.productId}
                        >
                          {sending === item.productId
                            ? 'Sending...'
                            : `Notify ${item.notificationsPending} User${
                                item.notificationsPending === 1 ? '' : 's'
                              }`}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedProduct(
                            expandedProduct === item.productId ? null : item.productId
                          )
                        }
                      >
                        {expandedProduct === item.productId ? 'Hide' : 'View'} Users
                      </Button>
                    </div>
                  </div>

                  {/* Expanded User List */}
                  {expandedProduct === item.productId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Users with this product in their wishlist:
                      </h4>
                      <div className="space-y-2">
                        {item.users.map((user) => (
                          <div
                            key={user.userId}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.userName}
                              </div>
                              <div className="text-xs text-gray-500">{user.userEmail}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                Added {user.addedAt.toDate().toLocaleDateString()}
                              </span>
                              {user.notificationSent && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ Notified
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
