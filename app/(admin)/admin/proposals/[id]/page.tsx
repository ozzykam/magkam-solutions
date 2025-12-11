'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Proposal, ProposalStatus } from '@/types/invoice';
import {
  getProposalById,
  deleteProposal,
  acceptProposal,
  rejectProposal,
  convertProposalToInvoice,
} from '@/services/invoice-service';
import { useAuth } from '@/lib/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/solid';

const STATUS_COLORS: Record<ProposalStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [ProposalStatus.DRAFT]: 'default',
  [ProposalStatus.SENT]: 'info',
  [ProposalStatus.VIEWED]: 'warning',
  [ProposalStatus.ACCEPTED]: 'success',
  [ProposalStatus.REJECTED]: 'error',
  [ProposalStatus.EXPIRED]: 'error',
  [ProposalStatus.CONVERTED]: 'success',
};

export default function ViewProposalPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProposal(params.id as string);
    }
  }, [params.id]);

  const loadProposal = async (id: string) => {
    try {
      setLoading(true);
      const data = await getProposalById(id);
      setProposal(data);
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!proposal || !user) return;

    try {
      setConverting(true);
      const invoiceId = await convertProposalToInvoice(proposal.id, user.uid);
      alert('Proposal converted to invoice!');
      router.push(`/admin/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error converting proposal:', error);
      alert('Failed to convert proposal to invoice');
    } finally {
      setConverting(false);
      setShowConvertDialog(false);
    }
  };

  const handleDelete = async () => {
    if (!proposal) return;

    try {
      await deleteProposal(proposal.id);
      alert('Proposal deleted');
      router.push('/admin/proposals');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('Failed to delete proposal');
    }
  };

  const handleAccept = async () => {
    if (!proposal) return;

    try {
      await acceptProposal(proposal.id);
      await loadProposal(proposal.id);
      alert('Proposal marked as accepted');
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert('Failed to accept proposal');
    }
  };

  const handleReject = async () => {
    if (!proposal) return;

    try {
      await rejectProposal(proposal.id);
      await loadProposal(proposal.id);
      alert('Proposal marked as rejected');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      alert('Failed to reject proposal');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Proposal not found</p>
        <Link href="/admin/proposals">
          <Button variant="primary" className="mt-4">
            Back to Proposals
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{proposal.proposalNumber}</h1>
            <Badge variant={STATUS_COLORS[proposal.status]}>
              {proposal.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          {proposal.title && <p className="text-lg text-gray-600">{proposal.title}</p>}
        </div>
        <div className="flex gap-2">
          {proposal.status === ProposalStatus.DRAFT && (
            <Link href={`/admin/proposals/${proposal.id}/edit`}>
              <Button variant="secondary" size="sm">
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
          {proposal.status === ProposalStatus.ACCEPTED && !proposal.convertedToInvoiceId && (
            <Button variant="primary" size="sm" onClick={() => setShowConvertDialog(true)}>
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              Convert to Invoice
            </Button>
          )}
          {proposal.status === ProposalStatus.CONVERTED && proposal.convertedToInvoiceId && (
            <Link href={`/admin/invoices/${proposal.convertedToInvoiceId}`}>
              <Button variant="ghost" size="sm">
                View Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{proposal.client.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{proposal.client.email}</p>
            </div>
            {proposal.client.company && (
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium text-gray-900">{proposal.client.company}</p>
              </div>
            )}
            {proposal.client.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{proposal.client.phone}</p>
              </div>
            )}
            {proposal.client.address && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {proposal.client.address.street}
                  <br />
                  {proposal.client.address.city}, {proposal.client.address.state}{' '}
                  {proposal.client.address.zipCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Description */}
      {proposal.description && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
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
              {proposal.lineItems.map((item) => (
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
              <span className="font-medium">{formatCurrency(proposal.subtotal)}</span>
            </div>
            {proposal.discount && proposal.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount {proposal.discount.reason && `(${proposal.discount.reason})`}:
                </span>
                <span className="font-medium">-{formatCurrency(proposal.discountAmount)}</span>
              </div>
            )}
            {proposal.taxConfig && proposal.taxAmount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>{proposal.taxConfig.taxLabel}:</span>
                <span className="font-medium">{formatCurrency(proposal.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(proposal.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Terms & Notes */}
      {(proposal.terms || proposal.notes) && (
        <Card>
          <div className="p-6 space-y-4">
            {proposal.terms && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{proposal.terms}</p>
              </div>
            )}
            {proposal.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Internal Notes</h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm italic">{proposal.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{formatDate(proposal.createdAt)}</p>
            </div>
            {proposal.sentAt && (
              <div>
                <p className="text-gray-500">Sent</p>
                <p className="font-medium text-gray-900">{formatDate(proposal.sentAt)}</p>
              </div>
            )}
            {proposal.viewedAt && (
              <div>
                <p className="text-gray-500">Viewed</p>
                <p className="font-medium text-gray-900">{formatDate(proposal.viewedAt)}</p>
              </div>
            )}
            {proposal.validUntil && (
              <div>
                <p className="text-gray-500">Valid Until</p>
                <p className="font-medium text-gray-900">{formatDate(proposal.validUntil)}</p>
              </div>
            )}
            {proposal.respondedAt && (
              <div>
                <p className="text-gray-500">Responded</p>
                <p className="font-medium text-gray-900">{formatDate(proposal.respondedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-between pb-8">
        <div className="flex gap-2">
          {(proposal.status === ProposalStatus.SENT || proposal.status === ProposalStatus.VIEWED) && (
            <>
              <Button variant="primary" onClick={handleAccept}>
                <CheckIcon className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button variant="danger" onClick={handleReject}>
                <XMarkIcon className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/admin/proposals">
            <Button variant="ghost">Back to List</Button>
          </Link>
          {proposal.status !== ProposalStatus.CONVERTED && (
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Convert to Invoice Dialog */}
      {showConvertDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Convert to Invoice</h3>
            <p className="text-gray-600 mb-6">
              This will create an invoice from this proposal. The proposal will be marked as converted.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowConvertDialog(false)} disabled={converting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConvertToInvoice} loading={converting}>
                Convert
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Proposal</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this proposal? This action cannot be undone.
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
