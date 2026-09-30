'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '@/services/client-service';
import {
  Client,
  ClientStatus,
  CreateClientData,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
} from '@/types/client';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ArrowRightCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

export default function ClientsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formStatus, setFormStatus] = useState<ClientStatus>(ClientStatus.ACTIVE);
  const [formValue, setFormValue] = useState('');
  const [isSavingForm, setIsSavingForm] = useState(false);

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch {
      showToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeClients = clients.filter(c => c.status === ClientStatus.ACTIVE);
  const totalEstimatedValue = clients.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
  const convertedCount = clients.filter(c => c.sourceProspectId).length;

  const openFormModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormName(client.name);
      setFormEmail(client.email);
      setFormPhone(client.phone || '');
      setFormCompany(client.company || '');
      setFormWebsite(client.website || '');
      setFormStatus(client.status);
      setFormValue(client.estimatedValue ? String(client.estimatedValue) : '');
    } else {
      setEditingClient(null);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormCompany('');
      setFormWebsite('');
      setFormStatus(ClientStatus.ACTIVE);
      setFormValue('');
    }
    setShowFormModal(true);
  };

  const handleSaveForm = async () => {
    if (!user || !formName.trim() || !formEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    setIsSavingForm(true);
    try {
      const data: CreateClientData = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        company: formCompany.trim() || undefined,
        website: formWebsite.trim() || undefined,
        status: formStatus,
        estimatedValue: formValue ? parseFloat(formValue) : undefined,
      };

      if (editingClient) {
        await updateClient(editingClient.id, data);
        showToast('Client updated', 'success');
      } else {
        await createClient(data, user.uid);
        showToast('Client added', 'success');
      }
      setShowFormModal(false);
      loadClients();
    } catch {
      showToast('Failed to save client', 'error');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      showToast('Client deleted', 'success');
      setClientToDelete(null);
      loadClients();
    } catch {
      showToast('Failed to delete client', 'error');
    }
  };

  const formatDate = (ts?: { toDate: () => Date } | null) => {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your active client relationships</p>
        </div>
        <Button onClick={() => openFormModal()} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={clients.length} icon={<BuildingOffice2Icon className="h-6 w-6" />} color="blue" />
        <StatCard title="Active Clients" value={activeClients.length} icon={<BuildingOffice2Icon className="h-6 w-6" />} color="green" />
        <StatCard title="Total Est. Value" value={`$${totalEstimatedValue.toLocaleString()}`} icon={<CurrencyDollarIcon className="h-6 w-6" />} color="purple" />
        <StatCard title="Converted from Prospect" value={convertedCount} icon={<ArrowRightCircleIcon className="h-6 w-6" />} color="blue" />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ClientStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            {Object.values(ClientStatus).map(s => (
              <option key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* List */}
      <Card>
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>{searchQuery || statusFilter !== 'all' ? 'No clients match your filters' : 'No clients yet'}</p>
            <p className="text-sm mt-1">Convert a won prospect, or click &quot;Add Client&quot; to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Est. Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Added</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map(client => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{client.name}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                        <EnvelopeIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                          <PhoneIcon className="h-3 w-3 flex-shrink-0" />
                          {client.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {client.company || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={CLIENT_STATUS_COLORS[client.status] as Parameters<typeof Badge>[0]['variant']} size="sm">
                        {CLIENT_STATUS_LABELS[client.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {client.sourceProspectId ? (
                        <Badge variant="info" size="sm">Converted from Prospect</Badge>
                      ) : (
                        <Badge variant="default" size="sm">Direct Entry</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {client.estimatedValue ? (
                        <span className="font-medium text-green-700">${client.estimatedValue.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(client)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setClientToDelete(client)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {filteredClients.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {filteredClients.length} of {clients.length} clients
        </p>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingClient ? 'Edit Client' : 'Add Client'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="(555) 000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <Input value={formCompany} onChange={e => setFormCompany(e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <Input value={formWebsite} onChange={e => setFormWebsite(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Value ($)</label>
              <Input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="0" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as ClientStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ClientStatus).map(s => (
                  <option key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowFormModal(false)}>Cancel</Button>
            <Button onClick={handleSaveForm} loading={isSavingForm}>
              {editingClient ? 'Save Changes' : 'Add Client'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Delete Client"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Delete &quot;{clientToDelete?.name}&quot;? This is the permanent record of this client&apos;s
            history — this cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setClientToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <Card>
      <div className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colorMap[color] || 'text-gray-600 bg-gray-50'}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
