'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import {
  LineItem,
  ProposalStatus,
  ClientInfo,
  TaxConfig,
  calculateLineItemAmount,
  calculateTotal,
} from '@/types/invoice';
import { getProposalById, updateProposal } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

export default function EditProposalPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Client Information
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  // Proposal Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Tax Configuration
  const [enableTax, setEnableTax] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    taxRate: 0,
    taxLabel: 'Tax',
  });

  // Discount
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = enableTax ? (subtotal * taxConfig.taxRate) / 100 : 0;
  const discountAmount = enableDiscount
    ? discountType === 'percentage'
      ? (subtotal * discountValue) / 100
      : discountValue
    : 0;
  const totals = calculateTotal(subtotal, taxAmount, discountAmount);

  const loadProposal = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const proposal = await getProposalById(id);

      if (!proposal) {
        alert('Proposal not found');
        router.push('/admin/proposals');
        return;
      }

      if (proposal.status !== ProposalStatus.DRAFT) {
        alert('Only draft proposals can be edited');
        router.push(`/admin/proposals/${id}`);
        return;
      }

      // Load proposal data into state
      setClientInfo(proposal.client);
      setLineItems(proposal.lineItems);
      setTitle(proposal.title || '');
      setDescription(proposal.description || '');
      setTerms(proposal.terms || '');
      setNotes(proposal.notes || '');

      if (proposal.validUntil) {
        const date = proposal.validUntil.toDate();
        setValidUntil(date.toISOString().split('T')[0]);
      }

      if (proposal.taxConfig) {
        setEnableTax(true);
        setTaxConfig(proposal.taxConfig);
      }

      if (proposal.discount) {
        setEnableDiscount(true);
        setDiscountType(proposal.discount.type);
        setDiscountValue(proposal.discount.value);
        setDiscountReason(proposal.discount.reason || '');
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
      alert('Failed to load proposal');
      router.push('/admin/proposals');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.id) {
      loadProposal(params.id as string);
    }
  }, [params.id, loadProposal]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      alert('At least one line item is required');
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = calculateLineItemAmount(
              field === 'quantity' ? value : updated.quantity,
              field === 'rate' ? value : updated.rate
            );
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!clientInfo.name || !clientInfo.email) {
      alert('Please enter client name and email');
      return;
    }

    if (lineItems.some((item) => !item.description || item.quantity <= 0 || item.rate < 0)) {
      alert('Please complete all line items');
      return;
    }

    if (!params.id) {
      alert('Proposal ID not found');
      return;
    }

    try {
      setSaving(true);

      // Build proposal update data, only including defined fields
      const updates: any = {
        client: clientInfo,
        lineItems,
        subtotal: subtotal,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        total: totals,
      };

      // Only add optional fields if they have values
      if (enableTax) {
        updates.taxConfig = taxConfig;
      } else {
        updates.taxConfig = null; // Remove tax config if disabled
      }

      if (enableDiscount) {
        updates.discount = { type: discountType, value: discountValue, reason: discountReason };
      } else {
        updates.discount = null; // Remove discount if disabled
      }

      if (title) {
        updates.title = title;
      } else {
        updates.title = null;
      }

      if (description) {
        updates.description = description;
      } else {
        updates.description = null;
      }

      if (terms) {
        updates.terms = terms;
      } else {
        updates.terms = null;
      }

      if (notes) {
        updates.notes = notes;
      } else {
        updates.notes = null;
      }

      if (validUntil) {
        updates.validUntil = Timestamp.fromDate(new Date(validUntil));
      } else {
        updates.validUntil = null;
      }

      await updateProposal(params.id as string, updates);

      alert('Proposal updated successfully!');
      router.push(`/admin/proposals/${params.id}`);
    } catch (error) {
      console.error('Error updating proposal:', error);
      alert('Failed to update proposal');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Proposal</h1>
        <p className="text-gray-600 mt-1">Update proposal details</p>
      </div>

      {/* Client Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Client Name"
              value={clientInfo.name}
              onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email"
              type="email"
              value={clientInfo.email}
              onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
              placeholder="client@example.com"
              required
            />
            <Input
              label="Company"
              value={clientInfo.company || ''}
              onChange={(e) => setClientInfo({ ...clientInfo, company: e.target.value })}
              placeholder="Acme Inc."
            />
            <Input
              label="Phone"
              type="tel"
              value={clientInfo.phone || ''}
              onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
            <Input
              label="Street Address"
              value={clientInfo.address?.street || ''}
              onChange={(e) =>
                setClientInfo({
                  ...clientInfo,
                  address: { ...clientInfo.address!, street: e.target.value },
                })
              }
              placeholder="123 Main St"
            />
            <Input
              label="City"
              value={clientInfo.address?.city || ''}
              onChange={(e) =>
                setClientInfo({
                  ...clientInfo,
                  address: { ...clientInfo.address!, city: e.target.value },
                })
              }
              placeholder="Springfield"
            />
            <Input
              label="State"
              value={clientInfo.address?.state || ''}
              onChange={(e) =>
                setClientInfo({
                  ...clientInfo,
                  address: { ...clientInfo.address!, state: e.target.value },
                })
              }
              placeholder="IL"
            />
            <Input
              label="ZIP Code"
              value={clientInfo.address?.zipCode || ''}
              onChange={(e) =>
                setClientInfo({
                  ...clientInfo,
                  address: { ...clientInfo.address!, zipCode: e.target.value },
                })
              }
              placeholder="62701"
            />
          </div>
        </div>
      </Card>

      {/* Proposal Details */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Proposal Details</h2>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Website Development Proposal"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the proposal"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Input
            label="Valid Until"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            helperText="When does this proposal expire?"
          />
        </div>
      </Card>

      {/* Line Items */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <Button variant="ghost" size="sm" onClick={addLineItem}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    placeholder="Service or product description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <button
                    onClick={() => removeLineItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Tax & Discount */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Tax & Discount</h2>

          {/* Tax */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={enableTax}
                onChange={(e) => setEnableTax(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Tax</span>
            </label>
            {enableTax && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <Input
                  label="Tax Label"
                  value={taxConfig.taxLabel}
                  onChange={(e) => setTaxConfig({ ...taxConfig, taxLabel: e.target.value })}
                  placeholder="Sales Tax"
                />
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxConfig.taxRate}
                  onChange={(e) => setTaxConfig({ ...taxConfig, taxRate: parseFloat(e.target.value) || 0 })}
                  placeholder="8.5"
                />
              </div>
            )}
          </div>

          {/* Discount */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={enableDiscount}
                onChange={(e) => setEnableDiscount(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Discount</span>
            </label>
            {enableDiscount && (
              <div className="grid grid-cols-3 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <Input
                  label={discountType === 'percentage' ? 'Discount (%)' : 'Discount ($)'}
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="Reason (Optional)"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Early bird discount"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Terms & Notes */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Terms & Notes</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              placeholder="Payment terms, conditions, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes (not visible to client)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card>
        <div className="p-6 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {enableDiscount && discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {enableTax && taxAmount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>{taxConfig.taxLabel}:</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
            <span>Total:</span>
            <span>{formatCurrency(totals)}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end pb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
