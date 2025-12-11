'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Invoice,
  InvoiceStatus,
  calculateProcessingFee,
  calculateTotalWithProcessingFee,
  DEFAULT_PROCESSING_FEE
} from '@/types/invoice';
import { getInvoiceById, markInvoiceAsViewed } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  CreditCardIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  BanknotesIcon,
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

export default function CustomerInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (params.id && user?.email) {
      loadInvoice(params.id as string);
    }
  }, [params.id, user]);

  const loadInvoice = async (id: string) => {
    try {
      setLoading(true);
      const data = await getInvoiceById(id);

      // Verify the invoice belongs to this user
      if (data?.client.email.toLowerCase() !== user?.email?.toLowerCase()) {
        alert('You do not have permission to view this invoice');
        router.push('/account/invoices');
        return;
      }

      setInvoice(data);

      // Mark as viewed if it's sent and not yet viewed
      if (data?.status === InvoiceStatus.SENT) {
        await markInvoiceAsViewed(id);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Failed to load invoice');
      router.push('/account/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!invoice || !user?.email) return;

    try {
      setProcessing(true);

      // Calculate total with processing fee
      const processingFeeConfig = invoice.processingFeeConfig || DEFAULT_PROCESSING_FEE;
      const processingFee = calculateProcessingFee(invoice.amountDue, processingFeeConfig);
      const totalWithFee = calculateTotalWithProcessingFee(invoice.amountDue, processingFeeConfig);

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          userEmail: user.email,
          amount: totalWithFee, // Send total including processing fee
          processingFee: processingFee,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      alert(error.message || 'Failed to initiate payment. Please try again.');
      setProcessing(false);
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
    const dueDate = invoice.dueDate.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate.toMillis());
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
        <Link href="/account/invoices">
          <Button variant="primary" className="mt-4">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const remainingBalance = invoice.total - invoice.amountPaid;
  const canPay = invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED && remainingBalance > 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back button */}
      <Link href="/account/invoices">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Invoices
        </Button>
      </Link>

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
        {canPay && (
          <Button variant="primary" onClick={handlePayNow} loading={processing}>
            <CreditCardIcon className="w-4 h-4 mr-1" />
            Pay Now
          </Button>
        )}
      </div>

      {/* Payment Status */}
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

      {/* Payment with Processing Fee */}
      {canPay && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pay Now with Credit Card</h2>
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Invoice Amount:</span>
                <span className="font-medium">{formatCurrency(remainingBalance)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Processing Fee (3%):</span>
                <span className="font-medium">
                  {formatCurrency(calculateProcessingFee(remainingBalance, invoice.processingFeeConfig || DEFAULT_PROCESSING_FEE))}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Total to Pay:</span>
                <span>
                  {formatCurrency(calculateTotalWithProcessingFee(remainingBalance, invoice.processingFeeConfig || DEFAULT_PROCESSING_FEE))}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handlePayNow}
            loading={processing}
          >
            <CreditCardIcon className="w-5 h-5 mr-2" />
            Pay {formatCurrency(calculateTotalWithProcessingFee(remainingBalance, invoice.processingFeeConfig || DEFAULT_PROCESSING_FEE))} with Card
          </Button>
          <p className="text-sm text-gray-600 mt-3 text-center">
            Secure payment powered by Stripe
          </p>
        </Card>
      )}

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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
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

      {/* Payment Terms */}
      {invoice.terms && (
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment Terms</h3>
            <p className="text-gray-700 text-sm">{invoice.terms}</p>
          </div>
        </Card>
      )}

      {/* Terms & Conditions */}
      {invoice.terms && (
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{invoice.terms}</p>
          </div>
        </Card>
      )}

      {/* Invoice Details */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Issue Date</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Pay Now CTA */}
      {canPay && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Balance Due: {formatCurrency(remainingBalance)}
            </h3>
            <p className="text-gray-600 mb-4">
              {isOverdue() ? 'This invoice is overdue. ' : ''}
              Pay securely online with credit card or ACH.
            </p>
            <Button variant="primary" size="lg" onClick={handlePayNow} loading={processing}>
              <CreditCardIcon className="w-5 h-5 mr-2" />
              Pay {formatCurrency(remainingBalance)} Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
