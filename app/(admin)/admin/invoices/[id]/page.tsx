'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { Invoice, InvoiceStatus, PaymentInfo } from '@/types/invoice';
import {
  getInvoiceById,
  deleteInvoice,
  markInvoiceAsSent,
  cancelInvoice,
  recordPayment,
} from '@/services/invoice-service';
import { useAuth } from '@/lib/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CreditCardIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'info',
  [InvoiceStatus.VIEWED]: 'warning',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.PARTIALLY_PAID]: 'warning',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.CANCELLED]: 'error',
};

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'check' | 'cash' | 'other'>('other');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    if (params.id) {
      loadInvoice(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    // Check if we should open payment dialog from URL
    const action = searchParams?.get('action');
    if (action === 'payment' && invoice) {
      setShowPaymentDialog(true);
    }
  }, [searchParams, invoice]);

  const loadInvoice = async (id: string) => {
    try {
      setLoading(true);
      const data = await getInvoiceById(id);
      setInvoice(data);
      // Set default payment amount to remaining balance
      if (data) {
        setPaymentAmount((data.total - data.amountPaid).toFixed(2));
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    try {
      await deleteInvoice(invoice.id);
      alert('Invoice deleted');
      router.push('/admin/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const handleMarkAsSent = async () => {
    if (!invoice) return;

    try {
      await markInvoiceAsSent(invoice.id);
      await loadInvoice(invoice.id);
      alert('Invoice marked as sent');
    } catch (error) {
      console.error('Error marking invoice as sent:', error);
      alert('Failed to mark invoice as sent');
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;

    const confirm = window.confirm('Are you sure you want to cancel this invoice?');
    if (!confirm) return;

    try {
      await cancelInvoice(invoice.id);
      await loadInvoice(invoice.id);
      alert('Invoice cancelled');
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      alert('Failed to cancel invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice || !user) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const remainingBalance = invoice.total - invoice.amountPaid;
    if (amount > remainingBalance) {
      alert(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`);
      return;
    }

    try {
      setRecordingPayment(true);

      const paymentInfo: PaymentInfo = {
        amount,
        paidAt: Timestamp.fromDate(new Date(paymentDate)),
        paymentMethod: paymentMethod,
      };

      if (paymentNotes) {
        paymentInfo.transactionNote = paymentNotes;
      }

      await recordPayment(invoice.id, user.uid, paymentInfo);
      await loadInvoice(invoice.id);
      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentMethod('other');
      setPaymentNotes('');
      alert('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null | undefined) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as Date | string);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isOverdue = () => {
    if (!invoice || invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      return false;
    }
    if (!invoice.dueDate) return false;
    const dueDate = invoice.dueDate instanceof Date ? invoice.dueDate : invoice.dueDate.toDate?.();
    if (!dueDate) return false;
    return dueDate < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <Link href="/admin/invoices">
          <Button variant="primary" className="mt-4">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const remainingBalance = invoice.total - invoice.amountPaid;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <Badge variant={STATUS_COLORS[invoice.status]}>
              {invoice.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {isOverdue() && (
              <Badge variant="error">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1 inline" />
                OVERDUE
              </Badge>
            )}
          </div>
          {invoice.title && <p className="text-lg text-gray-600">{invoice.title}</p>}
        </div>
        <div className="flex gap-2">
          {invoice.status === InvoiceStatus.DRAFT && (
            <>
              <Link href={`/admin/invoices/${invoice.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={handleMarkAsSent}>
                <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                Mark as Sent
              </Button>
            </>
          )}
          {invoice.status !== InvoiceStatus.PAID &&
            invoice.status !== InvoiceStatus.CANCELLED && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPaymentDialog(true)}
              >
                <CreditCardIcon className="w-4 h-4 mr-1" />
                Record Payment
              </Button>
            )}
        </div>
      </div>

      {/* Payment Status */}
      {invoice.status !== InvoiceStatus.DRAFT && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(invoice.amountPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Balance Due</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(remainingBalance)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Client Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{invoice.client.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{invoice.client.email}</p>
            </div>
            {invoice.client.company && (
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium text-gray-900">{invoice.client.company}</p>
              </div>
            )}
            {invoice.client.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{invoice.client.phone}</p>
              </div>
            )}
            {invoice.client.address && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {invoice.client.address.street}
                  <br />
                  {invoice.client.address.city}, {invoice.client.address.state}{' '}
                  {invoice.client.address.zipCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Description */}
      {invoice.description && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.description}</p>
          </div>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Description</th>
                <th className="text-center py-2 text-sm font-medium text-gray-500">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">Rate</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-gray-900">{item.description}</td>
                  <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700">{formatCurrency(item.rate)}</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount && invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount {invoice.discount.reason && `(${invoice.discount.reason})`}:
                </span>
                <span className="font-medium">-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            {invoice.taxConfig && invoice.taxAmount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>{invoice.taxConfig.taxLabel}:</span>
                <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
            <div className="space-y-3">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(payment.paidAt)} • {payment.paymentMethod}
                          {payment.cardBrand && payment.cardLast4 && (
                            <> • {payment.cardBrand.charAt(0).toUpperCase() + payment.cardBrand.slice(1)} ••••{payment.cardLast4}</>
                          )}
                          {payment.stripeChargeId && ` • ${payment.stripeChargeId}`}
                        </p>
                        {payment.transactionNote && (
                          <p className="text-sm text-gray-600 mt-1">{payment.transactionNote}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Terms & Notes */}
      {(invoice.terms || invoice.notes) && (
        <Card>
          <div className="p-6 space-y-4">
            {invoice.terms && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{invoice.terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Internal Notes</h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm italic">{invoice.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Issue Date</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.sentAt && (
              <div>
                <p className="text-gray-500">Sent</p>
                <p className="font-medium text-gray-900">{formatDate(invoice.sentAt)}</p>
              </div>
            )}
            {invoice.viewedAt && (
              <div>
                <p className="text-gray-500">Viewed</p>
                <p className="font-medium text-gray-900">{formatDate(invoice.viewedAt)}</p>
              </div>
            )}
            {invoice.paidAt && (
              <div>
                <p className="text-gray-500">Paid</p>
                <p className="font-medium text-gray-900">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
            {invoice.proposalId && (
              <div className="col-span-2">
                <p className="text-gray-500">Original Proposal</p>
                <Link href={`/admin/proposals/${invoice.proposalId}`}>
                  <span className="font-medium text-primary-600 hover:text-primary-700">
                    View Proposal
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-between pb-8">
        <div className="flex gap-2">
          {invoice.status !== InvoiceStatus.CANCELLED &&
            invoice.status !== InvoiceStatus.PAID && (
              <Button variant="danger" onClick={handleCancel}>
                <XMarkIcon className="w-4 h-4 mr-1" />
                Cancel Invoice
              </Button>
            )}
        </div>
        <div className="flex gap-2">
          <Link href="/admin/invoices">
            <Button variant="ghost">Back to List</Button>
          </Link>
          {invoice.status !== InvoiceStatus.PAID && (
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Record Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Remaining balance: {formatCurrency(remainingBalance)}
                </p>
              </div>
              <Input
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Additional payment details..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={recordingPayment}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={recordingPayment}>
                  Record Payment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Invoice</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
