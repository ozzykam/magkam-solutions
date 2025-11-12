'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui';
import { getAllFulfillments } from '@/services/order-fulfillment-service';
import { OrderFulfillment, FulfillmentStatus, getFulfillmentProgress } from '@/types/order-fulfillment';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function OrderFulfillmentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fulfillments, setFulfillments] = useState<OrderFulfillment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | FulfillmentStatus>('all');


  const loadFulfillments = useCallback(async () => {
    try {
      setIsLoading(true);
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getAllFulfillments(filter);
      setFulfillments(data);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
      showToast('Failed to load order fulfillments', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadFulfillments();
  }, [loadFulfillments]);

  const handleProcessOrder = (fulfillmentId: string) => {
    router.push(`/admin/fulfillment/${fulfillmentId}`);
  };

  const getStatusBadgeVariant = (status: FulfillmentStatus) => {
    switch (status) {
      case FulfillmentStatus.PENDING:
        return 'default';
      case FulfillmentStatus.IN_PROGRESS:
        return 'warning';
      case FulfillmentStatus.COMPLETED:
        return 'success';
      case FulfillmentStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: FulfillmentStatus) => {
    switch (status) {
      case FulfillmentStatus.PENDING:
        return <ClockIcon className="h-5 w-5" />;
      case FulfillmentStatus.IN_PROGRESS:
        return <ClipboardDocumentListIcon className="h-5 w-5" />;
      case FulfillmentStatus.COMPLETED:
        return <CheckCircleIcon className="h-5 w-5" />;
      case FulfillmentStatus.CANCELLED:
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null | undefined) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as Date | string);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getButtonText = (status: FulfillmentStatus) => {
    switch (status) {
      case FulfillmentStatus.PENDING:
        return 'Start Processing';
      case FulfillmentStatus.IN_PROGRESS:
        return 'Resume Processing';
      case FulfillmentStatus.COMPLETED:
        return 'View Details';
      case FulfillmentStatus.CANCELLED:
        return 'View Details';
      default:
        return 'Process';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order Fulfillment</h1>
        <p className="text-gray-600 mt-1">Process and track order fulfillments</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | FulfillmentStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value={FulfillmentStatus.PENDING}>Pending</option>
              <option value={FulfillmentStatus.IN_PROGRESS}>In Progress</option>
              <option value={FulfillmentStatus.COMPLETED}>Completed</option>
              <option value={FulfillmentStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Fulfillments List */}
      <div className="space-y-3">
        {fulfillments.length === 0 ? (
          <Card>
            <div className="p-12 text-center text-gray-500">
              {statusFilter !== 'all'
                ? `No ${statusFilter} fulfillments found`
                : 'No order fulfillments yet'}
            </div>
          </Card>
        ) : (
          fulfillments.map((fulfillment) => {
            const progress = getFulfillmentProgress(fulfillment.items);

            return (
              <Card key={fulfillment.id}>
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Order Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1">
                        {getStatusIcon(fulfillment.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {fulfillment.orderNumber}
                          </p>
                          <Badge variant={getStatusBadgeVariant(fulfillment.status)} size="sm">
                            {fulfillment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Customer: {fulfillment.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(fulfillment.createdAt)}
                        </p>

                        {/* Progress Bar - Mobile */}
                        {fulfillment.status !== FulfillmentStatus.COMPLETED && (
                          <div className="mt-2 sm:hidden">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Info */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">
                          {fulfillment.totalItemsFulfilled}/{fulfillment.totalItemsOrdered} items
                        </p>
                        {fulfillment.status !== FulfillmentStatus.COMPLETED && (
                          <div className="mt-1">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {fulfillment.startedByName && (
                        <div className="text-sm text-gray-600">
                          <p>Started by:</p>
                          <p className="font-medium text-gray-900">{fulfillment.startedByName}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions - Desktop */}
                    <div className="hidden sm:flex items-center gap-2">
                      <Button
                        variant={fulfillment.status === FulfillmentStatus.COMPLETED ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleProcessOrder(fulfillment.id)}
                        leftIcon={<ArrowRightIcon className="h-4 w-4" />}
                      >
                        {getButtonText(fulfillment.status)}
                      </Button>
                    </div>
                  </div>

                  {/* Actions - Mobile */}
                  <div className="sm:hidden mt-3 pt-3 border-t border-gray-200">
                    <Button
                      variant={fulfillment.status === FulfillmentStatus.COMPLETED ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleProcessOrder(fulfillment.id)}
                      fullWidth
                    >
                      {getButtonText(fulfillment.status)}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary */}
      {fulfillments.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {fulfillments.length} fulfillment{fulfillments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
