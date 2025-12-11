'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Proposal, ProposalStatus } from '@/types/invoice';
import { getProposals } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { EyeIcon, ClockIcon } from '@heroicons/react/24/solid';

const STATUS_COLORS: Record<ProposalStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [ProposalStatus.DRAFT]: 'default',
  [ProposalStatus.SENT]: 'info',
  [ProposalStatus.VIEWED]: 'warning',
  [ProposalStatus.ACCEPTED]: 'success',
  [ProposalStatus.REJECTED]: 'error',
  [ProposalStatus.EXPIRED]: 'error',
  [ProposalStatus.CONVERTED]: 'success',
};

export default function CustomerProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadProposals();
    }
  }, [user]);

  const loadProposals = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const data = await getProposals({ clientEmail: user.email });
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
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

  const isExpiringSoon = (proposal: Proposal) => {
    if (!proposal.validUntil || proposal.status !== ProposalStatus.SENT && proposal.status !== ProposalStatus.VIEWED) {
      return false;
    }
    const validUntil = typeof proposal.validUntil === 'object' && 'toDate' in proposal.validUntil 
      ? (proposal.validUntil as any).toDate() 
      : new Date(proposal.validUntil as any);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return validUntil <= threeDaysFromNow && validUntil >= new Date();
  };

  const calculateStats = () => {
    const totalCount = proposals.length;
    const acceptedCount = proposals.filter(p => p.status === ProposalStatus.ACCEPTED).length;
    const pendingCount = proposals.filter(p =>
      p.status === ProposalStatus.SENT || p.status === ProposalStatus.VIEWED
    ).length;
    const totalValue = proposals.reduce((sum, p) => sum + p.total, 0);

    return { totalCount, acceptedCount, pendingCount, totalValue };
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
        <h1 className="text-3xl font-bold text-gray-900">My Proposals</h1>
        <p className="text-gray-600 mt-1">View and respond to proposals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Proposals</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Accepted</div>
          <div className="text-2xl font-bold text-green-600">{stats.acceptedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</div>
        </Card>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-2">No proposals found</div>
          <p className="text-sm text-gray-500">
            You don't have any proposals yet
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {proposal.proposalNumber}
                      </h3>
                      <Badge variant={STATUS_COLORS[proposal.status]}>
                        {proposal.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {isExpiringSoon(proposal) && (
                        <span className="flex items-center gap-1 text-sm text-orange-600 font-medium">
                          <ClockIcon className="w-4 h-4" />
                          Expires Soon
                        </span>
                      )}
                    </div>
                    {proposal.title && (
                      <p className="text-gray-600 mb-3">{proposal.title}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {formatCurrency(proposal.total)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 font-medium text-gray-700">
                          {formatDate(proposal.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Valid Until:</span>
                        <span className="ml-2 font-medium text-gray-700">
                          {formatDate(proposal.validUntil)}
                        </span>
                      </div>
                      {proposal.convertedToInvoiceId && (
                        <div>
                          <span className="text-gray-500">Invoice:</span>
                          <Link href={`/account/invoices/${proposal.convertedToInvoiceId}`}>
                            <span className="ml-2 font-medium text-primary-600 hover:text-primary-700 underline">
                              View Invoice
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                    {(proposal.status === ProposalStatus.SENT || proposal.status === ProposalStatus.VIEWED) && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Action Required:</strong> This proposal requires your response.
                          Please review and accept or decline.
                        </p>
                      </div>
                    )}
                  </div>
                  <Link href={`/account/proposals/${proposal.id}`}>
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
