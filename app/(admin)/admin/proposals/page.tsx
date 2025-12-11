'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Proposal, ProposalStatus } from '@/types/invoice';
import { getProposals, deleteProposal, markProposalAsSent } from '@/services/invoice-service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PencilIcon, TrashIcon, EyeIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

const STATUS_COLORS: Record<ProposalStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [ProposalStatus.DRAFT]: 'default',
  [ProposalStatus.SENT]: 'info',
  [ProposalStatus.VIEWED]: 'warning',
  [ProposalStatus.ACCEPTED]: 'success',
  [ProposalStatus.REJECTED]: 'error',
  [ProposalStatus.EXPIRED]: 'error',
  [ProposalStatus.CONVERTED]: 'success',
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'all'>('all');

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await getProposals();
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProposalsList = useCallback(() => {
    let filtered = proposals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.client.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    setFilteredProposals(filtered);
  }, [proposals, searchTerm, filterStatus]);

  useEffect(() => {
    filterProposalsList();
  }, [filterProposalsList]);

  const openDeleteDialog = (proposalId: string) => {
    setProposalToDelete(proposalId);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setProposalToDelete(null);
  };

  const handleDelete = async () => {
    if (!proposalToDelete) return;

    try {
      setDeleting(true);
      await deleteProposal(proposalToDelete);
      await loadProposals();
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('Failed to delete proposal');
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkAsSent = async (proposalId: string) => {
    try {
      setSending(true);
      await markProposalAsSent(proposalId);
      await loadProposals();
      alert('Proposal marked as sent!');
    } catch (error) {
      console.error('Error marking proposal as sent:', error);
      alert('Failed to mark proposal as sent');
    } finally {
      setSending(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-1">Manage and track your proposals</p>
        </div>
        <Link href="/admin/proposals/new">
          <Button variant="primary">Create Proposal</Button>
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
              onChange={(e) => setFilterStatus(e.target.value as ProposalStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value={ProposalStatus.DRAFT}>Draft</option>
              <option value={ProposalStatus.SENT}>Sent</option>
              <option value={ProposalStatus.VIEWED}>Viewed</option>
              <option value={ProposalStatus.ACCEPTED}>Accepted</option>
              <option value={ProposalStatus.REJECTED}>Rejected</option>
              <option value={ProposalStatus.EXPIRED}>Expired</option>
              <option value={ProposalStatus.CONVERTED}>Converted</option>
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
          <div className="text-sm text-gray-600">Total Proposals</div>
          <div className="text-2xl font-bold text-gray-900">{proposals.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Accepted</div>
          <div className="text-2xl font-bold text-green-600">
            {proposals.filter((p) => p.status === ProposalStatus.ACCEPTED).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {proposals.filter((p) => p.status === ProposalStatus.SENT || p.status === ProposalStatus.VIEWED).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Converted</div>
          <div className="text-2xl font-bold text-blue-600">
            {proposals.filter((p) => p.status === ProposalStatus.CONVERTED).length}
          </div>
        </Card>
      </div>

      {/* Proposals Table */}
      {filteredProposals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-2">No proposals found</div>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first proposal to get started'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link href="/admin/proposals/new">
              <Button variant="primary">Create Proposal</Button>
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
                    Proposal #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{proposal.proposalNumber}</div>
                      {proposal.title && <div className="text-sm text-gray-500">{proposal.title}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{proposal.client.name}</div>
                      <div className="text-sm text-gray-500">{proposal.client.email}</div>
                      {proposal.client.company && <div className="text-sm text-gray-500">{proposal.client.company}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{formatCurrency(proposal.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={STATUS_COLORS[proposal.status]}>
                        {proposal.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(proposal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(proposal.validUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/proposals/${proposal.id}`}>
                          <button className="text-gray-600 hover:text-gray-900" title="View">
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </Link>
                        {proposal.status === ProposalStatus.DRAFT && (
                          <Link href={`/admin/proposals/${proposal.id}/edit`}>
                            <button className="text-blue-600 hover:text-blue-900" title="Edit">
                              <PencilIcon className="w-5 h-5" />
                            </button>
                          </Link>
                        )}
                        {proposal.status === ProposalStatus.DRAFT && (
                          <button
                            onClick={() => handleMarkAsSent(proposal.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Sent"
                            disabled={sending}
                          >
                            <PaperAirplaneIcon className="w-5 h-5" />
                          </button>
                        )}
                        {proposal.status !== ProposalStatus.CONVERTED && (
                          <button
                            onClick={() => openDeleteDialog(proposal.id)}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Proposal</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this proposal? This action cannot be undone.
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
