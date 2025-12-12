'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Proposal, ProposalStatus } from '@/types/invoice';
import {
  getProposalById,
  markProposalAsViewed,
  acceptProposal,
  rejectProposal,
} from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';

const STATUS_COLORS: Record<ProposalStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [ProposalStatus.DRAFT]: 'default',
  [ProposalStatus.SENT]: 'info',
  [ProposalStatus.VIEWED]: 'warning',
  [ProposalStatus.ACCEPTED]: 'success',
  [ProposalStatus.REJECTED]: 'error',
  [ProposalStatus.EXPIRED]: 'error',
  [ProposalStatus.CONVERTED]: 'success',
};

export default function CustomerProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadProposal = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const data = await getProposalById(id);

      // Verify the proposal belongs to this user
      if (data?.client.email.toLowerCase() !== user?.email?.toLowerCase()) {
        alert('You do not have permission to view this proposal');
        router.push('/account/proposals');
        return;
      }

      setProposal(data);

      // Mark as viewed if it's sent and not yet viewed
      if (data?.status === ProposalStatus.SENT) {
        await markProposalAsViewed(id);
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
      alert('Failed to load proposal');
      router.push('/account/proposals');
    } finally {
      setLoading(false);
    }
  }, [router, user]);

  useEffect(() => {
    if (params.id && user?.email) {
      loadProposal(params.id as string);
    }
  }, [params.id, user, loadProposal]);

  const handleAccept = async () => {
    if (!proposal) return;

    const confirm = window.confirm(
      'Are you sure you want to accept this proposal? This action cannot be undone.'
    );
    if (!confirm) return;

    try {
      setProcessing(true);
      await acceptProposal(proposal.id);
      await loadProposal(proposal.id);
      alert('Proposal accepted successfully!');
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert('Failed to accept proposal');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;

    const confirm = window.confirm(
      'Are you sure you want to reject this proposal? This action cannot be undone.'
    );
    if (!confirm) return;

    try {
      setProcessing(true);
      await rejectProposal(proposal.id);
      await loadProposal(proposal.id);
      alert('Proposal rejected');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      alert('Failed to reject proposal');
    } finally {
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

  const isExpired = () => {
    if (!proposal || !proposal.validUntil) return false;
    const validUntil = proposal.validUntil.toDate ? proposal.validUntil.toDate() : new Date(proposal.validUntil.toMillis());
    return validUntil < new Date();
  };

  const isExpiringSoon = () => {
    if (!proposal || !proposal.validUntil) return false;
    const validUntil = proposal.validUntil.toDate ? proposal.validUntil.toDate() : new Date(proposal.validUntil.toMillis());
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return validUntil <= threeDaysFromNow && validUntil >= new Date();
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
        <Link href="/account/proposals">
          <Button variant="primary" className="mt-4">
            Back to Proposals
          </Button>
        </Link>
      </div>
    );
  }

  const canRespond = proposal.status === ProposalStatus.SENT || proposal.status === ProposalStatus.VIEWED;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back button */}
      <Link href="/account/proposals">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Proposals
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{proposal.proposalNumber}</h1>
            <Badge variant={STATUS_COLORS[proposal.status]}>
              {proposal.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {isExpiringSoon() && !isExpired() && (
              <Badge variant="warning">
                <ClockIcon className="w-4 h-4 mr-1 inline" />
                EXPIRES SOON
              </Badge>
            )}
          </div>
          {proposal.title && <p className="text-lg text-gray-600">{proposal.title}</p>}
        </div>
        {canRespond && !isExpired() && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={handleReject} disabled={processing}>
              <XMarkIcon className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button variant="primary" onClick={handleAccept} loading={processing}>
              <CheckIcon className="w-4 h-4 mr-1" />
              Accept
            </Button>
          </div>
        )}
      </div>

      {/* Action Required Banner */}
      {canRespond && !isExpired() && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Action Required</h3>
            <p className="text-blue-800 mb-4">
              This proposal requires your response. Please review the details below and choose to
              accept or reject the proposal.
            </p>
            {isExpiringSoon() && (
              <p className="text-blue-800 font-semibold">
                ⚠️ This proposal expires on {formatDate(proposal.validUntil)}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Expired Banner */}
      {isExpired() && (
        <Card className="bg-red-50 border-red-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Proposal Expired</h3>
            <p className="text-red-800">
              This proposal expired on {formatDate(proposal.validUntil)}. Please contact us if
              you would still like to proceed.
            </p>
          </div>
        </Card>
      )}

      {/* Converted to Invoice */}
      {proposal.status === ProposalStatus.CONVERTED && proposal.convertedToInvoiceId && (
        <Card className="bg-green-50 border-green-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Converted to Invoice</h3>
            <p className="text-green-800 mb-3">
              This proposal has been accepted and converted to an invoice.
            </p>
            <Link href={`/account/invoices/${proposal.convertedToInvoiceId}`}>
              <Button variant="primary">View Invoice</Button>
            </Link>
          </div>
        </Card>
      )}

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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items & Pricing</h2>
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

      {/* Terms & Conditions */}
      {proposal.terms && (
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{proposal.terms}</p>
          </div>
        </Card>
      )}

      {/* Proposal Details */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{formatDate(proposal.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Valid Until</p>
              <p className="font-medium text-gray-900">{formatDate(proposal.validUntil)}</p>
            </div>
            {proposal.sentAt && (
              <div>
                <p className="text-gray-500">Sent</p>
                <p className="font-medium text-gray-900">{formatDate(proposal.sentAt)}</p>
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

      {/* Accept/Reject CTA */}
      {canRespond && !isExpired() && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to proceed?
            </h3>
            <p className="text-gray-600 mb-4">
              Review the proposal details above and choose your response.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleReject} disabled={processing}>
                <XMarkIcon className="w-5 h-5 mr-2" />
                Reject Proposal
              </Button>
              <Button variant="primary" onClick={handleAccept} loading={processing}>
                <CheckIcon className="w-5 h-5 mr-2" />
                Accept Proposal
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
