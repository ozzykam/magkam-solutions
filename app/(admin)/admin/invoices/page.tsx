'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { getInvoices, deleteInvoice } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoicesList = useCallback(() => {
    let filtered = invoices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.client.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((inv) => inv.status === filterStatus);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, filterStatus]);

  useEffect(() => {
    filterInvoicesList();
  }, [filterInvoicesList]);

  const openDeleteDialog = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setInvoiceToDelete(null);
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      setDeleting(true);
      await deleteInvoice(invoiceToDelete);
      await loadInvoices();
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    } finally {
      setDeleting(false);
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
    const partiallyPaidAmount = invoices
      .filter(inv => inv.status === InvoiceStatus.PARTIALLY_PAID)
      .reduce((sum, inv) => sum + inv.amountPaid, 0);
    const unpaidAmount = invoices
      .filter(inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED)
      .reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0);
    const overdueCount = invoices.filter(inv => isOverdue(inv)).length;

    return {
      totalAmount,
      paidAmount: paidAmount + partiallyPaidAmount,
      unpaidAmount,
      overdueCount,
    };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track your invoices</p>
        </div>
        <Link href="/admin/invoices/new">
          <Button variant="primary">Create Invoice</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search"
            placeholder="Search by number, client, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value={InvoiceStatus.DRAFT}>Draft</option>
              <option value={InvoiceStatus.SENT}>Sent</option>
              <option value={InvoiceStatus.VIEWED}>Viewed</option>
              <option value={InvoiceStatus.PAID}>Paid</option>
              <option value={InvoiceStatus.PARTIALLY_PAID}>Partially Paid</option>
              <option value={InvoiceStatus.OVERDUE}>Overdue</option>
              <option value={InvoiceStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              fullWidth
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Amount</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Unpaid</div>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.unpaidAmount)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
        </Card>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-2">No invoices found</div>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first invoice to get started'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link href="/admin/invoices/new">
              <Button variant="primary">Create Invoice</Button>
            </Link>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                          {invoice.title && <div className="text-sm text-gray-500">{invoice.title}</div>}
                        </div>
                        {isOverdue(invoice) && (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" title="Overdue" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{invoice.client.name}</div>
                      <div className="text-sm text-gray-500">{invoice.client.email}</div>
                      {invoice.client.company && <div className="text-sm text-gray-500">{invoice.client.company}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-700">{formatCurrency(invoice.amountPaid)}</div>
                      {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
                        <div className="text-xs text-gray-500">
                          {formatCurrency(invoice.total - invoice.amountPaid)} due
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={STATUS_COLORS[invoice.status]}>
                        {invoice.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/invoices/${invoice.id}`}>
                          <button className="text-gray-600 hover:text-gray-900" title="View">
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </Link>
                        {invoice.status === InvoiceStatus.DRAFT && (
                          <Link href={`/admin/invoices/${invoice.id}/edit`}>
                            <button className="text-blue-600 hover:text-blue-900" title="Edit">
                              <PencilIcon className="w-5 h-5" />
                            </button>
                          </Link>
                        )}
                        {invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED && (
                          <Link href={`/admin/invoices/${invoice.id}?action=payment`}>
                            <button className="text-green-600 hover:text-green-900" title="Record Payment">
                              <CreditCardIcon className="w-5 h-5" />
                            </button>
                          </Link>
                        )}
                        {invoice.status !== InvoiceStatus.PAID && (
                          <button
                            onClick={() => openDeleteDialog(invoice.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Invoice</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={closeDeleteDialog} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
