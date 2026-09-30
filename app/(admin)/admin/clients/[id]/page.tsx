'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getClientById,
  updateClient,
  deleteClient,
  addClientNote,
} from '@/services/client-service';
import { getProposals, getInvoices } from '@/services/invoice-service';
import { getProjects, createProject } from '@/services/project-service';
import { getActivitiesByLinkedClient, formatDuration } from '@/services/activity-service';
import {
  Client,
  ClientStatus,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
} from '@/types/client';
import { Proposal, Invoice, ProposalStatus, InvoiceStatus, PaymentInfo } from '@/types/invoice';
import {
  Project,
  ProjectType,
  ProjectStatus,
  ProjectPriority,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_COLORS,
} from '@/types/project';
import { ActivityEntry, ACTIVITY_CATEGORY_LABELS } from '@/types/activity';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';

type Tab = 'overview' | 'proposals' | 'invoices' | 'projects' | 'activity';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  proposals: 'Proposals',
  invoices: 'Invoices & Payments',
  projects: 'Projects',
  activity: 'Activity Log',
};

const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [ProposalStatus.DRAFT]: 'default',
  [ProposalStatus.SENT]: 'info',
  [ProposalStatus.VIEWED]: 'warning',
  [ProposalStatus.ACCEPTED]: 'success',
  [ProposalStatus.REJECTED]: 'error',
  [ProposalStatus.EXPIRED]: 'error',
  [ProposalStatus.CONVERTED]: 'success',
};

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.SENT]: 'info',
  [InvoiceStatus.VIEWED]: 'warning',
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.PARTIALLY_PAID]: 'warning',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.CANCELLED]: 'error',
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [newNoteText, setNewNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formStatus, setFormStatus] = useState<ClientStatus>(ClientStatus.ACTIVE);
  const [formValue, setFormValue] = useState('');
  const [isSavingForm, setIsSavingForm] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [npName, setNpName] = useState('');
  const [npDescription, setNpDescription] = useState('');
  const [npType, setNpType] = useState<ProjectType>(ProjectType.CLIENT);
  const [npStatus, setNpStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [npPriority, setNpPriority] = useState<ProjectPriority>(ProjectPriority.MEDIUM);
  const [npDeadline, setNpDeadline] = useState('');
  const [npStartDate, setNpStartDate] = useState('');
  const [npScopeAmount, setNpScopeAmount] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);

  const loadData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const c = await getClientById(id);
      setClient(c);
      if (c) {
        const [p, i, pr, a] = await Promise.all([
          getProposals({ linkedClientId: c.id }),
          getInvoices({ linkedClientId: c.id }),
          getProjects({ linkedClientId: c.id }),
          getActivitiesByLinkedClient(c.id),
        ]);
        setProposals(p);
        setInvoices(i);
        setProjects(pr);
        setActivities(a);
      }
    } catch {
      showToast('Failed to load client', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (params.id) loadData(params.id as string);
  }, [params.id, loadData]);

  // Financial rollup — see plan §6: a project is billed through EITHER its linked
  // Invoices OR its manual scope/payment ledger, never both, to avoid double-counting.
  const financials = useMemo(() => {
    const projectsWithInvoice = new Set(
      invoices.filter(inv => inv.linkedProjectId).map(inv => inv.linkedProjectId)
    );
    const invoicedTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const invoicedReceived = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

    const ledgerOnlyProjects = projects.filter(p => !projectsWithInvoice.has(p.id));
    const chargedTotal = ledgerOnlyProjects.reduce((sum, p) => sum + (p.scopeAmount || 0), 0);
    const chargedReceived = ledgerOnlyProjects.reduce(
      (sum, p) => sum + p.payments.reduce((s, pay) => s + pay.amount, 0),
      0
    );

    const totalBilled = invoicedTotal + chargedTotal;
    const totalReceived = invoicedReceived + chargedReceived;
    const balanceDue = totalBilled - totalReceived;

    return { invoicedTotal, chargedTotal, totalBilled, totalReceived, balanceDue };
  }, [invoices, projects]);

  const allPayments = useMemo(() => {
    return invoices
      .flatMap(inv => inv.payments.map(p => ({ ...p, invoiceNumber: inv.invoiceNumber, invoiceId: inv.id })))
      .sort((a, b) => b.paidAt.toMillis() - a.paidAt.toMillis());
  }, [invoices]);

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openEditModal = () => {
    if (!client) return;
    setFormName(client.name);
    setFormEmail(client.email);
    setFormPhone(client.phone || '');
    setFormCompany(client.company || '');
    setFormWebsite(client.website || '');
    setFormStatus(client.status);
    setFormValue(client.estimatedValue ? String(client.estimatedValue) : '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!client || !formName.trim() || !formEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    setIsSavingForm(true);
    try {
      await updateClient(client.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        company: formCompany.trim() || undefined,
        website: formWebsite.trim() || undefined,
        status: formStatus,
        estimatedValue: formValue ? parseFloat(formValue) : undefined,
      });
      showToast('Client updated', 'success');
      setShowEditModal(false);
      loadData(client.id);
    } catch {
      showToast('Failed to update client', 'error');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    try {
      await deleteClient(client.id);
      showToast('Client deleted', 'success');
      router.push('/admin/clients');
    } catch {
      showToast('Failed to delete client', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!user || !client || !newNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      await addClientNote(client.id, newNoteText.trim(), user.uid, user.name);
      setNewNoteText('');
      showToast('Note added', 'success');
      loadData(client.id);
    } catch {
      showToast('Failed to add note', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const openNewProjectModal = () => {
    setNpName('');
    setNpDescription('');
    setNpType(ProjectType.CLIENT);
    setNpStatus(ProjectStatus.PLANNING);
    setNpPriority(ProjectPriority.MEDIUM);
    setNpDeadline('');
    setNpStartDate('');
    setNpScopeAmount('');
    setShowNewProjectModal(true);
  };

  const handleCreateProject = async () => {
    if (!user || !client || !npName.trim() || !npDeadline) {
      showToast('Name and deadline are required', 'error');
      return;
    }
    setIsSavingProject(true);
    try {
      await createProject(
        {
          name: npName.trim(),
          description: npDescription.trim(),
          type: npType,
          status: npStatus,
          priority: npPriority,
          deadline: Timestamp.fromDate(new Date(npDeadline)),
          ...(npStartDate && { startDate: Timestamp.fromDate(new Date(npStartDate)) }),
          progress: 0,
          linkedClientId: client.id,
          linkedClientName: client.name,
          ...(npScopeAmount && { scopeAmount: parseFloat(npScopeAmount) }),
        },
        user.uid
      );
      showToast('Project created', 'success');
      setShowNewProjectModal(false);
      loadData(client.id);
    } catch {
      showToast('Failed to create project', 'error');
    } finally {
      setIsSavingProject(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin/clients')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Clients
        </button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <Badge variant={CLIENT_STATUS_COLORS[client.status] as Parameters<typeof Badge>[0]['variant']}>
                {CLIENT_STATUS_LABELS[client.status]}
              </Badge>
            </div>
            {client.company && <p className="text-gray-600 mt-1">{client.company}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openEditModal} leftIcon={<PencilIcon className="h-4 w-4" />}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)} leftIcon={<TrashIcon className="h-4 w-4" />}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit overflow-x-auto">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Billed</p>
                  <p className="text-2xl font-bold text-gray-900">${financials.totalBilled.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Invoiced: ${financials.invoicedTotal.toLocaleString()} &middot; Charged (Non-Invoiced): ${financials.chargedTotal.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Received</p>
                  <p className="text-2xl font-bold text-green-700">${financials.totalReceived.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Balance Due</p>
                  <p className={`text-2xl font-bold ${financials.balanceDue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    ${financials.balanceDue.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 border-t pt-3">
                Projects with a linked invoice are counted under Invoiced; projects without one are counted under
                Charged, based on their logged scope/payments.
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact info */}
            <Card>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Contact</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      {client.phone}
                    </div>
                  )}
                  {client.company && (
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                      {client.company}
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                      <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                        {client.website}
                      </a>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Client Since</p>
                    <p className="text-gray-700">{formatDate(client.convertedAt || client.createdAt)}</p>
                  </div>
                  {client.sourceProspectId && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Source</p>
                      <Badge variant="info" size="sm" className="mt-0.5">Converted from Prospect</Badge>
                    </div>
                  )}
                  {client.estimatedValue !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Est. Value</p>
                      <p className="font-semibold text-green-700">${client.estimatedValue.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
                  Notes ({client.notes.length})
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
                  {client.notes.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No notes yet</p>
                  ) : (
                    [...client.notes]
                      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                      .map(note => (
                        <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {note.createdByName} &middot; {formatDate(note.createdAt)}
                          </p>
                        </div>
                      ))
                  )}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                  <Button size="sm" onClick={handleAddNote} loading={isSavingNote} disabled={!newNoteText.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Proposals tab */}
      {activeTab === 'proposals' && (
        <Card>
          {proposals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No proposals linked to this client yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposal #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proposals.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/proposals/${p.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{p.proposalNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{p.title || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={PROPOSAL_STATUS_COLORS[p.status]} size="sm">{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">${p.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Invoices & Payments tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Invoiced" value={`$${invoices.reduce((s, i) => s + i.total, 0).toLocaleString()}`} color="blue" />
            <StatCard title="Total Paid" value={`$${invoices.reduce((s, i) => s + i.amountPaid, 0).toLocaleString()}`} color="green" />
            <StatCard title="Total Outstanding" value={`$${invoices.reduce((s, i) => s + i.amountDue, 0).toLocaleString()}`} color="red" />
          </div>

          <Card>
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No invoices linked to this client yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map(inv => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          <Badge variant={INVOICE_STATUS_COLORS[inv.status]} size="sm">{inv.status}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">${inv.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-700">${inv.amountPaid.toLocaleString()}</td>
                        <td className="px-4 py-3">${inv.amountDue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(inv.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Payments Received</p>
            </div>
            {allPayments.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No payments recorded yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allPayments.map((p: PaymentInfo & { invoiceNumber: string; invoiceId: string }, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.paidAt)}</td>
                        <td className="px-4 py-3 text-gray-700">{p.invoiceNumber}</td>
                        <td className="px-4 py-3 font-medium text-green-700">${p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.paymentMethod || '—'}
                          {p.cardBrand && p.cardLast4 && ` (${p.cardBrand} •••• ${p.cardLast4})`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Projects tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewProjectModal} leftIcon={<PlusIcon className="h-4 w-4" />}>
              New Project
            </Button>
          </div>
          <Card>
            {projects.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No projects for this client yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map(proj => (
                      <tr
                        key={proj.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/projects/${proj.id}`)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{proj.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant={PROJECT_STATUS_COLORS[proj.status] as Parameters<typeof Badge>[0]['variant']} size="sm">
                            {PROJECT_STATUS_LABELS[proj.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={PROJECT_PRIORITY_COLORS[proj.priority] as Parameters<typeof Badge>[0]['variant']} size="sm">
                            {PROJECT_PRIORITY_LABELS[proj.priority]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{proj.progress}%</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(proj.deadline)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Activity Log tab */}
      {activeTab === 'activity' && (
        <Card>
          {activities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No activity logged for this client yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activities.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(a.startTime)}</td>
                      <td className="px-4 py-3 text-gray-700">{a.userName}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">{ACTIVITY_CATEGORY_LABELS[a.category]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDuration(a.durationMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Edit Client Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Client" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <Input value={formCompany} onChange={e => setFormCompany(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <Input value={formWebsite} onChange={e => setFormWebsite(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Value ($)</label>
              <Input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} min="0" />
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
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={isSavingForm}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Client" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Delete &quot;{client.name}&quot;? This is the permanent record of this client&apos;s history — this
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* New Project Modal */}
      <Modal isOpen={showNewProjectModal} onClose={() => setShowNewProjectModal(false)} title="New Project" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-2">
            <ArrowRightCircleIcon className="h-4 w-4" />
            Linked to client: <span className="font-medium text-gray-700">{client.name}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input value={npName} onChange={e => setNpName(e.target.value)} placeholder="Project name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={npDescription}
              onChange={e => setNpDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={npType}
                onChange={e => setNpType(e.target.value as ProjectType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={npStatus}
                onChange={e => setNpStatus(e.target.value as ProjectStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={npPriority}
                onChange={e => setNpPriority(e.target.value as ProjectPriority)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(ProjectPriority).map(p => <option key={p} value={p}>{PROJECT_PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope Amount ($)</label>
              <Input type="number" value={npScopeAmount} onChange={e => setNpScopeAmount(e.target.value)} placeholder="0" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={npStartDate}
                onChange={e => setNpStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <input
                type="date"
                value={npDeadline}
                onChange={e => setNpDeadline(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowNewProjectModal(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} loading={isSavingProject}>Create Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <Card>
      <div className={`p-4 rounded-lg ${colorMap[color] || ''}`}>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </Card>
  );
}
