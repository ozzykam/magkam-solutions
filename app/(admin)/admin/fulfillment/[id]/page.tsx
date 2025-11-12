'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getFulfillmentById,
  startFulfillment,
  updateFulfillmentItem,
  completeFulfillment,
  addFulfillmentNotes,
} from '@/services/order-fulfillment-service';
import {
  OrderFulfillment,
  FulfillmentItem,
  FulfillmentStatus,
  ItemFulfillmentStatus,
  getFulfillmentProgress,
} from '@/types/order-fulfillment';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function FulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const fulfillmentId = params.id as string;

  const [fulfillment, setFulfillment] = useState<OrderFulfillment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Item modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [itemQuantity, setItemQuantity] = useState(0);
  const [itemStatus, setItemStatus] = useState<ItemFulfillmentStatus>(ItemFulfillmentStatus.ADDED);
  const [itemNotes, setItemNotes] = useState('');

  // Notes modal state
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [generalNotes, setGeneralNotes] = useState('');

  const loadFulfillment = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getFulfillmentById(fulfillmentId);
      if (data) {
        setFulfillment(data);
        setGeneralNotes(data.notes || '');
      } else {
        showToast('Fulfillment not found', 'error');
        router.push('/admin/fulfillment');
      }
    } catch (error) {
      console.error('Error loading fulfillment:', error);
      showToast('Failed to load fulfillment', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fulfillmentId, showToast, router]);

    useEffect(() => {
    loadFulfillment();
  }, [loadFulfillment]);

  const handleStartFulfillment = async () => {
    if (!fulfillment || !user) return;

    try {
      setIsSaving(true);
      await startFulfillment(fulfillment.id, user.uid, user.name);
      showToast('Fulfillment started', 'success');
      loadFulfillment();
    } catch (error) {
      console.error('Error starting fulfillment:', error);
      showToast('Failed to start fulfillment', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenItemModal = (item: FulfillmentItem, index: number) => {
    setSelectedItemIndex(index);
    setItemQuantity(item.quantityFulfilled);
    setItemStatus(item.status);
    setItemNotes(item.notes || '');
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setSelectedItemIndex(null);
    setItemQuantity(0);
    setItemStatus(ItemFulfillmentStatus.ADDED);
    setItemNotes('');
  };

  const handleSaveItem = async () => {
    if (!fulfillment || !user || selectedItemIndex === null) return;

    const item = fulfillment.items[selectedItemIndex];

    // Validation
    if (itemQuantity < 0 || itemQuantity > item.quantityOrdered) {
      showToast(`Quantity must be between 0 and ${item.quantityOrdered}`, 'error');
      return;
    }

    // Determine status based on quantity
    let finalStatus = itemStatus;
    if (itemQuantity === 0) {
      finalStatus = ItemFulfillmentStatus.OUT_OF_STOCK;
    } else if (itemQuantity < item.quantityOrdered) {
      finalStatus = ItemFulfillmentStatus.PARTIAL;
    } else if (itemQuantity === item.quantityOrdered) {
      finalStatus = ItemFulfillmentStatus.ADDED;
    }

    try {
      setIsSaving(true);
      await updateFulfillmentItem(fulfillment.id, selectedItemIndex, {
        quantityFulfilled: itemQuantity,
        status: finalStatus,
        notes: itemNotes.trim() || undefined,
        processedBy: user.uid,
        processedByName: user.name,
      });
      showToast('Item updated successfully', 'success');
      handleCloseItemModal();
      loadFulfillment();
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Failed to update item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!fulfillment) return;

    try {
      setIsSaving(true);
      await addFulfillmentNotes(fulfillment.id, generalNotes);
      showToast('Notes saved', 'success');
      setIsNotesModalOpen(false);
      loadFulfillment();
    } catch (error) {
      console.error('Error saving notes:', error);
      showToast('Failed to save notes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteFulfillment = async () => {
    if (!fulfillment || !user) return;

    // Check if all items are processed
    const hasUnprocessedItems = fulfillment.items.some(
      item => item.status === ItemFulfillmentStatus.PENDING
    );

    if (hasUnprocessedItems) {
      showToast('Please process all items before completing', 'error');
      return;
    }

    if (!confirm('Are you sure you want to complete this fulfillment?')) {
      return;
    }

    try {
      setIsSaving(true);
      await completeFulfillment(fulfillment.id, user.uid, user.name);
      showToast('Fulfillment completed', 'success');
      loadFulfillment();
    } catch (error) {
      console.error('Error completing fulfillment:', error);
      showToast('Failed to complete fulfillment', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getItemStatusIcon = (status: ItemFulfillmentStatus) => {
    switch (status) {
      case ItemFulfillmentStatus.ADDED:
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case ItemFulfillmentStatus.OUT_OF_STOCK:
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case ItemFulfillmentStatus.PARTIAL:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getItemStatusBadge = (status: ItemFulfillmentStatus) => {
    switch (status) {
      case ItemFulfillmentStatus.ADDED:
        return 'success';
      case ItemFulfillmentStatus.OUT_OF_STOCK:
        return 'error';
      case ItemFulfillmentStatus.PARTIAL:
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!fulfillment) {
    return null;
  }

  const progress = getFulfillmentProgress(fulfillment.items);
  const isCompleted = fulfillment.status === FulfillmentStatus.COMPLETED;
  const isPending = fulfillment.status === FulfillmentStatus.PENDING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/fulfillment')}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order {fulfillment.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">Customer: {fulfillment.customerName}</p>
          </div>
        </div>

        {!isCompleted && (
          <div className="flex items-center gap-2">
            {isPending && (
              <Button onClick={handleStartFulfillment} loading={isSaving}>
                Start Processing
              </Button>
            )}
            {!isPending && (
              <Button
                variant="primary"
                onClick={handleCompleteFulfillment}
                loading={isSaving}
              >
                Complete Fulfillment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress Card */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <Badge variant={isCompleted ? 'success' : 'warning'} size="lg">
              {fulfillment.status}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Items Fulfilled</span>
              <span className="font-medium text-gray-900">
                {fulfillment.totalItemsFulfilled} / {fulfillment.totalItemsOrdered}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  isCompleted ? 'bg-green-600' : 'bg-primary-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {fulfillment.startedByName && (
              <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
                Started by {fulfillment.startedByName}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Items List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            <Button variant="outline" size="sm" onClick={() => setIsNotesModalOpen(true)}>
              Add Notes
            </Button>
          </div>

          <div className="space-y-3">
            {fulfillment.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Item Image */}
                {item.productImage && (
                  <Image
                    width={64}
                    height={64}
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.sku && (
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Ordered: {item.quantityOrdered} | Fulfilled: {item.quantityFulfilled}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getItemStatusIcon(item.status)}
                      <Badge variant={getItemStatusBadge(item.status)} size="sm">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {!isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenItemModal(item, index)}
                  >
                    {item.status === ItemFulfillmentStatus.PENDING ? 'Add to Cart' : 'Update'}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {fulfillment.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Fulfillment Notes:</p>
              <p className="text-sm text-gray-600 mt-1">{fulfillment.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Item Update Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        title="Process Item"
        size="sm"
      >
        {selectedItemIndex !== null && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {fulfillment.items[selectedItemIndex].productName}
              </p>
              <p className="text-xs text-gray-500">
                Ordered: {fulfillment.items[selectedItemIndex].quantityOrdered}
              </p>
            </div>

            <Input
              label="Quantity Fulfilled"
              type="number"
              min={0}
              max={fulfillment.items[selectedItemIndex].quantityOrdered}
              value={itemQuantity}
              onChange={(e) => setItemQuantity(parseInt(e.target.value) || 0)}
              helperText={`Enter 0-${fulfillment.items[selectedItemIndex].quantityOrdered}`}
            />

            <Textarea
              label="Notes (Optional)"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Add any notes about this item..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseItemModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem} loading={isSaving}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        title="Fulfillment Notes"
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="General Notes"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Add notes about this fulfillment..."
            rows={5}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsNotesModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} loading={isSaving}>
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
