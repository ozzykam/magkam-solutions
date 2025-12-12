'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Invoice, PaymentInfo } from '@/types/invoice';
import { getInvoices } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CreditCardIcon, DocumentTextIcon } from '@heroicons/react/24/solid';

interface PaymentWithInvoice {
  payment: PaymentInfo;
  invoice: {
    id: string;
    invoiceNumber: string;
    title?: string;
  };
}

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPaymentHistory = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const invoices = await getInvoices({ clientEmail: user.email });

      // Extract all payments from all invoices
      const allPayments: PaymentWithInvoice[] = [];
      invoices.forEach((invoice) => {
        if (invoice.payments && invoice.payments.length > 0) {
          invoice.payments.forEach((payment) => {
            allPayments.push({
              payment,
              invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                title: invoice.title,
              },
            });
          });
        }
      });

      // Sort by payment date (newest first)
      allPayments.sort((a, b) => {
        const dateA = a.payment.paidAt.toDate ? a.payment.paidAt.toDate() : new Date(a.payment.paidAt.toMillis());
        const dateB = b.payment.paidAt.toDate ? b.payment.paidAt.toDate() : new Date(b.payment.paidAt.toMillis());
        return dateB.getTime() - dateA.getTime();
      });

      setPayments(allPayments);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      loadPaymentHistory();
    }
  }, [user, loadPaymentHistory]);

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

  const calculateTotalPaid = () => {
    return payments.reduce((sum, p) => sum + p.payment.amount, 0);
  };

  const groupPaymentsByYear = () => {
    const grouped: Record<number, PaymentWithInvoice[]> = {};
    payments.forEach((payment) => {
      const date = payment.payment.paidAt.toDate
        ? payment.payment.paidAt.toDate()
        : new Date(payment.payment.paidAt.toMillis());
      const year = date.getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(payment);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalPaid = calculateTotalPaid();
  const paymentsByYear = groupPaymentsByYear();
  const years = Object.keys(paymentsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-600 mt-1">View all your payment transactions</p>
      </div>

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Paid (All Time)</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Total Payments</p>
            <p className="text-3xl font-bold text-gray-900">{payments.length}</p>
          </div>
        </div>
      </Card>

      {/* Payment List */}
      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCardIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
          <p className="text-gray-600">
            You haven&apos;t made any payments yet
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">{year}</h2>
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm text-gray-500">
                  {paymentsByYear[year].length} payment{paymentsByYear[year].length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {paymentsByYear[year].map((item, index) => (
                  <Card key={index}>
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-green-100 rounded-lg">
                            <CreditCardIcon className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Payment for {item.invoice.invoiceNumber}
                                </h3>
                                {item.invoice.title && (
                                  <p className="text-sm text-gray-600 mt-1">{item.invoice.title}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  {formatCurrency(item.payment.amount)}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {formatDate(item.payment.paidAt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Method:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {item.payment.paymentMethod}
                                </span>
                              </div>
                              {item.payment.stripeChargeId && (
                                <div>
                                  <span className="text-gray-500">Transaction ID:</span>
                                  <span className="ml-2 font-medium text-gray-900 font-mono text-xs">
                                    {item.payment.stripeChargeId}
                                  </span>
                                </div>
                              )}
                            </div>
                            {item.payment.transactionNote && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">{item.payment.transactionNote}</p>
                              </div>
                            )}
                            <div className="mt-3">
                              <Link href={`/account/invoices/${item.invoice.id}`}>
                                <button className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                                  <DocumentTextIcon className="w-4 h-4" />
                                  View Invoice
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
