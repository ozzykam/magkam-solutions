'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceStatus, LineItem, ClientInfo, TaxConfig, Invoice } from '@/types/invoice';
import { createInvoice } from '@/services/invoice-service';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

export default function NewInvoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Invoice basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.DRAFT);

  // Client info
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

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ]);

  // Tax configuration
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

  // Dates and terms
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

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
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = updated.quantity * updated.rate;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

    let discountAmount = 0;
    if (enableDiscount) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
    }

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = enableTax ? taxableAmount * (taxConfig.taxRate / 100) : 0;
    const total = taxableAmount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const { subtotal, discountAmount, taxAmount, total: totals } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to create an invoice');
      return;
    }

    // Validation
    if (!clientInfo.name || !clientInfo.email) {
      alert('Please fill in client name and email');
      return;
    }

    if (lineItems.some((item) => !item.description || item.quantity <= 0 || item.rate < 0)) {
      alert('Please fill in all line items with valid quantities and rates');
      return;
    }

    if (!dueDate) {
      alert('Please select a due date');
      return;
    }

    try {
      setLoading(true);

      // Build invoice data conditionally to avoid undefined values
      const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        status,
        client: {
          name: clientInfo.name,
          email: clientInfo.email,
        },
        lineItems,
        subtotal: subtotal,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        total: totals,
        amountPaid: 0,
        amountDue: totals,
        payments: [],
        issueDate: Timestamp.fromDate(new Date(issueDate)),
        dueDate: Timestamp.fromDate(new Date(dueDate)),
      };

      // Only add optional fields if they have values
      if (title) {
        invoiceData.title = title;
      }
      if (description) {
        invoiceData.description = description;
      }
      if (clientInfo.company) {
        invoiceData.client.company = clientInfo.company;
      }
      if (clientInfo.phone) {
        invoiceData.client.phone = clientInfo.phone;
      }
      if (clientInfo.address && (clientInfo.address.street || clientInfo.address.city)) {
        invoiceData.client.address = clientInfo.address;
      }
      if (enableTax) {
        invoiceData.taxConfig = taxConfig;
      }
      if (enableDiscount && discountAmount > 0) {
        invoiceData.discount = {
          type: discountType,
          value: discountValue,
        };
        if (discountReason) {
          invoiceData.discount.reason = discountReason;
        }
      }
      if (paymentTerms) {
        invoiceData.terms = paymentTerms;
      }
      if (terms) {
        invoiceData.terms = terms;
      }
      if (notes) {
        invoiceData.notes = notes;
      }

      const invoiceId = await createInvoice(invoiceData, user.uid);
      router.push(`/admin/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600 mt-1">Fill in the details to create a new invoice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title (Optional)"
              placeholder="e.g., Web Development Services"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={InvoiceStatus.DRAFT}>Draft</option>
                <option value={InvoiceStatus.SENT}>Sent</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description of the invoice"
            />
          </div>
        </Card>

        {/* Dates */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="mt-4">
            <Input
              label="Payment Terms (Optional)"
              placeholder="e.g., Net 30, Due on receipt"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>
        </Card>

        {/* Client Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Client Name"
              placeholder="John Doe"
              value={clientInfo.name}
              onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={clientInfo.email}
              onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
              required
            />
            <Input
              label="Company (Optional)"
              placeholder="Acme Inc."
              value={clientInfo.company}
              onChange={(e) => setClientInfo({ ...clientInfo, company: e.target.value })}
            />
            <Input
              label="Phone (Optional)"
              placeholder="+1 (555) 123-4567"
              value={clientInfo.phone}
              onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
            />
          </div>
          <div className="mt-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Address (Optional)</h3>
            <Input
              label="Street"
              placeholder="123 Main St"
              value={clientInfo.address?.street || ''}
              onChange={(e) =>
                setClientInfo({
                  ...clientInfo,
                  address: { ...clientInfo.address!, street: e.target.value },
                })
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                placeholder="New York"
                value={clientInfo.address?.city || ''}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    address: { ...clientInfo.address!, city: e.target.value },
                  })
                }
              />
              <Input
                label="State"
                placeholder="NY"
                value={clientInfo.address?.state || ''}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    address: { ...clientInfo.address!, state: e.target.value },
                  })
                }
              />
              <Input
                label="ZIP Code"
                placeholder="10001"
                value={clientInfo.address?.zipCode || ''}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    address: { ...clientInfo.address!, zipCode: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </Card>

        {/* Line Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <Button type="button" variant="ghost" size="sm" onClick={addLineItem}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
          <div className="space-y-4">
            {lineItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Description"
                        placeholder="Service or product description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <Input
                      label="Quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                    <Input
                      label="Rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-500">Amount</div>
                    <div className="font-semibold text-gray-900">
                      ${item.amount.toFixed(2)}
                    </div>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tax Configuration */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tax</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableTax}
                onChange={(e) => setEnableTax(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Enable tax</span>
            </label>
          </div>
          {enableTax && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tax Label"
                placeholder="e.g., Sales Tax, VAT"
                value={taxConfig.taxLabel}
                onChange={(e) => setTaxConfig({ ...taxConfig, taxLabel: e.target.value })}
              />
              <Input
                label="Tax Rate (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxConfig.taxRate}
                onChange={(e) => setTaxConfig({ ...taxConfig, taxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          )}
        </Card>

        {/* Discount */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Discount</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableDiscount}
                onChange={(e) => setEnableDiscount(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Enable discount</span>
            </label>
          </div>
          {enableDiscount && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <Input
                  label="Value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="Reason (Optional)"
                  placeholder="e.g., Early payment"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Terms and Notes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions (Optional)
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Payment terms, refund policy, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Notes for internal use only (not visible to client)"
              />
            </div>
          </div>
        </Card>

        {/* Totals Summary */}
        <Card className="p-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {enableDiscount && discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            {enableTax && taxAmount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>{taxConfig.taxLabel}:</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span>${totals.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
