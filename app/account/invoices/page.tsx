'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { getInvoices } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'info',
  [InvoiceStatus.VIEWED]: 'warning',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.PARTIALLY_PAID]: 'warning',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.CANCELLED]: 'error',
};

export default function CustomerInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const data = await getInvoices({ clientEmail: user.email });
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      return false;
    }
    if (!invoice.dueDate) return false;
    const dueDate = invoice.dueDate.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate.toMillis());
    return dueDate < new Date();
  };

  const calculateStats = () => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + inv.total, 0);
    const unpaidAmount = invoices
      .filter(inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED)
      .reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0);
    const overdueCount = invoices.filter(inv => isOverdue(inv)).length;

    return { totalAmount, paidAmount, unpaidAmount, overdueCount };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-gray-600 mt-1">View and manage your invoices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Outstanding</div>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.unpaidAmount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
        </Card>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-2">No invoices found</div>
          <p className="text-sm text-gray-500">
            You don't have any invoices yet
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      <Badge variant={STATUS_COLORS[invoice.status]}>
                        {invoice.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {isOverdue(invoice) && (
                        <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          Overdue
                        </span>
                      )}
                    </div>
                    {invoice.title && (
                      <p className="text-gray-600 mb-3">{invoice.title}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Paid:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {formatCurrency(invoice.amountPaid)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <span className="ml-2 font-medium text-gray-700">
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Balance:</span>
                        <span className="ml-2 font-semibold text-orange-600">
                          {formatCurrency(invoice.total - invoice.amountPaid)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/account/invoices/${invoice.id}`}>
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
